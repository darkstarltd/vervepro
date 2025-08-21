import React, { useState, useEffect } from 'react';
import { useAppContext } from '../context/AppContext';
import { generateProjectFiles } from '../lib/generateCode';
import { FaLink, FaCopy, FaCheck } from 'react-icons/fa6';

export const PublishModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
    const { state } = useAppContext();
    const { projectName, pages, customComponents, theme, globalStateDefinition, mockApiEndpoints, activePageId } = state;
    const [publishUrl, setPublishUrl] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isCopied, setIsCopied] = useState(false);

    useEffect(() => {
        const generatePreview = async () => {
            setIsLoading(true);
            try {
                const activePage = pages.find(p => p.id === activePageId);
                if (!activePage) throw new Error("No active page to publish.");

                const allFiles = await generateProjectFiles(projectName, pages, customComponents, theme, globalStateDefinition, mockApiEndpoints);
                
                let htmlContent = allFiles[activePage.name.toLowerCase().replace(/\s+/g, '-') + '.html'];
                if (!htmlContent) {
                   htmlContent = allFiles['home.html'] || Object.values(allFiles).find(c => c.startsWith('<!DOCTYPE html'));
                }
                
                if (!htmlContent) throw new Error("Could not find a valid HTML file to preview.");

                const cssContent = allFiles['style.css'] || '';
                const jsContent = allFiles['script.js'] || '';

                htmlContent = htmlContent.replace('<link rel="stylesheet" href="style.css">', `<style>${cssContent}</style>`);
                htmlContent = htmlContent.replace('<script src="script.js"></script>', `<script>${jsContent}</script>`);

                const blob = new Blob([htmlContent], { type: 'text/html' });
                const url = URL.createObjectURL(blob);
                setPublishUrl(url);
            } catch (error) {
                console.error("Failed to generate publish preview:", error);
                setPublishUrl(null);
            } finally {
                setIsLoading(false);
            }
        };

        generatePreview();
        
        // Cleanup URL on unmount
        return () => {
            if (publishUrl) {
                URL.revokeObjectURL(publishUrl);
            }
        };
    }, []); // Only run once on mount

    const handleCopy = () => {
        if (publishUrl) {
            navigator.clipboard.writeText(publishUrl);
            setIsCopied(true);
            setTimeout(() => setIsCopied(false), 2000);
        }
    };

    return (
        <div className="fixed inset-0 bg-gray-900/80 flex items-center justify-center z-50" onClick={onClose}>
            <div className="bg-[var(--color-surface)] rounded-lg shadow-xl w-full max-w-lg" onClick={e => e.stopPropagation()}>
                <div className="p-4 border-b border-[var(--color-border)]">
                    <h2 className="text-lg font-bold">Publish Preview</h2>
                </div>
                <div className="p-6 space-y-4">
                    {isLoading ? (
                        <p>Generating preview...</p>
                    ) : publishUrl ? (
                        <>
                            <p className="text-sm text-[var(--color-text-secondary)]">A shareable preview link has been generated. This link is temporary and works only in this browser session.</p>
                            <div className="flex items-center gap-2">
                                <FaLink size={16} className="text-[var(--color-text-tertiary)] flex-shrink-0" />
                                <input
                                    type="text"
                                    value={publishUrl}
                                    readOnly
                                    className="flex-1 w-full bg-[var(--color-background)] border border-[var(--color-border)] rounded-md p-2 text-sm text-white font-mono"
                                />
                                <button onClick={handleCopy} className="p-2 bg-[var(--color-surface-light)] hover:bg-[var(--color-border)] rounded-md">
                                    {isCopied ? <FaCheck size={16} className="text-green-400" /> : <FaCopy size={16} />}
                                </button>
                            </div>
                             <a
                                href={publishUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="w-full block text-center px-4 py-2 bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] rounded-md text-sm font-semibold"
                            >
                                Open Preview in New Tab
                            </a>
                        </>
                    ) : (
                        <p className="text-[var(--color-danger)]">Failed to generate preview.</p>
                    )}
                </div>
                <div className="p-4 bg-[var(--color-background)] rounded-b-lg flex justify-end">
                    <button onClick={onClose} className="px-4 py-2 bg-[var(--color-surface-light)] hover:bg-[var(--color-border)] rounded-md text-sm">Close</button>
                </div>
            </div>
        </div>
    );
};