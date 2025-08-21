import React, { useRef, useMemo, useCallback } from 'react';
import { useAppContext } from '../../context/AppContext';
import { FlowNode } from './FlowNode';
import { DndContext, useDroppable, DragEndEvent, closestCenter, useSensor, MouseSensor, TouchSensor, useSensors } from '@dnd-kit/core';

interface FlowCanvasProps {
    onStartConnection: (nodeId: string, handleId: string, startPos: { x: number, y: number }) => void;
    onMoveConnection: (movePos: { x: number, y: number }) => void;
    onEndConnection: (targetNodeId?: string, targetHandleId?: string) => void;
    newConnectionLine: { start: { x: number, y: number }, end: { x: number, y: number } } | null;
}

const getPathD = (startPos: { x: number, y: number }, endPos: { x: number, y: number }): string => {
    const dx = endPos.x - startPos.x;
    const curveX = dx * 0.5;
    return `M ${startPos.x} ${startPos.y} C ${startPos.x + curveX} ${startPos.y}, ${endPos.x - curveX} ${endPos.y}, ${endPos.x} ${endPos.y}`;
};

export const FlowCanvas: React.FC<FlowCanvasProps> = ({ onStartConnection, onMoveConnection, onEndConnection, newConnectionLine }) => {
    const { state, dispatch } = useAppContext();
    const { pages, activePageId, selectedLogicNodeId } = state;
    const activePage = pages.find(p => p.id === activePageId);
    const activeFlow = activePage?.logicFlows?.[0];
    const canvasRef = useRef<HTMLDivElement>(null);
    const handleRefs = useRef<Record<string, HTMLDivElement | null>>({});

    const { setNodeRef } = useDroppable({ id: 'flow-canvas-droppable' });
    const sensors = useSensors(useSensor(MouseSensor), useSensor(TouchSensor));
    
    const handleNodeDragEnd = (event: DragEndEvent) => {
        const { active, delta } = event;
        const nodeId = active.id as string;
        const node = activeFlow?.nodes.find(n => n.id === nodeId);
        if (node && activeFlow && activePageId) {
            const newPosition = { x: node.position.x + delta.x, y: node.position.y + delta.y };
            dispatch({
                type: 'UPDATE_FLOW_NODE',
                payload: { pageId: activePageId, flowId: activeFlow.id, nodeId, updates: { position: newPosition } }
            });
        }
    };
    
    const getHandlePosition = useCallback((nodeId: string, handleId: string) => {
        const handleEl = handleRefs.current[`${nodeId}-${handleId}`];
        const canvasEl = canvasRef.current;
        if (!handleEl || !canvasEl) return { x: 0, y: 0 };

        const handleRect = handleEl.getBoundingClientRect();
        const canvasRect = canvasEl.getBoundingClientRect();
        
        return {
            x: handleRect.left + handleRect.width / 2 - canvasRect.left,
            y: handleRect.top + handleRect.height / 2 - canvasRect.top,
        };
    }, []);

    const renderedConnections = useMemo(() => {
        return activeFlow?.connections.map(conn => {
            const startPos = getHandlePosition(conn.sourceNodeId, conn.sourceHandleId);
            const endPos = getHandlePosition(conn.targetNodeId, conn.targetHandleId);
            return <path key={conn.id} d={getPathD(startPos, endPos)} className="flow-connection" />;
        }) || [];
    }, [activeFlow?.connections, getHandlePosition, state.pages, state.activePageId]);
    
    const handleCanvasMouseMove = (e: React.MouseEvent) => {
        if(newConnectionLine) {
            const canvasRect = canvasRef.current!.getBoundingClientRect();
            onMoveConnection({x: e.clientX - canvasRect.left, y: e.clientY - canvasRect.top });
        }
    }

    return (
        <div 
            ref={canvasRef}
            className="w-full h-full flow-canvas-bg relative overflow-hidden" 
            onMouseMove={handleCanvasMouseMove}
            onMouseUp={() => onEndConnection()}
        >
            <DndContext sensors={sensors} onDragEnd={handleNodeDragEnd} collisionDetection={closestCenter}>
                <div ref={setNodeRef} className="w-full h-full">
                    <svg className="absolute inset-0 w-full h-full pointer-events-none">
                        {renderedConnections}
                        {newConnectionLine && <path d={getPathD(newConnectionLine.start, newConnectionLine.end)} className="flow-connection-temp" />}
                    </svg>

                    {activeFlow ? activeFlow.nodes.map(node => (
                        <FlowNode
                            key={node.id}
                            node={node}
                            isSelected={selectedLogicNodeId === node.id}
                            onSelectNode={(id) => dispatch({ type: 'SET_SELECTED_LOGIC_NODE_ID', payload: id })}
                            onStartConnection={(handleId, startPos) => onStartConnection(node.id, handleId, startPos)}
                            onEndConnection={(handleId) => onEndConnection(node.id, handleId)}
                            setHandleRef={(handleId, el) => handleRefs.current[`${node.id}-${handleId}`] = el}
                        />
                    )) : (
                        <div className="flex h-full items-center justify-center text-center text-[var(--color-text-tertiary)]">
                            <div>
                                <p>No active logic flow.</p>
                                <p className="text-sm">Select a flow or create a new one from the panel on the left.</p>
                            </div>
                        </div>
                    )}
                </div>
            </DndContext>
        </div>
    );
};