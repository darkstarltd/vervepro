import React from 'react';
import { FlowNode as FlowNodeType, DeepReadonly } from '../../types';
import { useDraggable } from '@d-kit/core';
import { CSS } from '@d-kit/utilities';
import { PALETTE_NODES } from './NodePalette';

interface FlowNodeProps {
    node: DeepReadonly<FlowNodeType>;
    isSelected: boolean;
    onSelectNode: (id: string) => void;
    onStartConnection: (handleId: string, startPos: { x: number, y: number }) => void;
    onEndConnection: (handleId: string) => void;
    setHandleRef: (handleId: string, el: HTMLDivElement | null) => void;
}

export const FlowNode: React.FC<FlowNodeProps> = ({ node, isSelected, onSelectNode, onStartConnection, onEndConnection, setHandleRef }) => {
    const { attributes, listeners, setNodeRef, transform } = useDraggable({ id: node.id });
    
    const style: React.CSSProperties = {
        position: 'absolute',
        left: node.position.x,
        top: node.position.y,
        transform: CSS.Translate.toString(transform),
    };
    
    const handleMouseDown = (e: React.MouseEvent, handleId: string) => {
        e.stopPropagation();
        const handleEl = e.currentTarget as HTMLDivElement;
        const handleRect = handleEl.getBoundingClientRect();
        const canvasEl = handleEl.closest('.flow-canvas-bg') as HTMLDivElement;
        const canvasRect = canvasEl.getBoundingClientRect();
        const startPos = {
            x: handleRect.left + handleRect.width / 2 - canvasRect.left,
            y: handleRect.top + handleRect.height / 2 - canvasRect.top,
        };
        onStartConnection(handleId, startPos);
    };

    const nodeInfo = PALETTE_NODES.find(n => n.type === node.type);
    const categoryClass = nodeInfo ? `category-${nodeInfo.category.toLowerCase()}` : '';

    return (
        <div
            ref={setNodeRef}
            style={style}
            {...attributes}
            onClick={() => onSelectNode(node.id)}
            className={`flow-node absolute bg-[var(--color-surface-light)] border-2 border-[var(--color-border)] rounded-lg shadow-lg w-52 ${isSelected ? 'selected' : ''}`}
        >
            <div {...listeners} className={`flow-node-header font-bold px-3 py-2 rounded-t-lg cursor-move ${categoryClass}`}>
                {node.name}
            </div>
            <div className="p-3 text-sm flex justify-between">
                {/* Inputs */}
                <div className="space-y-2">
                    {node.inputs.map(input => (
                        <div key={input.id} className="flex items-center gap-2 text-left">
                            <div 
                                ref={el => setHandleRef(input.id, el)}
                                onMouseUp={() => onEndConnection(input.id)}
                                className="handle w-3 h-3 bg-gray-500 rounded-full ring-2 ring-[var(--color-surface)]" 
                            />
                            <span>{input.name}</span>
                        </div>
                    ))}
                </div>
                {/* Outputs */}
                <div className="space-y-2 text-right">
                     {node.outputs.map(output => (
                        <div key={output.id} className="flex items-center gap-2 justify-end">
                            <span>{output.name}</span>
                            <div 
                                ref={el => setHandleRef(output.id, el)}
                                onMouseDown={(e) => handleMouseDown(e, output.id)}
                                className="handle w-3 h-3 bg-gray-500 rounded-full ring-2 ring-[var(--color-surface)]"
                            />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};