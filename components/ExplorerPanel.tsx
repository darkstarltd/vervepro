import React from 'react';
import { useAppContext } from '../context/AppContext';
import { CollapsibleSection } from './StylePropertyEditor';
import { PagesPanel } from './PagesPanel';
import { FaCode } from 'react-icons/fa6';

export const ExplorerPanel: React.FC = () => {
    const { state: { projectName } } = useAppContext();

    return (
        <div>
            <CollapsibleSection title="Project" defaultOpen>
                 <div className="p-2">
                    <div className="flex items-center gap-2 p-2">
                        <FaCode size={16} className="text-[var(--color-accent)]" />
                        <span className="font-semibold text-sm">{projectName}</span>
                    </div>
                    <div className="pl-4 border-l-2 border-[var(--color-border-subtle)]">
                        <PagesPanel />
                    </div>
                </div>
            </CollapsibleSection>
        </div>
    );
};
