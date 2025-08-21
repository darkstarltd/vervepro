import React from 'react';
import { FaRotateLeft, FaUpload, FaDownload, FaGears, FaDiagramProject, FaTerminal } from 'react-icons/fa6';

export const WhatsNewModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
    const features = [
        {
            icon: <FaDiagramProject className="text-green-400" />,
            title: "Enhanced Logic Engine",
            description: "New state manipulation nodes (Increment, Decrement, Toggle) have been added to the Logic View for more powerful interactions."
        },
        {
            icon: <FaRotateLeft className="text-cyan-400" />,
            title: "Interactive Source Control",
            description: "You can now revert your entire project to a previous state directly from the Source Control panel."
        },
        {
            icon: <div className="flex"><FaDownload className="text-purple-400" /><FaUpload className="text-purple-400" /></div>,
            title: "Project Import & Export",
            description: "Easily back up, share, and restore your projects using the new Import/Export feature in the Settings modal."
        },
        {
            icon: <FaTerminal className="text-yellow-400" />,
            title: "Smarter Terminal",
            description: "The built-in terminal now understands `git` commands (status, log, commit) that reflect your project's history."
        },
    ];

    return (
        <div className="fixed inset-0 bg-gray-900/80 flex items-center justify-center z-50" onClick={onClose}>
            <div className="bg-[var(--color-surface)] rounded-lg shadow-xl w-full max-w-2xl" onClick={e => e.stopPropagation()}>
                <div className="p-6 text-center border-b border-[var(--color-border)]">
                    <h2 className="text-2xl font-bold">🚀 What's New in Pro-Verve 2.0</h2>
                    <p className="text-md text-[var(--color-text-secondary)] mt-2">We've packed this update with powerful new features!</p>
                </div>
                <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
                    {features.map((feature, index) => (
                        <div key={index} className="flex items-start gap-4">
                            <div className="text-2xl mt-1">{feature.icon}</div>
                            <div>
                                <h3 className="font-semibold">{feature.title}</h3>
                                <p className="text-sm text-[var(--color-text-secondary)]">{feature.description}</p>
                            </div>
                        </div>
                    ))}
                </div>
                <div className="p-4 bg-[var(--color-background)] rounded-b-lg flex justify-center">
                    <button onClick={onClose} className="px-8 py-2 bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] rounded-md text-sm font-bold">
                        Start Building
                    </button>
                </div>
            </div>
        </div>
    );
};