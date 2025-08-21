import React from 'react';
import { 
    FaWandMagicSparkles,
    FaUpload,
    FaImage,
    FaPlus,
    FaMagnifyingGlass,
    FaTrash,
    FaChevronDown,
    FaSliders,
    FaDatabase,
    FaFileCode,
    FaFolder,
    FaSitemap,
    FaNetworkWired
} from 'react-icons/fa6';
import { IconBaseProps } from 'react-icons';

export const MagicIcon: React.FC<IconBaseProps> = (props) => <FaWandMagicSparkles {...props} />;
export const UploadIcon: React.FC<IconBaseProps> = (props) => <FaUpload {...props} />;
export const ImageIcon: React.FC<IconBaseProps> = (props) => <FaImage {...props} />;
export const PlusIcon: React.FC<IconBaseProps> = (props) => <FaPlus {...props} />;
export const SearchIcon: React.FC<IconBaseProps> = (props) => <FaMagnifyingGlass {...props} />;
export const TrashIcon: React.FC<IconBaseProps> = (props) => <FaTrash {...props} />;
export const ChevronDownIcon: React.FC<IconBaseProps> = (props) => <FaChevronDown {...props} />;
export const SlidersIcon: React.FC<IconBaseProps> = (props) => <FaSliders {...props} />;
export const DatabaseIcon: React.FC<IconBaseProps> = (props) => <FaDatabase {...props} />;
export const FileJsonIcon: React.FC<IconBaseProps> = (props) => <FaFileCode {...props} />;
export const FolderIcon: React.FC<IconBaseProps> = (props) => <FaFolder {...props} />;
export const FolderTreeIcon: React.FC<IconBaseProps> = (props) => <FaSitemap {...props} />;
export const NetworkIcon: React.FC<IconBaseProps> = (props) => <FaNetworkWired {...props} />;