
import React from 'react';
import { Tooltip } from './Tooltip';
import { FaFile, FaCodeBranch, FaAnglesLeft, FaAnglesRight, FaFolderOpen, FaLayerGroup, FaSquarePlus, FaDatabase, FaImages, FaFileCode, FaPalette, FaWandMagicSparkles, FaTableCellsLarge } from 'react-icons/fa6';
import { useAppContext } from '../context/AppContext';

export type ActivityBarTab = 'explorer' | 'components' | 'layers' | 'data' | 'assets' | 'theme' | 'code' | 'templates' | 'source-control';

interface ActivityBarProps {
    activeTab: ActivityBarTab;
    onTabChange: (tab: ActivityBarTab) => void;
    onAssetStudioClick: () => void;
}

const ActivityBarButton: React.FC<{
    title: string;
    icon: React.ReactNode;
    isActive?: boolean;
    onClick: () => void;
    badge?: number;
}> = ({ title, icon, isActive, onClick, badge }) => {
    return (
        <Tooltip content={title} placement="right">
            <button
                onClick={onClick}
                className={`w-full p-3 flex justify-center items-center transition-colors relative ${
                    isActive
                        ? 'text-white'
                        : 'text-[var(--color-text-secondary)] hover:text-white hover:bg-[var(--color-surface-light)]'
                } ${isActive ? 'activity-bar-button-active' : ''}`}
            >
                {isActive && <div className="active-indicator"></div>}
                <div className="w-6 h-6 relative flex items-center justify-center">
                    {icon}
                    {badge > 0 && (
                        <div className="absolute -top-1 -right-2 bg-[var(--color-primary)] text-white text-[10px] rounded-full w-4 h-4 flex items-center justify-center">
                            {badge}
                        </div>
                    )}
                </div>
            </button>
        </Tooltip>
    );
};

export const ActivityBar: React.FC<ActivityBarProps> = ({ activeTab, onTabChange, onAssetStudioClick }) => {
    const { state: { unsavedChanges, panels }, dispatch } = useAppContext();

    const tabs: { id: ActivityBarTab, title: string, icon: React.ReactNode, badge?: number }[] = [
        { id: 'explorer', title: 'Explorer', icon: <FaFolderOpen /> },
        { id: 'source-control', title: 'Source Control', icon: <FaCodeBranch />, badge: unsavedChanges },
        { id: 'layers', title: 'Layers', icon: <FaLayerGroup /> },
        { id: 'components', title: 'Components', icon: <FaSquarePlus /> },
        { id: 'templates', title: 'Templates', icon: <FaTableCellsLarge /> },
        { id: 'data', title: 'Data', icon: <FaDatabase /> },
        { id: 'assets', title: 'Assets', icon: <FaImages /> },
        { id: 'code', title: 'Code Snippets', icon: <FaFileCode /> },
        { id: 'theme', title: 'Theme', icon: <FaPalette /> },
    ];
    
    return (
        <nav className="w-16 bg-[var(--color-background)] border-r border-[var(--color-border)] flex flex-col items-center py-2 gap-2 z-50">
            <div className="flex-1 space-y-2 w-full">
                <ActivityBarButton 
                    title={panels.leftCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
                    icon={panels.leftCollapsed ? <FaAnglesRight /> : <FaAnglesLeft />}
                    onClick={() => dispatch({ type: 'SET_PANELS_STATE', payload: { leftCollapsed: !panels.leftCollapsed }})}
                />
                 <div className="my-2 w-full flex justify-center">
                    <div className="w-8 h-px bg-[var(--color-border)]"></div>
                </div>
                {tabs.map(tab => (
                    <ActivityBarButton 
                        key={tab.id}
                        title={tab.title}
                        icon={tab.icon}
                        isActive={activeTab === tab.id}
                        onClick={() => onTabChange(tab.id)}
                        badge={tab.badge}
                    />
                ))}
                <div className="my-2 w-full flex justify-center">
                    <div className="w-8 h-px bg-[var(--color-border)]"></div>
                </div>
                 <ActivityBarButton 
                    title="Asset Studio"
                    icon={<FaWandMagicSparkles />}
                    onClick={onAssetStudioClick}
                />
            </div>
        </nav>
    );
};