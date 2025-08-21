import React, { useState, useCallback, useRef } from 'react';
import { DndContext, DragEndEvent, useSensor, useSensors, MouseSensor, TouchSensor, DragStartEvent, DragMoveEvent, closestCenter } from '@dnd-kit/core';
import { FlowCanvas } from './FlowCanvas';
import { FlowsPanel } from './FlowsPanel';
import { NodePalette } from './NodePalette';
import { NodeProperties } from './NodeProperties';
import { useAppContext } from '../../context/AppContext';
import { FlowNode, FlowConnection } from '../../types';
import { v4 as uuidv4 } from 'uuid';
import { PALETTE_NODES } from './NodePalette';

export const LogicView: React.FC = () => {
    const { state, dispatch } = useAppContext();
    const { pages, activePageId } = state;
    const activePage = pages.find(p => p.id === activePageId);
    const activeFlow = activePage?.logicFlows?.[0];

    const [newConnectionLine, setNewConnectionLine] = useState<{ start: { x: number; y: number; }; end: { x: number; y: number; }; } | null>(null);
    const connectionStartData = useRef<{ nodeId: string; handleId: string; } | null>(null);
    
    const sensors = useSensors(useSensor(MouseSensor), useSensor(TouchSensor));

    const handleDragStart = (event: DragStartEvent) => {
        // This is for dragging from palette
    };

    const handleDragEnd = (event: DragEndEvent) => {
        if (event.over && event.over.id === 'flow-canvas-droppable' && event.active.data.current?.isPaletteNode) {
            const nodeInfo = PALETTE_NODES.find(n => n.type === event.active.data.current?.type);
            const canvasRect = (event.over.rect as DOMRect);
            
            // This is a simplified position calculation. A real implementation would account for zoom/pan.
            const position = {
                x: event.active.rect.current.initial!.left - canvasRect.left - 50,
                y: event.active.rect.current.initial!.top - canvasRect.top - 20,
            };

            if (nodeInfo && activeFlow && activePageId) {
                const newNode: FlowNode = {
                    ...nodeInfo.defaultNode,
                    id: uuidv4(),
                    position,
                };
                dispatch({
                    type: 'ADD_FLOW_NODE',
                    payload: { pageId: activePageId, flowId: activeFlow.id, node: newNode }
                });
            }
        }
    };

    const handleStartConnection = useCallback((nodeId: string, handleId: string, startPos: { x: number; y: number }) => {
        connectionStartData.current = { nodeId, handleId };
        setNewConnectionLine({ start: startPos, end: startPos });
    }, []);

    const handleMoveConnection = useCallback((movePos: { x: number; y: number }) => {
        if (newConnectionLine) {
            setNewConnectionLine(prev => prev ? { ...prev, end: movePos } : null);
        }
    }, [newConnectionLine]);

    const handleEndConnection = useCallback((targetNodeId?: string, targetHandleId?: string) => {
        if (connectionStartData.current && targetNodeId && targetHandleId && activeFlow && activePageId) {
            const newConnection: FlowConnection = {
                id: uuidv4(),
                sourceNodeId: connectionStartData.current.nodeId,
                sourceHandleId: connectionStartData.current.handleId,
                targetNodeId,
                targetHandleId
            };
            dispatch({ type: 'ADD_FLOW_CONNECTION', payload: { pageId: activePageId, flowId: activeFlow.id, connection: newConnection } });
        }
        setNewConnectionLine(null);
        connectionStartData.current = null;
    }, [activeFlow, activePageId, dispatch]);

    return (
        <DndContext onDragStart={handleDragStart} onDragEnd={handleDragEnd} sensors={sensors} collisionDetection={closestCenter}>
            <div className="flex h-full">
                <aside className="w-72 bg-[var(--color-surface)] border-r border-[var(--color-border)] flex flex-col">
                    <FlowsPanel />
                    <div className="border-t border-[var(--color-border)]">
                        <NodePalette />
                    </div>
                </aside>
                <main className="flex-1 relative">
                    <FlowCanvas
                        onStartConnection={handleStartConnection}
                        onMoveConnection={handleMoveConnection}
                        onEndConnection={handleEndConnection}
                        newConnectionLine={newConnectionLine}
                    />
                </main>
                <aside className="w-80 bg-[var(--color-surface)] border-l border-[var(--color-border)]">
                    <NodeProperties />
                </aside>
            </div>
        </DndContext>
    );
};