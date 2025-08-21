import { DeepReadonly, LogicFlow, ApiDataSource, MockApiEndpoint } from '../types';
import { toast } from 'react-hot-toast';

const getNestedValue = (obj: any, path: string): any => {
    return path.split('.').reduce((acc, part) => acc && acc[part], obj);
};

const setNestedValue = (obj: any, path: string, value: any): void => {
    const keys = path.split('.');
    const lastKey = keys.pop();
    if (!lastKey) return;
    const finalObj = keys.reduce((acc, part) => {
        if (!acc[part]) acc[part] = {};
        return acc[part];
    }, obj);
    finalObj[lastKey] = value;
};

const resolveValue = (value: any, state: any): any => {
    if (typeof value !== 'string') return value;
    return value.replace(/\{\{\s*(.*?)\s*\}\}/g, (match, key) => {
        const val = getNestedValue(state, key.trim());
        return val !== undefined ? String(val) : match;
    });
};

const evaluateCondition = (condition: string, state: any): boolean => {
    const resolvedCondition = condition.replace(/\{\{\s*(.*?)\s*\}\}/g, (match, key) => {
        const value = getNestedValue(state, key.trim());
        return JSON.stringify(value);
    });

    try {
        // Use a Function constructor for safer evaluation than eval()
        return new Function(`return ${resolvedCondition}`)();
    } catch (e) {
        console.error("Error evaluating condition:", e);
        return false;
    }
};

export const executeFlow = async (
    flow: DeepReadonly<LogicFlow>,
    initialState: { [key: string]: any },
    apiDataSources: DeepReadonly<ApiDataSource[]>,
    mockApiEndpoints: DeepReadonly<MockApiEndpoint[]>
): Promise<{ [key: string]: any }> => {
    let state = JSON.parse(JSON.stringify(initialState));
    const startNode = flow.nodes.find(n => n.type === 'on-trigger');

    if (!startNode) {
        console.error("Flow has no start node");
        return state;
    }

    let currentNode = startNode;
    let execHandleId = 'exec-out'; // Default output for start node
    const MAX_STEPS = 100;
    let step = 0;

    while (currentNode && step < MAX_STEPS) {
        step++;
        const connection = flow.connections.find(c => c.sourceNodeId === currentNode.id && c.sourceHandleId === execHandleId);
        if (!connection) break; // End of flow branch

        const nextNode = flow.nodes.find(n => n.id === connection.targetNodeId);
        if (!nextNode) break;

        currentNode = nextNode;
        execHandleId = 'exec-out'; // Default next handle

        switch (currentNode.type) {
            case 'set-state': {
                const { stateKey, value } = currentNode.data;
                const resolved = resolveValue(value, state);
                setNestedValue(state, stateKey, resolved);
                break;
            }
            case 'increment-state': {
                const { stateKey } = currentNode.data;
                const currentValue = getNestedValue(state, stateKey);
                if (typeof currentValue === 'number') {
                    setNestedValue(state, stateKey, currentValue + 1);
                }
                break;
            }
            case 'decrement-state': {
                const { stateKey } = currentNode.data;
                const currentValue = getNestedValue(state, stateKey);
                if (typeof currentValue === 'number') {
                    setNestedValue(state, stateKey, currentValue - 1);
                }
                break;
            }
            case 'toggle-state': {
                const { stateKey } = currentNode.data;
                const currentValue = getNestedValue(state, stateKey);
                if (typeof currentValue === 'boolean') {
                    setNestedValue(state, stateKey, !currentValue);
                }
                break;
            }
            case 'condition': {
                const { condition } = currentNode.data;
                const result = evaluateCondition(condition, state);
                execHandleId = result ? 'exec-true' : 'exec-false';
                break;
            }
            case 'api-request': {
                const { apiSourceId } = currentNode.data;
                const apiSource = apiDataSources.find(ds => ds.id === apiSourceId);
                if (apiSource) {
                    const toastId = toast.loading(`Calling API: ${apiSource.name}...`);
                    try {
                      // Mock API logic
                      const endpoint = mockApiEndpoints.find(e => {
                        const path = e.path.startsWith('/') ? e.path : '/' + e.path;
                        return apiSource.url.endsWith(path) && e.method === apiSource.method;
                      });
                      
                      let data: any;
                      if (endpoint) {
                        console.log(`[Mock API] Intercepted request to ${apiSource.url}`);
                        data = JSON.parse(endpoint.responseBody);
                      } else {
                        const headers = apiSource.headers.reduce((acc, h) => ({...acc, [h.key]: h.value }), {});
                        const response = await fetch(apiSource.url, { method: apiSource.method, headers });
                        if (!response.ok) throw new Error(`API call failed with status ${response.status}`);
                        data = await response.json();
                      }
                      
                      // For now, let's assume we store the response under the API source's name
                      state[apiSource.name] = data;
                      toast.success(`API call to ${apiSource.name} successful!`, { id: toastId });

                    } catch (error) {
                        console.error(error);
                        toast.error(error instanceof Error ? error.message : `API call to ${apiSource.name} failed.`, { id: toastId });
                    }
                }
                break;
            }
            case 'log-message': {
                const { message } = currentNode.data;
                const resolvedMessage = resolveValue(message, state);
                console.log('[Flow Log]:', resolvedMessage);
                break;
            }
            case 'show-toast': {
                const { message, toastType = 'blank' } = currentNode.data;
                const resolvedMessage = resolveValue(message, state);
                switch (toastType) {
                    case 'success': toast.success(resolvedMessage); break;
                    case 'error': toast.error(resolvedMessage); break;
                    case 'loading': toast.loading(resolvedMessage); break;
                    default: toast(resolvedMessage); break;
                }
                break;
            }
        }
    }
    
    if (step === MAX_STEPS) {
      console.error("Flow execution limit reached. Check for infinite loops.");
    }

    return state;
};
