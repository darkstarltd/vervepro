import React, { useEffect, useState } from 'react';
import { useAppContext } from '../../context/AppContext';
import { SlidersIcon } from '../icons';
import { FlowNode, DeepReadonly } from '../../types';

// Editor for 'Set State' node
const SetStateNodeEditor: React.FC<{ node: DeepReadonly<FlowNode> }> = ({ node }) => {
    const { state, dispatch } = useAppContext();
    const { pages, activePageId } = state;
    const activePage = pages.find(p => p.id === activePageId);
    const stateVariables = activePage?.stateDefinition || [];
    const activeFlow = activePage?.logicFlows?.[0];

    const [data, setData] = useState(node.data);

    useEffect(() => {
        setData(node.data);
    }, [node.data]);

    const handleUpdate = (updates: Partial<typeof data>) => {
        const newData = { ...data, ...updates };
        setData(newData);
        if (activeFlow && activePageId) {
            dispatch({
                type: 'UPDATE_FLOW_NODE',
                payload: { pageId: activePageId, flowId: activeFlow.id, nodeId: node.id, updates: { data: newData } }
            });
        }
    };
    
    return (
        <div className="space-y-4">
            <div>
                <label className="text-sm font-medium text-[var(--color-text-secondary)] mb-1 block">State Variable</label>
                <select
                    value={data.stateKey || ''}
                    onChange={(e) => handleUpdate({ stateKey: e.target.value })}
                    className="w-full bg-[var(--color-surface-light)] p-2 rounded text-sm border border-[var(--color-border)]"
                >
                    <option value="">Select variable...</option>
                    {stateVariables.map(v => <option key={v.name} value={v.name}>{v.name}</option>)}
                </select>
            </div>
            <div>
                <label className="text-sm font-medium text-[var(--color-text-secondary)] mb-1 block">Value</label>
                <input
                    type="text"
                    value={data.value || ''}
                    onChange={(e) => handleUpdate({ value: e.target.value })}
                    className="w-full bg-[var(--color-surface-light)] p-2 rounded text-sm border border-[var(--color-border)]"
                />
            </div>
        </div>
    );
};

// Editor for 'API Request' node
const ApiRequestNodeEditor: React.FC<{ node: DeepReadonly<FlowNode> }> = ({ node }) => {
    const { state, dispatch } = useAppContext();
    const { pages, activePageId } = state;
    const activePage = pages.find(p => p.id === activePageId);
    const apiSources = activePage?.apiDataSources || [];
    const activeFlow = activePage?.logicFlows?.[0];

    const handleUpdate = (apiSourceId: string) => {
        if (activeFlow && activePageId) {
            dispatch({
                type: 'UPDATE_FLOW_NODE',
                payload: { pageId: activePageId, flowId: activeFlow.id, nodeId: node.id, updates: { data: { apiSourceId } } }
            });
        }
    };

    return (
        <div>
            <label className="text-sm font-medium text-[var(--color-text-secondary)] mb-1 block">API Source</label>
            <select
                value={node.data.apiSourceId || ''}
                onChange={(e) => handleUpdate(e.target.value)}
                className="w-full bg-[var(--color-surface-light)] p-2 rounded text-sm border border-[var(--color-border)]"
            >
                <option value="">Select API source...</option>
                {apiSources.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
        </div>
    );
};

// Editor for 'Condition' (If/Else) node
const ConditionNodeEditor: React.FC<{ node: DeepReadonly<FlowNode> }> = ({ node }) => {
    const { state, dispatch } = useAppContext();
    const activePage = state.pages.find(p => p.id === state.activePageId);
    const activeFlow = activePage?.logicFlows?.[0];

    const handleUpdate = (condition: string) => {
        if (activeFlow && state.activePageId) {
            dispatch({
                type: 'UPDATE_FLOW_NODE',
                payload: { pageId: state.activePageId, flowId: activeFlow.id, nodeId: node.id, updates: { data: { condition } } }
            });
        }
    };

    return (
        <div>
            <label className="text-sm font-medium text-[var(--color-text-secondary)] mb-1 block">Condition Expression</label>
            <input
                type="text"
                value={node.data.condition || ''}
                onChange={(e) => handleUpdate(e.target.value)}
                placeholder="{{state.isLoggedIn}} === true"
                className="w-full bg-[var(--color-surface-light)] p-2 rounded text-sm border border-[var(--color-border)] font-mono"
            />
            <p className="text-xs text-[var(--color-text-tertiary)] mt-1">Use {{...}} to access state variables.</p>
        </div>
    );
};

// Editor for 'Log Message' node
const LogMessageNodeEditor: React.FC<{ node: DeepReadonly<FlowNode> }> = ({ node }) => {
    const { state, dispatch } = useAppContext();
    const activePage = state.pages.find(p => p.id === state.activePageId);
    const activeFlow = activePage?.logicFlows?.[0];

    const handleUpdate = (message: string) => {
        if (activeFlow && state.activePageId) {
            dispatch({
                type: 'UPDATE_FLOW_NODE',
                payload: { pageId: state.activePageId, flowId: activeFlow.id, nodeId: node.id, updates: { data: { message } } }
            });
        }
    };

    return (
        <div>
            <label className="text-sm font-medium text-[var(--color-text-secondary)] mb-1 block">Message to Log</label>
            <textarea
                value={node.data.message || ''}
                onChange={(e) => handleUpdate(e.target.value)}
                rows={3}
                className="w-full bg-[var(--color-surface-light)] p-2 rounded text-sm border border-[var(--color-border)]"
            />
             <p className="text-xs text-[var(--color-text-tertiary)] mt-1">This message will appear in the browser's developer console.</p>
        </div>
    );
};

const ShowToastNodeEditor: React.FC<{ node: DeepReadonly<FlowNode> }> = ({ node }) => {
    const { state, dispatch } = useAppContext();
    const activePage = state.pages.find(p => p.id === state.activePageId);
    const activeFlow = activePage?.logicFlows?.[0];

    const handleUpdate = (updates: Partial<FlowNode['data']>) => {
        if (activeFlow && state.activePageId) {
            dispatch({
                type: 'UPDATE_FLOW_NODE',
                payload: { pageId: state.activePageId, flowId: activeFlow.id, nodeId: node.id, updates: { data: { ...node.data, ...updates } } }
            });
        }
    };

    return (
        <div className="space-y-3">
            <div>
                <label className="text-sm font-medium text-[var(--color-text-secondary)] mb-1 block">Message</label>
                <textarea
                    value={node.data.message || ''}
                    onChange={(e) => handleUpdate({ message: e.target.value })}
                    rows={3}
                    className="w-full bg-[var(--color-surface-light)] p-2 rounded text-sm border border-[var(--color-border)]"
                />
            </div>
            <div>
                <label className="text-sm font-medium text-[var(--color-text-secondary)] mb-1 block">Toast Type</label>
                <select
                    value={node.data.toastType || 'blank'}
                    onChange={(e) => handleUpdate({ toastType: e.target.value as FlowNode['data']['toastType'] })}
                    className="w-full bg-[var(--color-surface-light)] p-2 rounded text-sm border border-[var(--color-border)]"
                >
                    <option value="blank">Default</option>
                    <option value="success">Success</option>
                    <option value="error">Error</option>
                    <option value="loading">Loading</option>
                </select>
            </div>
        </div>
    );
};


export const NodeProperties: React.FC = () => {
    const { state } = useAppContext();
    const { pages, activePageId, selectedLogicNodeId } = state;
    const activePage = pages.find(p => p.id === activePageId);
    const activeFlow = activePage?.logicFlows?.[0];
    const selectedNode = activeFlow?.nodes.find(n => n.id === selectedLogicNodeId);

    if (!selectedNode) {
        return (
            <div className="h-full flex flex-col items-center justify-center text-center p-4">
                <div className="text-5xl text-[var(--color-text-tertiary)] mb-4"><SlidersIcon /></div>
                <h3 className="font-bold text-lg">Node Properties</h3>
                <p className="text-sm text-[var(--color-text-secondary)]">Select a node on the canvas to see its properties.</p>
            </div>
        );
    }
    
    const renderEditor = () => {
        switch(selectedNode.type) {
            case 'set-state':
                return <SetStateNodeEditor node={selectedNode} />;
            case 'api-request':
                return <ApiRequestNodeEditor node={selectedNode} />;
            case 'condition':
                return <ConditionNodeEditor node={selectedNode} />;
            case 'log-message':
                return <LogMessageNodeEditor node={selectedNode} />;
            case 'show-toast':
                return <ShowToastNodeEditor node={selectedNode} />;
            default:
                return <p className="text-sm text-[var(--color-text-tertiary)]">No properties to edit for this node type.</p>
        }
    }

    return (
        <div className="p-4">
            <div className="pb-4 border-b border-[var(--color-border)]">
                <h3 className="font-bold text-lg">{selectedNode.name}</h3>
                <p className="text-xs text-[var(--color-text-tertiary)] font-mono">{selectedNode.type}</p>
            </div>
            <div className="mt-4">
                {renderEditor()}
            </div>
        </div>
    );
};