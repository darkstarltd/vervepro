import React from 'react';
import { FaFileLines, FaFileCode, FaCss3Alt, FaJs, FaReact, FaSass, FaHtml5, FaImage, FaBoxArchive, FaGear } from 'react-icons/fa6';
import { SiTypescript, SiJson } from 'react-icons/si';


const ICONS: Record<string, React.ReactNode> = {
    html: React.createElement(FaHtml5, { size: 16, className: "text-orange-500" }),
    css: React.createElement(FaCss3Alt, { size: 16, className: "text-blue-500" }),
    js: React.createElement(FaJs, { size: 16, className: "text-yellow-500" }),
    jsx: React.createElement(FaReact, { size: 16, className: "text-cyan-400" }),
    ts: React.createElement(SiTypescript, { size: 16, className: "text-blue-400" }),
    tsx: React.createElement(FaReact, { size: 16, className: "text-blue-300" }),
    json: React.createElement(SiJson, { size: 16, className: "text-yellow-600" }),
    md: React.createElement(FaFileLines, { size: 16, className: "text-gray-400" }),
    png: React.createElement(FaImage, { size: 16, className: "text-green-400" }),
    jpg: React.createElement(FaImage, { size: 16, className: "text-green-400" }),
    jpeg: React.createElement(FaImage, { size: 16, className: "text-green-400" }),
    gif: React.createElement(FaImage, { size: 16, className: "text-green-400" }),
    svg: React.createElement(FaImage, { size: 16, className: "text-purple-400" }),
    zip: React.createElement(FaBoxArchive, { size: 16, className: "text-gray-500" }),
    jsonc: React.createElement(SiJson, { size: 16, className: "text-yellow-600" }),
    java: React.createElement(FaFileCode, { size: 16, className: "text-red-400" }),
    xml: React.createElement(FaFileCode, { size: 16, className: "text-orange-400" }),
    default: React.createElement(FaFileLines, { size: 16, className: "text-gray-400" }),
};

export const getIconForFile = (filename: string): React.ReactNode => {
    const extension = filename.split('.').pop()?.toLowerCase();
    return extension && ICONS[extension] ? ICONS[extension] : ICONS.default;
};