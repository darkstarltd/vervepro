import React, { useState } from 'react';
import { FileNode, DeepReadonly } from '../types';
import { FaChevronDown, FaFolder } from 'react-icons/fa6';
import { getIconForFile } from '../lib/file-icons';

interface FileTreeViewProps {
    nodes: readonly DeepReadonly<FileNode>[];
    onSelect: (file: DeepReadonly<FileNode> | null, path: string) => void;
    selectedPath: string | null;
}

const TreeNode: React.FC<{
    node: DeepReadonly<FileNode>;
    level: number;
    path: string;
    onSelect: (file: DeepReadonly<FileNode>, path: string) => void;
    selectedPath: string | null;
}> = ({ node, level, path, onSelect, selectedPath }) => {
    const [isOpen, setIsOpen] = useState(level < 2);
    const isFolder = node.type === 'folder';
    const isSelected = path === selectedPath;

    const handleToggle = () => {
        if (isFolder) {
            setIsOpen(!isOpen);
        }
        onSelect(node, path);
    };

    const icon = isFolder ? <FaFolder size={16} className="text-yellow-500" /> : getIconForFile(node.name);

    return (
        <div>
            <div
                onClick={handleToggle}
                className={`flex items-center gap-2 p-1 rounded-md cursor-pointer ${isSelected ? 'bg-[var(--color-primary)]' : 'hover:bg-[var(--color-surface-light)]'}`}
                style={{ paddingLeft: `${level * 16}px` }}
            >
                <div className="w-5 h-5 flex items-center justify-center">
                    {isFolder ? <FaChevronDown size={14} className={`transition-transform ${isOpen ? 'rotate-0' : '-rotate-90'}`} /> : <div className="w-[14px]"></div>}
                </div>
                <span className="w-5 h-5 flex items-center justify-center">{icon}</span>
                <span className="truncate">{node.name}</span>
            </div>
            {isFolder && isOpen && node.children && (
                <div>
                    {node.children.map(child => (
                        <TreeNode key={child.name} node={child} level={level + 1} path={`${path}/${child.name}`} onSelect={onSelect} selectedPath={selectedPath} />
                    ))}
                </div>
            )}
        </div>
    );
};


export const FileTreeView: React.FC<FileTreeViewProps> = ({ nodes, onSelect, selectedPath }) => {
    return (
        <div className="text-sm">
            {nodes.map(node => (
                <TreeNode key={node.name} node={node} level={0} path={node.name} onSelect={onSelect} selectedPath={selectedPath} />
            ))}
        </div>
    );
};
