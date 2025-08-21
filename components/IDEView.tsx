
import React, { useState, useEffect, useRef, useCallback } from 'react';
import MonacoEditor from 'react-monaco-editor';
import { useAppContext } from '../context/AppContext';
import { FileNode, Page, CustomComponent, StateVariable, MockApiEndpoint, DeepReadonly } from '../types';
import { RefreshCw, ExternalLink } from 'lucide-react';
import { TerminalPanel } from './TerminalPanel';
import { generateProjectFiles } from '../lib/generateCode';
import { toast } from 'react-hot-toast';
import { FileTreeView } from './FileTreeView';

const Resizer: React.FC<{ onMouseDown: (e: React.MouseEvent) => void }> = ({ onMouseDown }) => (
  <div onMouseDown={onMouseDown} className="w-1.5 cursor-ew-resize bg-[var(--color-border)] hover:bg-[var(--color-primary)] transition-colors" />
);

export const IDEView: React.FC = () => {
    const { state, dispatch } = useAppContext();
    const { projectName, pages, customComponents, theme, globalStateDefinition, mockApiEndpoints, workspace } = state;

    const [selectedPath, setSelectedPath] = useState<string | null>(null);
    const [activeCode, setActiveCode] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [previewHtml, setPreviewHtml] = useState('');
    const [panelSizes, setPanelSizes] = useState({ left: 250, right: 500 });
    
    const findFileByPath = (nodes: readonly DeepReadonly<FileNode>[], path: string): DeepReadonly<FileNode> | null => {
        if (!path) return null;
        const parts = path.split('/');
        let current: readonly DeepReadonly<FileNode>[] | undefined = nodes;
        let found: DeepReadonly<FileNode> | null = null;
        
        for (let i = 0; i < parts.length; i++) {
            const part = parts[i];
            const node = current?.find(n => n.name === part);
            if (!node) return null;
            if (i === parts.length - 1) {
                found = node;
            } else {
                current = node.children;
            }
        }
        return found;
    };
    
    const createPreviewHtml = useCallback(() => {
        const findContent = (path: string) => findFileByPath(workspace, path)?.content || '';
        let htmlContent = findContent('index.html');
        const cssContent = findContent('style.css');
        const jsContent = findContent('script.js');

        if (!htmlContent) return "<p>Error: index.html not found in workspace.</p>";

        htmlContent = htmlContent.replace('<link rel="stylesheet" href="style.css">', `<style>${cssContent}</style>`);
        htmlContent = htmlContent.replace('<script type="module" src="script.js"></script>', `<script type="module">${jsContent}</script>`);
        htmlContent = htmlContent.replace('<script src="script.js"></script>', `<script>${jsContent}</script>`);

        setPreviewHtml(htmlContent);
    }, [workspace]);

    const generateAndSetFiles = useCallback(async () => {
        setIsLoading(true);
        try {
            const generated = await generateProjectFiles(projectName, pages, customComponents, theme, globalStateDefinition, mockApiEndpoints);
            const buildTree = (files: { [key: string]: string }): FileNode[] => {
                const root: FileNode = { name: 'root', type: 'folder', children: [] };
                Object.entries(files).forEach(([path, content]) => {
                    let current: FileNode = root;
                    path.split('/').forEach((part, index, arr) => {
                        if (!current.children) current.children = [];
                        let node = current.children.find(c => c.name === part);
                        if (!node) {
                            const isFile = index === arr.length - 1;
                            node = {
                                name: part,
                                type: isFile ? 'file' : 'folder',
                                ...(isFile ? { content } : { children: [] }),
                            };
                            current.children.push(node);
                        }
                        current = node;
                    });
                });
                return root.children || [];
            };

            const fileTree = buildTree(generated);
            dispatch({ type: 'SET_WORKSPACE', payload: fileTree });
            toast.success("Project files regenerated!");
        } catch (e) {
            toast.error("Failed to generate project files.");
            console.error(e);
        } finally {
            setIsLoading(false);
        }
    }, [projectName, pages, customComponents, theme, globalStateDefinition, mockApiEndpoints, dispatch]);

    useEffect(() => {
        if (workspace.length === 0) {
            generateAndSetFiles();
        } else {
            setIsLoading(false);
        }
    }, [workspace, generateAndSetFiles]);

    useEffect(() => {
        createPreviewHtml();
    }, [workspace, createPreviewHtml]);
    
    // Debounced update for saving code
    useEffect(() => {
        const handler = setTimeout(() => {
            const selectedFileNode = findFileByPath(workspace, selectedPath || '');
            if (selectedPath && selectedFileNode && activeCode !== selectedFileNode.content) {
                dispatch({ type: 'UPDATE_WORKSPACE_FILE_CONTENT', payload: { path: selectedPath, content: activeCode } });
            }
        }, 500);
        return () => clearTimeout(handler);
    }, [activeCode, selectedPath, workspace, dispatch]);

    const handleSelectFile = (node: DeepReadonly<FileNode> | null, path: string) => {
        if (node && node.type === 'file') {
            setSelectedPath(path);
            setActiveCode(node.content || '');
        }
    };

    const getLanguage = (fileName: string = '') => {
        const ext = fileName.split('.').pop();
        switch(ext) {
            case 'js': return 'javascript';
            case 'css': return 'css';
            case 'html': return 'html';
            case 'json': return 'json';
            case 'md': return 'markdown';
            default: return 'plaintext';
        }
    };
    
    const handleResize = useCallback((e: React.MouseEvent) => {
        e.preventDefault();
        const startX = e.clientX;
        const startLeft = panelSizes.left;
        const startRight = panelSizes.right;
        const totalWidth = window.innerWidth;

        const handleMouseMove = (moveEvent: MouseEvent) => {
            const dx = moveEvent.clientX - startX;
            const newLeft = Math.max(200, Math.min(startLeft + dx, totalWidth - startRight - 200));
            setPanelSizes(s => ({ ...s, left: newLeft }));
        };
        const handleMouseUp = () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);
    }, [panelSizes]);
    
    const handlePreviewResize = useCallback((e: React.MouseEvent) => {
        e.preventDefault();
        const startX = e.clientX;
        const startRight = panelSizes.right;
        const totalWidth = window.innerWidth;
        const handleMouseMove = (moveEvent: MouseEvent) => {
            const dx = moveEvent.clientX - startX;
            const newRight = Math.max(300, Math.min(startRight - dx, totalWidth - panelSizes.left - 200));
            setPanelSizes(s => ({ ...s, right: newRight }));
        };
        const handleMouseUp = () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);
    }, [panelSizes]);
    
    const selectedFileNode = findFileByPath(workspace, selectedPath || '');

    return (
        <div className="flex h-full text-white">
            <aside style={{ width: `${panelSizes.left}px`}} className="bg-[var(--color-surface)] flex flex-col flex-shrink-0">
                <div className="flex-shrink-0 flex justify-between items-center p-2 border-b border-[var(--color-border)]">
                    <h2 className="font-bold text-lg">Workspace</h2>
                    <button onClick={generateAndSetFiles} className="p-1 hover:bg-[var(--color-surface-light)] rounded-md" title="Regenerate Files"><RefreshCw size={16}/></button>
                </div>
                <div className="flex-1 overflow-y-auto p-1">
                    {isLoading ? <p className="text-sm text-center p-4 text-[var(--color-text-tertiary)]">Loading...</p>
                        : <FileTreeView nodes={workspace} onSelect={handleSelectFile} selectedPath={selectedPath} />
                    }
                </div>
            </aside>
            <Resizer onMouseDown={handleResize} />
            <main className="flex-1 flex flex-col min-w-0">
                <div className="flex-1 bg-gray-800 relative">
                    {selectedPath ? (
                        <MonacoEditor
                            height="100%" language={getLanguage(selectedFileNode?.name)} theme="vs-dark" value={activeCode} onChange={setActiveCode}
                            options={{ minimap: { enabled: false }, automaticLayout: true, scrollBeyondLastLine: false }}
                        />
                    ) : (
                        <div className="flex h-full items-center justify-center text-center text-[var(--color-text-tertiary)]"><p>Select a file to begin editing.</p></div>
                    )}
                </div>
                <div className="h-48 flex-shrink-0"><TerminalPanel /></div>
            </main>
            <Resizer onMouseDown={handlePreviewResize} />
            <aside style={{ width: `${panelSizes.right}px`}} className="bg-[var(--color-background)] flex flex-col flex-shrink-0">
                <div className="flex-shrink-0 p-2 flex justify-between items-center border-b border-[var(--color-border)]">
                    <h2 className="font-bold text-lg">Live Preview</h2>
                    <div className="flex items-center gap-2">
                        <button onClick={createPreviewHtml} title="Refresh Preview" className="p-1 hover:bg-[var(--color-surface)] rounded-md"><RefreshCw size={16} /></button>
                        <a href={`data:text/html,${encodeURIComponent(previewHtml)}`} target="_blank" rel="noopener noreferrer" title="Open in new tab" className="p-1 hover:bg-[var(--color-surface)] rounded-md"><ExternalLink size={16} /></a>
                    </div>
                </div>
                <iframe
                    srcDoc={previewHtml}
                    title="Live Preview"
                    className="w-full h-full border-0 bg-white"
                    sandbox="allow-scripts allow-same-origin"
                />
            </aside>
        </div>
    );
};
