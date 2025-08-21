import React, { useRef, useCallback, useEffect, useState } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { RenderElement } from './RenderElement';
import { useAppContext } from '../context/AppContext';
import { Element, DeepReadonly, MultiplayerCursor } from '../types';
import { MousePointer, X, Smartphone, Tablet, Monitor, RotateCcw } from 'lucide-react';
import { MultiplayerCursors } from './MultiplayerCursors';

interface CanvasProps {
  elements: readonly DeepReadonly<Element>[];
  dropIndicator: { parentId: string | null; index: number } | null;
  onContextMenu: (e: React.MouseEvent, elementId: string) => void;
  mode: 'edit' | 'preview';
  cursors: readonly DeepReadonly<MultiplayerCursor>[];
}

const findAllElementsOfType = (elements: readonly DeepReadonly<Element>[], type: string): DeepReadonly<Element>[] => {
  let found: DeepReadonly<Element>[] = [];
  for (const element of elements) {
    if (element.type === type) found.push(element);
    if (element.children) found = [...found, ...findAllElementsOfType(element.children, type)];
  }
  return found;
};
const filterOutElementsOfType = (elements: readonly DeepReadonly<Element>[], type: string): DeepReadonly<Element>[] => {
  return elements.reduce((acc, element) => {
    if (element.type === type) return acc;
    const newElement: Element = JSON.parse(JSON.stringify(element));
    if (newElement.children) {
      newElement.children = filterOutElementsOfType(newElement.children, type) as Element[];
    }
    acc.push(newElement);
    return acc;
  }, [] as DeepReadonly<Element>[]);
};

const DropIndicator = () => <div className="drop-indicator" />;

const CanvasContent: React.FC<Omit<CanvasProps, 'cursors'>> = ({ elements, dropIndicator, mode, onContextMenu }) => {
    const { setNodeRef, isOver } = useDroppable({ id: 'canvas-droppable-area' });
    const { state: { selectedElementId } } = useAppContext();

    const modals = findAllElementsOfType(elements, 'modal');
    const regularElements = filterOutElementsOfType(elements, 'modal');
    const isRootDropTarget = dropIndicator?.parentId === null;

    return (
        <div ref={setNodeRef} className={`h-full w-full rounded-lg p-4 ${isOver && mode === 'edit' ? 'bg-blue-50/10' : ''}`}>
          {regularElements.length === 0 && mode === 'edit' ? (
            <div className="flex flex-col items-center justify-center h-full border-2 border-dashed border-gray-700 rounded-lg">
               {isRootDropTarget && <DropIndicator />}
               <div className="text-center text-gray-500">
                <MousePointer />
                <h3 className="font-bold text-lg mt-4">Your Canvas is Empty</h3>
                <p className="text-sm">Drag components from the left panel to start building.</p>
               </div>
            </div>
          ) : (
            <SortableContext items={regularElements.map(el => el.id)} strategy={verticalListSortingStrategy}>
              {regularElements.map((element, index) => (
                <React.Fragment key={element.id}>
                  {isRootDropTarget && dropIndicator?.index === index && <DropIndicator />}
                  <RenderElement
                    element={element}
                    isSelected={mode === 'edit' && selectedElementId === element.id}
                    dropIndicator={dropIndicator}
                    onContextMenu={onContextMenu}
                    mode={mode}
                  />
                </React.Fragment>
              ))}
              {isRootDropTarget && dropIndicator?.index === regularElements.length && <DropIndicator />}
            </SortableContext>
          )}
          {modals.map(modal => (
           <RenderElement
            key={modal.id}
            element={modal}
            isSelected={mode === 'edit' && selectedElementId === modal.id}
            onContextMenu={onContextMenu}
            mode={mode}
          />
        ))}
        </div>
    );
};

const DevicePreviewControls: React.FC<{
    device: string; setDevice: (d: string) => void;
    orientation: 'portrait' | 'landscape'; setOrientation: (orientation: 'portrait' | 'landscape' | ((prev: 'portrait' | 'landscape') => 'portrait' | 'landscape')) => void;
}> = ({ device, setDevice, orientation, setOrientation }) => {
    return (
        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-full bg-[var(--color-surface)] p-1 rounded-t-lg border-b-0 border border-[var(--color-border)] flex items-center gap-2">
            <button onClick={() => setDevice('iphone-14-pro')} className={`px-2 py-1 text-xs rounded ${device === 'iphone-14-pro' ? 'bg-[var(--color-primary)]' : 'hover:bg-[var(--color-border)]'}`}><Smartphone size={14}/></button>
            <button onClick={() => setDevice('pixel-7')} className={`px-2 py-1 text-xs rounded ${device === 'pixel-7' ? 'bg-[var(--color-primary)]' : 'hover:bg-[var(--color-border)]'}`}><Smartphone size={14}/></button>
            <div className="w-px h-4 bg-[var(--color-border)] mx-1" />
            <button onClick={() => setOrientation(o => o === 'portrait' ? 'landscape' : 'portrait')} className="p-1.5 hover:bg-[var(--color-border)] rounded"><RotateCcw size={14}/></button>
        </div>
    );
};

export const Canvas: React.FC<CanvasProps> = ({ elements, dropIndicator, onContextMenu, mode, cursors }) => {
  const { state, setSelectedElementId, dispatch } = useAppContext();
  const { viewport, projectType, editingComponentId, customComponents, canvasWidth, canvasZoom } = state;
  const canvasContainerRef = useRef<HTMLDivElement>(null);
  
  const [device, setDevice] = useState('iphone-14-pro');
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('portrait');

  const editingComponent = editingComponentId ? customComponents.find(c => c.id === editingComponentId) : null;
  const isResizable = projectType === 'web' && !editingComponent && mode === 'edit';

  const handleResize = useCallback((newWidth: number) => {
    dispatch({ type: 'SET_CANVAS_WIDTH', payload: newWidth });
    if (newWidth < 480) {
      if (viewport !== 'mobile') dispatch({ type: 'SET_VIEWPORT', payload: 'mobile' });
    } else if (newWidth < 768) {
      if (viewport !== 'tablet') dispatch({ type: 'SET_VIEWPORT', payload: 'tablet' });
    } else {
      if (viewport !== 'desktop') dispatch({ type: 'SET_VIEWPORT', payload: 'desktop' });
    }
  }, [dispatch, viewport]);

  useEffect(() => {
    const resizer = canvasContainerRef.current?.querySelector('.canvas-resizer');
    const container = canvasContainerRef.current?.parentElement; // We resize based on the main view, not the relative div
    if (!resizer || !container || !isResizable) return;
    
    const onMouseMove = (e: MouseEvent) => {
      e.preventDefault();
      const rect = container.getBoundingClientRect();
      const newWidth = (e.clientX - rect.left) / canvasZoom;
      if (newWidth > 320 && newWidth < 2560) { // Min/max resize bounds
        handleResize(newWidth);
      }
    };
    
    const onMouseUp = () => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    };

    const onMouseDown = (e: MouseEvent) => {
      e.preventDefault();
      document.addEventListener('mousemove', onMouseMove);
      document.addEventListener('mouseup', onMouseUp);
    };

    resizer.addEventListener('mousedown', onMouseDown);
    
    return () => {
      resizer.removeEventListener('mousedown', onMouseDown);
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    };
  }, [isResizable, handleResize, canvasZoom]);


  const handleClick = (e: React.MouseEvent) => {
    if (mode === 'edit' && e.target === e.currentTarget) setSelectedElementId(null);
  };

  const isMobilePlatform = projectType === 'native' || projectType === 'flutter' || projectType === 'kotlin';
  
  const deviceDimensions = {
      'iphone-14-pro': { portrait: { w: '393px', h: '852px' }, landscape: { w: '852px', h: '393px' }},
      'pixel-7': { portrait: { w: '412px', h: '915px' }, landscape: { w: '915px', h: '412px' }}
  };
  
  const finalCanvasWidth = isResizable ? `${canvasWidth}px` : (isMobilePlatform ? deviceDimensions[device as keyof typeof deviceDimensions][orientation].w : '100%');
  const canvasHeight = isMobilePlatform ? deviceDimensions[device as keyof typeof deviceDimensions][orientation].h : '100%';

  return (
    <div className={`flex-1 p-8 overflow-auto bg-gray-900 flex justify-center items-start relative ${mode === 'preview' ? 'p-0' : ''}`} onClick={handleClick}>
       <MultiplayerCursors cursors={cursors} />
       <div 
        style={{ 
          transform: `scale(${canvasZoom})`,
          transformOrigin: 'top center',
          transition: 'transform 0.2s ease-out'
        }}
        className="pt-8"
      >
        <div 
          ref={canvasContainerRef}
          className="relative transition-all duration-300"
          style={{ width: finalCanvasWidth, height: canvasHeight }}
        >
            {isMobilePlatform && mode === 'edit' && <DevicePreviewControls device={device} setDevice={setDevice} orientation={orientation} setOrientation={setOrientation}/>}
          <div className="w-full h-full flex flex-col">
              {editingComponent && (
                <div className="flex-shrink-0 bg-[var(--color-surface)] p-2 rounded-t-lg border-b-2 border-[var(--color-primary)] flex justify-between items-center text-sm">
                    <span className="font-semibold">Editing Component: <span className="text-[var(--color-primary)]">{editingComponent.name}</span></span>
                    <button 
                        onClick={() => dispatch({ type: 'SET_EDITING_COMPONENT_ID', payload: null })}
                        className="flex items-center gap-1 text-xs px-2 py-1 bg-[var(--color-surface-light)] hover:bg-[var(--color-border)] rounded-md"
                    >
                       <X size={12}/> Return to Page
                    </button>
                </div>
              )}
              {isMobilePlatform ? (
                  <div className={`device-frame flex-1 ${device} ${orientation} ${editingComponent ? 'rounded-t-none' : ''}`}>
                      <div className={`device-frame-inner bg-white ${editingComponent ? 'rounded-t-none' : ''}`}>
                          <CanvasContent elements={elements} dropIndicator={dropIndicator} mode={mode} onContextMenu={onContextMenu}/>
                      </div>
                  </div>
              ) : (
                  <div className={`bg-white shadow-2xl flex-1 ${editingComponent ? 'rounded-b-lg' : 'rounded-lg'} transition-width duration-300 ${mode === 'preview' ? 'rounded-none' : ''}`}>
                      <CanvasContent elements={elements} dropIndicator={dropIndicator} mode={mode} onContextMenu={onContextMenu} />
                  </div>
              )}
          </div>
          {isResizable && (
            <div className="canvas-resizer" title="Resize Canvas" />
          )}
        </div>
      </div>
    </div>
  );
};