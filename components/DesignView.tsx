
import React, { useState, useEffect, useCallback } from 'react';
import { DndContext, DragOverlay } from '@dnd-kit/core';

import { Element, MultiplayerCursor, DeepReadonly } from '../types';
import { findElementDeep, findElementPath, findParentElement } from '../lib/treeUtils';

import { useAppContext } from '../context/AppContext';
import { Sidebar } from './Sidebar';
import { Canvas } from './Canvas';
import { PropertiesPanel } from './PropertiesPanel';
import { CodePreviewPanel } from './CodePreviewPanel';
import { ActivityBar, ActivityBarTab } from './ActivityBar';
import { StatusBar } from './StatusBar';
import { TerminalPanel } from './TerminalPanel';
import { MeasurementGuides } from './MeasurementGuides';
import { useDragHandlers } from '../hooks/useDragHandlers';
import { ContextMenu } from './ContextMenu';

const Resizer: React.FC<{ onMouseDown: (e: React.MouseEvent) => void, vertical?: boolean, isDragging: boolean }> = ({ onMouseDown, vertical, isDragging }) => {
    return (
      <div
        onMouseDown={onMouseDown}
        className={`resizer ${vertical ? 'vertical' : 'horizontal'} ${isDragging ? 'is-dragging' : ''}`}
        aria-hidden="true"
      />
    );
};

export function DesignView({ openModal }: { openModal: (modal: string, context?: any) => void }) {
  const { state, dispatch, setSelectedElementId } = useAppContext();
  const { pages, activePageId, projectType, selectedElementId, customComponents, editingComponentId, theme, hoveredElementId, altKeyPressed, multiplayerCursors, previewMode, panelLayout, panels } = state;
  
  const [resizingPanel, setResizingPanel] = useState<'left' | 'right' | 'bottom' | null>(null);
  
  useEffect(() => {
    if (projectType === 'web') {
      const root = document.documentElement;
      Object.entries(theme.variables).forEach(([name, value]) => root.style.setProperty(name, value));
      root.style.setProperty('--font-primary', theme.fonts.primary);
      root.style.setProperty('--font-body', theme.fonts.body);
    }
  }, [theme, projectType]);
    
  useEffect(() => {
    const primaryFont = theme.fonts.primary?.replace(/ /g, '+');
    const bodyFont = theme.fonts.body?.replace(/ /g, '+');
    if (!primaryFont || !bodyFont) return;
    
    const fontUrl = `https://fonts.googleapis.com/css2?family=${primaryFont}:wght@400;700&family=${bodyFont}:wght@400;500;600&display=swap`;

    let link = document.getElementById('google-fonts-link') as HTMLLinkElement;
    if (!link) {
      link = document.createElement('link');
      link.id = 'google-fonts-link';
      link.rel = 'stylesheet';
      document.head.appendChild(link);
    }
    if (link.href !== fontUrl) link.href = fontUrl;
  }, [theme.fonts]);

  const styleObjectToString = (styles: any): string => { 
    if (!styles) return '';
    return Object.entries(styles).map(([key, value]) => {
      const kebabKey = key.replace(/([A-Z])/g, '-$1').toLowerCase();
      return `  ${kebabKey}: ${value};`;
    }).join('\n'); 
  }

  useEffect(() => {
    if (projectType !== 'web') return;
    const styleId = 'proverve-global-styles';
    let styleEl = document.getElementById(styleId);
    if (!styleEl) {
        styleEl = document.createElement('style');
        styleEl.id = styleId;
        document.head.appendChild(styleEl);
    }
    const cssString = Object.entries(theme.globalClasses).map(([className, styles]) => `.${className} {\n${styleObjectToString(styles)}\n}`).join('\n\n');
    styleEl.innerHTML = cssString;
  }, [theme.globalClasses, projectType]);

  const [activeTab, setActiveTab] = useState<ActivityBarTab>('layers');
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; elementId: string; } | null>(null);
  
  const { sensors, handleDragStart, handleDragOver, handleDragEnd, draggedItemOverlay, dropIndicator } = useDragHandlers();
  
  const editingComponent = editingComponentId ? customComponents.find(c => c.id === editingComponentId) : null;
  const activePage = pages.find(p => p.id === activePageId);
  const elementTree = editingComponent ? [editingComponent.mainElement] : (activePage?.elements || []);
  const selectedElementPath = selectedElementId ? findElementPath(elementTree as readonly Element[], selectedElementId) : undefined;
  const { element: hoveredElement } = hoveredElementId ? findElementDeep(elementTree as readonly Element[], hoveredElementId) : { element: null };
  const { element: selectedElement } = selectedElementId ? findElementDeep(elementTree as readonly Element[], selectedElementId) : { element: null };

  const handleContextMenu = (e: React.MouseEvent, elementId: string) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY, elementId });
  };
  
  const handlePanelResize = useCallback((e: React.MouseEvent, panel: 'left' | 'right' | 'bottom') => {
    e.preventDefault();
    setResizingPanel(panel);
    
    const startX = e.clientX;
    const startY = e.clientY;
    const startSizes = { ...panelLayout };

    const onMouseMove = (moveEvent: MouseEvent) => {
        const dx = moveEvent.clientX - startX;
        const dy = moveEvent.clientY - startY;
        let newLayout = { ...panelLayout };

        if (panel === 'left') {
            newLayout.leftSize = Math.max(200, Math.min(startSizes.leftSize + dx, 500));
        } else if (panel === 'right') {
            newLayout.rightSize = Math.max(250, Math.min(startSizes.rightSize - dx, 600));
        } else if (panel === 'bottom') {
            newLayout.bottomSize = Math.max(100, Math.min(startSizes.bottomSize - dy, window.innerHeight / 2));
        }
        dispatch({ type: 'SET_PANEL_LAYOUT', payload: newLayout });
    };

    const onMouseUp = () => {
        setResizingPanel(null);
        window.removeEventListener('mousemove', onMouseMove);
        window.removeEventListener('mouseup', onMouseUp);
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  }, [dispatch, panelLayout]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Alt') {
        e.preventDefault();
        dispatch({ type: 'SET_ALT_KEY_PRESSED', payload: true });
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'Alt') {
        e.preventDefault();
        dispatch({ type: 'SET_ALT_KEY_PRESSED', payload: false });
        dispatch({ type: 'SET_HOVERED_ELEMENT_ID', payload: null });
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [dispatch]);
  
  const parentOfSelected = selectedElementId ? findParentElement(elementTree as readonly Element[], selectedElementId) : null;
  
  return (
    <div className="flex h-full">
      <ActivityBar activeTab={activeTab} onTabChange={setActiveTab} onAssetStudioClick={() => openModal('assetStudio')}/>
      {!panels.leftCollapsed && (
        <aside style={{ width: `${panelLayout.leftSize}px` }} className="bg-[var(--color-surface)] flex flex-col flex-shrink-0">
          <Sidebar activeTab={activeTab} onAddSnippet={() => openModal('importCode')} onEditSnippet={(s) => openModal('importCode', s)} onAiTheme={() => openModal('designSystem')} />
        </aside>
      )}
      {!panels.leftCollapsed && <Resizer onMouseDown={(e) => handlePanelResize(e, 'left')} isDragging={resizingPanel === 'left'}/>}
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <DndContext onDragStart={handleDragStart} onDragOver={handleDragOver} onDragEnd={handleDragEnd} sensors={sensors}>
          <div className="flex-1 flex flex-col min-h-0">
            <Canvas elements={elementTree} dropIndicator={dropIndicator} onContextMenu={handleContextMenu} mode={previewMode ? 'preview' : 'edit'} cursors={multiplayerCursors} />
            {altKeyPressed && selectedElement && hoveredElement && selectedElement.id !== hoveredElement.id && (
                <MeasurementGuides selectedElement={selectedElement as Element} hoveredElement={hoveredElement as Element} />
            )}
            <DragOverlay dropAnimation={null}>
                {draggedItemOverlay}
            </DragOverlay>
          </div>
        </DndContext>
        {panels.bottomActivePanel && (
          <>
            <Resizer onMouseDown={(e) => handlePanelResize(e, 'bottom')} vertical isDragging={resizingPanel === 'bottom'}/>
            <div style={{ height: `${panelLayout.bottomSize}px` }} className="flex-shrink-0">
              {panels.bottomActivePanel === 'terminal' && <TerminalPanel />}
              {panels.bottomActivePanel === 'code' && <CodePreviewPanel />}
            </div>
          </>
        )}
        <StatusBar selectedElementPath={selectedElementPath as readonly Element[]} />
      </div>
      
      {!panels.rightCollapsed && <Resizer onMouseDown={(e) => handlePanelResize(e, 'right')} isDragging={resizingPanel === 'right'}/>}
      {!panels.rightCollapsed && (
          <aside style={{ width: `${panelLayout.rightSize}px` }} className="bg-[var(--color-surface)] flex flex-col flex-shrink-0">
            <PropertiesPanel 
                onAiRefine={() => openModal('aiRefine')} 
                onAiInteraction={() => openModal('aiInteraction')}
                parentElement={parentOfSelected}
            />
          </aside>
      )}

      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          elementId={contextMenu.elementId}
          onClose={() => setContextMenu(null)}
          onCreateComponent={() => {
            const { element } = findElementDeep(elementTree as readonly Element[], contextMenu.elementId);
            if (element) openModal('createComponent', element);
          }}
        />
      )}
    </div>
  );
}
