import React, { useState, useRef } from 'react';
import { useAppContext } from '../context/AppContext';
import { PresentState } from '../types';

export const SettingsModal: React.FC<{
  onClose: () => void;
}> = ({ onClose }) => {
  const { state, dispatch } = useAppContext();
  const [projectName, setProjectName] = useState(state.projectName);
  const importInputRef = useRef<HTMLInputElement>(null);

  const handleSave = () => {
    if (projectName.trim()) {
      dispatch({ type: 'UPDATE_PROJECT_NAME', payload: projectName.trim() });
      onClose();
    }
  };

  const handleExport = () => {
    const { history, runtimeState, visibleModalIds, selectedElementId, hoveredElementId, publishUrl, ...savableState } = state;
    const jsonString = JSON.stringify(savableState, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${state.projectName.replace(/\s+/g, '-')}-export.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImportClick = () => {
    importInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const importedState = JSON.parse(e.target?.result as string);
          // A simple validation to check if it's a valid state object
          if (importedState.projectName && importedState.pages) {
            dispatch({ type: 'LOAD_PROJECT_STATE', payload: importedState as PresentState });
            onClose();
          } else {
            alert('Invalid project file.');
          }
        } catch (error) {
          alert('Error parsing project file.');
        }
      };
      reader.readAsText(file);
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-900/80 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-[var(--color-surface)] rounded-lg shadow-xl w-full max-w-lg" onClick={e => e.stopPropagation()}>
        <div className="p-4 border-b border-[var(--color-border)]">
          <h2 className="text-lg font-bold">Project Settings</h2>
        </div>
        <div className="p-6 space-y-6">
          <div>
            <label htmlFor="project-name" className="block text-sm font-medium text-[var(--color-text-primary)] mb-2">Project Name</label>
            <input
              id="project-name"
              type="text"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              className="w-full bg-[var(--color-background)] border border-[var(--color-border)] rounded-md p-2 text-white"
              autoFocus
            />
          </div>
          <div className="pt-4 border-t border-[var(--color-border)]">
            <h3 className="font-semibold text-md mb-2">Manage Project</h3>
            <div className="flex gap-4">
              <button onClick={handleExport} className="flex-1 px-4 py-2 bg-[var(--color-surface-light)] hover:bg-[var(--color-border)] rounded-md text-sm">Export Project</button>
              <button onClick={handleImportClick} className="flex-1 px-4 py-2 bg-[var(--color-surface-light)] hover:bg-[var(--color-border)] rounded-md text-sm">Import Project</button>
              <input type="file" ref={importInputRef} onChange={handleFileChange} accept=".json" className="hidden" />
            </div>
          </div>
        </div>
        <div className="p-4 bg-[var(--color-background)] rounded-b-lg flex justify-end gap-3">
          <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-600 hover:bg-gray-500 rounded-md text-sm">Cancel</button>
          <button type="button" onClick={handleSave} className="px-4 py-2 bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] rounded-md text-sm font-bold">Save Changes</button>
        </div>
      </div>
    </div>
  );
};