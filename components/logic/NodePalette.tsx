import React from 'react';
import { FaBolt, FaArrowRightToBracket, FaPencil, FaTriangleExclamation, FaPaperPlane, FaComment, FaPlus, FaMinus, FaToggleOn } from 'react-icons/fa6';
import { useDraggable } from '@dnd-kit/core';

export const PALETTE_NODES = [
    { type: 'on-trigger', name: 'On Trigger', icon: <FaBolt />, category: 'Events', defaultNode: { name: 'On Trigger', type: 'on-trigger', inputs: [], outputs: [{ id: 'exec-out', name: 'Exec', type: 'exec' as const }], data: {} } },
    { type: 'set-state', name: 'Set State', icon: <FaPencil />, category: 'Actions', defaultNode: { name: 'Set State', type: 'set-state', inputs: [{id: 'exec-in', name: 'Exec', type: 'exec' as const}], outputs: [{id: 'exec-out', name: 'Exec', type: 'exec' as const}], data: { stateKey: '', value: '' } } },
    { type: 'increment-state', name: 'Increment State', icon: <FaPlus />, category: 'Actions', defaultNode: { name: 'Increment State', type: 'increment-state', inputs: [{id: 'exec-in', name: 'Exec', type: 'exec' as const}], outputs: [{id: 'exec-out', name: 'Exec', type: 'exec' as const}], data: { stateKey: '' } } },
    { type: 'decrement-state', name: 'Decrement State', icon: <FaMinus />, category: 'Actions', defaultNode: { name: 'Decrement State', type: 'decrement-state', inputs: [{id: 'exec-in', name: 'Exec', type: 'exec' as const}], outputs: [{id: 'exec-out', name: 'Exec', type: 'exec' as const}], data: { stateKey: '' } } },
    { type: 'toggle-state', name: 'Toggle State', icon: <FaToggleOn />, category: 'Actions', defaultNode: { name: 'Toggle State', type: 'toggle-state', inputs: [{id: 'exec-in', name: 'Exec', type: 'exec' as const}], outputs: [{id: 'exec-out', name: 'Exec', type: 'exec' as const}], data: { stateKey: '' } } },
    { type: 'api-request', name: 'API Request', icon: <FaPaperPlane />, category: 'Actions', defaultNode: { name: 'API Request', type: 'api-request', inputs: [{id: 'exec-in', name: 'Exec', type: 'exec' as const}], outputs: [{id: 'exec-out', name: 'Exec', type: 'exec' as const}, {id: 'data-out', name: 'Data', type: 'data' as const}], data: { apiSourceId: '' } } },
    { type: 'show-toast', name: 'Show Toast', icon: <FaComment />, category: 'Actions', defaultNode: { name: 'Show Toast', type: 'show-toast', inputs: [{id: 'exec-in', name: 'Exec', type: 'exec' as const}], outputs: [{id: 'exec-out', name: 'Exec', type: 'exec' as const}], data: { message: 'Hello!', toastType: 'success' as const } } },
    { type: 'condition', name: 'If/Else', icon: <FaTriangleExclamation />, category: 'Logic', defaultNode: { name: 'If/Else', type: 'condition', inputs: [{id: 'exec-in', name: 'Exec', type: 'exec' as const}, {id: 'data-in', name: 'Condition', type: 'data' as const}], outputs: [{id: 'exec-true', name: 'True', type: 'exec' as const}, {id: 'exec-false', name: 'False', type: 'exec' as const}], data: { condition: '' } } },
    { type: 'log-message', name: 'Log Message', icon: <FaArrowRightToBracket />, category: 'Debugging', defaultNode: { name: 'Log Message', type: 'log-message', inputs: [{id: 'exec-in', name: 'Exec', type: 'exec' as const}], outputs: [], data: { message: 'Hello World' } } },
];

const DraggableNode: React.FC<{ node: (typeof PALETTE_NODES)[number] }> = ({ node }) => {
    const { attributes, listeners, setNodeRef } = useDraggable({
        id: `palette-node-${node.type}`,
        data: {
            type: node.type,
            isPaletteNode: true,
        },
    });

    return (
        <div
            ref={setNodeRef}
            {...listeners}
            {...attributes}
            className="p-2 text-sm bg-[var(--color-surface-light)] rounded-md cursor-grab active:cursor-grabbing hover:bg-[var(--color-border)] flex items-center gap-2"
            title={`Drag to add ${node.name}`}
        >
            <span className="text-[var(--color-primary)]">{node.icon}</span>
            <span className="truncate">{node.name}</span>
        </div>
    );
};

export const NodePalette: React.FC = () => {
    return (
        <div className="p-2">
            <div className="p-2 font-bold text-lg border-b border-[var(--color-border)] mb-2">
                Nodes
            </div>
            <div className="space-y-2">
                {PALETTE_NODES.map(node => (
                    <DraggableNode key={node.type} node={node} />
                ))}
            </div>
        </div>
    );
};