import React from 'react';
import { StateVariable, StateVariableType } from '../types';
import { PlusIcon, TrashIcon } from './icons';
import { useAppContext } from '../context/AppContext';

interface StatePanelProps {
    scope: 'page' | 'global';
    variables: readonly StateVariable[];
}

export const StatePanel: React.FC<StatePanelProps> = ({ scope, variables }) => {
    const { dispatch } = useAppContext();

    const handleUpdate = (index: number, updates: Partial<StateVariable>) => {
        const variable = { ...variables[index], ...updates };
        const actionType = scope === 'global' ? 'DEFINE_GLOBAL_STATE_VARIABLE' : 'DEFINE_STATE_VARIABLE';
        dispatch({ type: actionType, payload: { variable, index } });
    };

    const handleAdd = () => {
        const variable: StateVariable = {
            name: `newVar${variables.length}`,
            type: 'string',
            initialValue: '',
        };
        const actionType = scope === 'global' ? 'DEFINE_GLOBAL_STATE_VARIABLE' : 'DEFINE_STATE_VARIABLE';
        dispatch({ type: actionType, payload: { variable } });
    };

    const handleDelete = (name: string) => {
        const actionType = scope === 'global' ? 'DELETE_GLOBAL_STATE_VARIABLE' : 'DELETE_STATE_VARIABLE';
        dispatch({ type: actionType, payload: { name } });
    };

    return (
        <div className="p-2 space-y-3">
            {variables.map((v, index) => (
                <div key={index} className="bg-[var(--color-surface-light)] p-2 rounded-md space-y-2">
                    <div className="grid grid-cols-10 gap-2 items-center">
                        <input
                            type="text"
                            value={v.name}
                            onChange={(e) => handleUpdate(index, { name: e.target.value })}
                            placeholder="Variable Name"
                            className="col-span-4 bg-[var(--color-background)] p-1 rounded text-sm"
                        />
                        <select
                            value={v.type}
                            onChange={(e) => handleUpdate(index, { type: e.target.value as StateVariableType })}
                            className="col-span-2 bg-[var(--color-background)] p-1 rounded text-sm"
                        >
                            <option value="string">String</option>
                            <option value="number">Number</option>
                            <option value="boolean">Boolean</option>
                        </select>
                        <input
                            type="text"
                            value={String(v.initialValue)}
                            onChange={(e) => handleUpdate(index, { initialValue: e.target.value })}
                            placeholder="Initial Value"
                            className="col-span-3 bg-[var(--color-background)] p-1 rounded text-sm"
                        />
                        <button onClick={() => handleDelete(v.name)} className="col-span-1 text-gray-400 hover:text-red-500 flex justify-center">
                            <TrashIcon size={14} />
                        </button>
                    </div>
                </div>
            ))}
            <button onClick={handleAdd} className="w-full text-xs text-center p-1 bg-[var(--color-surface-light)] hover:bg-[var(--color-border)] rounded-md flex items-center justify-center gap-1">
                <PlusIcon /> Add Variable
            </button>
        </div>
    );
};
