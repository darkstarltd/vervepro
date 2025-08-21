import React, { useState, useEffect, FC, KeyboardEvent, useRef, useMemo } from 'react';
import { 
    FaCode, FaMobileScreenButton, FaTerminal, FaHammer, FaWrench, FaChartLine, FaMicrochip, FaDatabase, FaShieldHalved,
    FaPowerOff, FaTriangleExclamation, FaDownload, FaRotate, FaFilter, FaTrash, FaPause, FaArrowDown, FaPlay, FaFloppyDisk, FaEye, FaBoxOpen, FaLock, FaFileLines, FaFolder, FaFile, FaWifi, FaChartBar, FaServer, FaRocket, FaLayerGroup, FaCodeBranch, FaPlugCircleXmark, FaGear
} from 'react-icons/fa6';
import { ApkInfo, BuildTool, DeviceInfo, FileNode, LogEntry, BuildTarget, BuildStatus, DeepReadonly, MagiskModule, XposedHook, SecurityFinding, Element, CustomComponent, Page } from '../types';
import MonacoEditor from 'react-monaco-editor';
import { StateInspector } from './StateInspector';
import { MockApiEditor } from './MockApiEditor';
import { useAppContext } from '../context/AppContext';
import { FileTreeView } from './FileTreeView';
import { toast } from 'react-hot-toast';

// --- MOCK DATA (for parts that are not yet dynamic) ---
const MOCK_DECOMPILED_SOURCES: FileNode[] = [
    { name: 'com.proverve.app', type: 'folder', children: [
        { name: 'activities', type: 'folder', children: [
            { name: 'MainActivity.java', type: 'file', content: 'public class MainActivity extends AppCompatActivity { ... }' },
            { name: 'SettingsActivity.java', type: 'file', content: 'public class SettingsActivity extends AppCompatActivity { ... }' },
        ]},
        { name: 'services', type: 'folder', children: [
            { name: 'BackgroundSyncService.java', type: 'file', content: 'public class BackgroundSyncService extends Service { ... }' },
        ]},
        { name: 'utils', type: 'folder', children: [
            { name: 'NetworkUtils.java', type: 'file', content: 'public class NetworkUtils { ... }' },
        ]}
    ]},
    { name: 'BuildConfig.java', type: 'file', content: 'public final class BuildConfig { ... }' }
];

const MOCK_RESOURCES: FileNode[] = [
    { name: 'res', type: 'folder', children: [
        { name: 'layout', type: 'folder', children: [
            { name: 'activity_main.xml', type: 'file', content: '<RelativeLayout ...></RelativeLayout>' }
        ]},
        { name: 'drawable', type: 'folder', children: [
            { name: 'ic_launcher.png', type: 'file' }
        ]},
        { name: 'values', type: 'folder', children: [
             { name: 'strings.xml', type: 'file', content: '<resources><string name="app_name">Pro-Verve</string></resources>' }
        ]}
    ]},
    { name: 'AndroidManifest.xml', type: 'file', content: '<manifest ...></manifest>' }
];

const MOCK_SECURITY_REPORT: SecurityFinding[] = [
    { id: 'sec1', severity: 'High', title: 'Hardcoded API Key', description: 'An API key was found hardcoded in NetworkUtils.java. This could allow an attacker to make unauthorized API calls.', resolution: 'Store API keys securely in a secrets management system and retrieve them at runtime.' },
    { id: 'sec2', severity: 'Medium', title: 'Insecure Data Storage', description: 'User preferences are stored in SharedPreferences without encryption, potentially exposing sensitive information on a rooted device.', resolution: 'Use EncryptedSharedPreferences from the AndroidX Security library to store sensitive data.' },
    { id: 'sec3', severity: 'Low', title: 'App Allows Backups', description: 'The allowBackup flag is set to true in the AndroidManifest.xml, which could allow an attacker with physical access to the device to extract app data.', resolution: 'Set android:allowBackup="false" in the manifest if you do not require backups.' },
    { id: 'sec4', severity: 'Info', title: 'App in Debuggable Mode', description: 'The application is marked as debuggable, which is not recommended for production builds.', resolution: 'Ensure android:debuggable is set to "false" for release builds.' }
];

const MOCK_DEVICES: DeviceInfo[] = [
  { id: 'emulator-5554', name: 'Pixel 7 Pro (Emulator)', platform: 'Android', status: 'connected', apiLevel: '33' },
  { id: 'asdf12345ghjk', name: 'Samsung Galaxy S22', platform: 'Android', status: 'disconnected', apiLevel: '31' },
  { id: 'iPhone14Pro_1', name: 'iPhone 14 Pro', platform: 'iOS', status: 'connected', apiLevel: '16.1' }
];

const MOCK_BUILD_TOOLS: BuildTool[] = [
  { name: 'Android SDK Platform 34', version: '2', status: 'installed' },
  { name: 'Android SDK Build-Tools', version: '34.0.0', status: 'installed' },
  { name: 'Flutter SDK', version: '3.13.0', status: 'outdated' },
  { name: 'Xcode', version: '14.1', status: 'installed' },
  { name: 'Gradle', version: '8.2', status: 'missing' },
  { name: 'React Native CLI', version: '11.3.6', status: 'installed' },
];

const MOCK_MAGISK_MODULES: MagiskModule[] = [
    { id: 'mag1', name: 'Systemless Hosts', author: 'topjohnwu', version: '1.0', enabled: true },
    { id: 'mag2', name: 'AdAway', author: 'AdAway Team', version: '4.3.2', enabled: true },
    { id: 'mag3', name: 'GPay SQLite Fix', author: 'sproke', version: '2.1', enabled: false },
    { id: 'mag4', name: 'YouTube Vanced', author: 'TeamVanced', version: '16.29.39', enabled: true },
];

const MOCK_XPOSED_HOOKS: XposedHook[] = [
    { id: 'xpo1', name: 'GravityBox [A13]', targetClass: 'com.android.systemui', targetMethod: '*', description: 'System-wide UI tweaks and customizations.', enabled: true },
    { id: 'xpo2', name: 'Greenify', targetClass: 'android.app.ActivityManager', targetMethod: 'forceStopPackage', description: 'Hibernates background apps to save battery.', enabled: true },
    { id: 'xpo3', name: 'SSL Unpinning', targetClass: 'javax.net.ssl.TrustManager', targetMethod: 'checkServerTrusted', description: 'Bypasses SSL certificate pinning for network analysis.', enabled: false },
];


const generateLog = (): LogEntry => {
    const levels: LogEntry['level'][] = ['info', 'debug', 'warn', 'error'];
    const sources = ['MainActivity', 'NetworkService', 'GLSUser', 'HttpTransport', 'RenderThread'];
    const messages = ['Request successful', 'User logged in', 'Permission denied', 'Failed to allocate memory', 'UI Updated'];
    return {
        level: levels[Math.floor(Math.random() * levels.length)],
        source: sources[Math.floor(Math.random() * sources.length)],
        timestamp: new Date().toLocaleTimeString('en-US', { hour12: false }),
        message: messages[Math.floor(Math.random() * messages.length)],
    }
}

// --- Dynamic APK Info Generator ---
const generateDynamicApkInfo = (projectName: string, pages: readonly DeepReadonly<Page>[], customComponents: readonly DeepReadonly<CustomComponent>[]): ApkInfo => {
    const permissions = new Set<string>();
    const dependencies = new Set<string>(["androidx.appcompat:appcompat:1.6.1", "com.google.android.material:material:1.9.0"]);
    
    const scanElements = (elements: readonly DeepReadonly<Element>[]) => {
        for (const element of elements) {
            if (element.type === 'Image' && element.props?.src?.startsWith('http')) {
                permissions.add('INTERNET');
            }
            if (element.type === 'LottieAnimation') {
                dependencies.add('com.airbnb.android:lottie-compose:6.1.0');
            }
            if (element.type === 'ARView') {
                permissions.add('CAMERA');
            }
            if (element.children) {
                scanElements(element.children);
            }
        }
    };

    pages.forEach(page => scanElements(page.elements));
    customComponents.forEach(comp => scanElements([comp.mainElement]));

    return {
        name: projectName,
        packageName: `com.${projectName.toLowerCase().replace(/\s+/g, '')}.app`,
        version: "1.0.0",
        size: `${(Math.random() * 15 + 5).toFixed(1)} MB`,
        minSdk: "24",
        targetSdk: "34",
        permissions: Array.from(permissions),
        activities: ["MainActivity"],
        services: [],
        receivers: [],
        features: Array.from(permissions).map(p => `android.hardware.${p.toLowerCase()}`),
        decompiledSources: MOCK_DECOMPILED_SOURCES,
        resources: MOCK_RESOURCES,
        dependencies: Array.from(dependencies),
        securityReport: MOCK_SECURITY_REPORT,
    };
};


// --- Sub-component: Performance Chart ---
const PerformanceChart: FC<{ title: string; icon: React.ReactNode; color: string; unit: string; max: number }> = ({ title, icon, color, unit, max }) => {
    const [data, setData] = useState<number[]>(Array(30).fill(0));
    useEffect(() => { const i = setInterval(() => setData(p => [...p.slice(1), Math.random() * (max * 0.8) + (max * 0.1)]), 1000); return () => clearInterval(i); }, [max]);
    
    const currentValue = data[data.length - 1];
    const gradientId = `gradient-${title.replace(' ', '')}`;
    const generatePath = (d: number[]) => `M 0 ${100 - (d[0]/max*100)} ` + d.map((p, i) => `L ${i * (300 / 29)} ${100 - (p/max*100)}`).join(' ');
    const pathForFill = generatePath(data) + ` L 300 100 L 0 100 Z`;

    return (
        <div className="bg-[var(--color-surface)] p-4 rounded-lg flex-1">
            <div className="flex justify-between items-center text-[var(--color-text-secondary)] mb-2">
                <div className="flex items-center gap-2 text-sm">{icon} {title}</div>
                <div className="font-mono text-lg text-white">{currentValue.toFixed(title === 'CPU' ? 1: 0)} <span className="text-xs">{unit}</span></div>
            </div>
            <svg viewBox="0 0 300 100" className="w-full h-24">
                <defs>
                    <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={color} stopOpacity={0.4}/>
                        <stop offset="100%" stopColor={color} stopOpacity={0.05}/>
                    </linearGradient>
                </defs>
                <path d={pathForFill} fill={`url(#${gradientId})`} />
                <path d={generatePath(data)} fill="none" stroke={color} strokeWidth="2" />
            </svg>
        </div>
    );
};

// --- Sub-component: Development View ---
const DevelopmentView = () => {
    const { state: { workspace }, dispatch } = useAppContext();
    const [selectedPath, setSelectedPath] = useState<string | null>(null);
    const [code, setCode] = useState('');
    
    const findNodeByPath = (nodes: readonly DeepReadonly<FileNode>[], path: string): DeepReadonly<FileNode> | null => {
        const parts = path.split('/');
        let currentNodes: readonly DeepReadonly<FileNode>[] | undefined = nodes;
        let foundNode: DeepReadonly<FileNode> | null = null;
        for (const part of parts) {
            const nextNode = currentNodes?.find(n => n.name === part);
            if (!nextNode) return null;
            if (parts.indexOf(part) === parts.length - 1) {
                foundNode = nextNode;
            } else {
                currentNodes = nextNode.children;
            }
        }
        return foundNode;
    };

    const selectedFileNode = React.useMemo(() => {
        if (!selectedPath) return null;
        return findNodeByPath(workspace, selectedPath);
    }, [workspace, selectedPath]);

    useEffect(() => { setCode(selectedFileNode?.content || ''); }, [selectedFileNode]);

    const handleSelect = (node: DeepReadonly<FileNode> | null, path: string) => {
        if (node?.type === 'file') {
            setSelectedPath(path);
        } else {
            setSelectedPath(null);
        }
    };

    const handleSave = () => {
        if(selectedPath && selectedFileNode) {
            dispatch({ type: 'UPDATE_WORKSPACE_FILE_CONTENT', payload: { path: selectedPath, content: code } });
            toast.success(`${selectedFileNode.name} saved!`);
        }
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 h-full">
            <div className="md:col-span-1 h-full bg-[var(--color-surface)] rounded-lg p-2 overflow-y-auto"><FileTreeView nodes={workspace} onSelect={handleSelect} selectedPath={selectedPath} /></div>
            <div className="md:col-span-2 h-full bg-[var(--color-surface)] rounded-lg overflow-hidden flex flex-col">
                <div className="flex-shrink-0 p-2 border-b border-[var(--color-border)] flex justify-between items-center">
                    <span className="font-mono text-sm">{selectedPath || 'No file selected'}</span>
                    <button onClick={handleSave} disabled={!selectedFileNode} className="flex items-center gap-2 text-sm px-3 py-1 bg-[var(--color-surface-light)] hover:bg-[var(--color-border)] rounded-md disabled:opacity-50"><FaFloppyDisk /> Save</button>
                </div>
                <div className="flex-1 relative">
                <MonacoEditor
                    height="100%"
                    language={selectedFileNode?.name.endsWith('.java') ? 'java' : selectedFileNode?.name.endsWith('.xml') ? 'xml' : 'html'}
                    theme="vs-dark"
                    value={code}
                    onChange={setCode}
                    options={{ minimap: { enabled: false }, automaticLayout: true, scrollBeyondLastLine: false }}
                />
                </div>
            </div>
        </div>
    );
};

// --- Sub-component: APK Analyzer (Advanced) ---
const APKAnalyzer: FC<{apkInfo: ApkInfo}> = ({ apkInfo }) => {
    type ApkTab = 'sources' | 'resources' | 'dependencies' | 'scan';
    const [activeTab, setActiveTab] = useState<ApkTab>('scan');

    const tabs: {id: ApkTab, label: string, icon: React.ReactNode}[] = [
        {id: 'scan', label: 'Security', icon: <FaShieldHalved />},
        {id: 'sources', label: 'Sources', icon: <FaCode />},
        {id: 'resources', label: 'Resources', icon: <FaLayerGroup />},
        {id: 'dependencies', label: 'Dependencies', icon: <FaCodeBranch />},
    ];
    
    const severityColors: Record<SecurityFinding['severity'], string> = {
        'High': 'bg-red-500/20 text-red-400',
        'Medium': 'bg-yellow-500/20 text-yellow-400',
        'Low': 'bg-green-500/20 text-green-400',
        'Info': 'bg-blue-500/20 text-blue-400'
    };

    const renderContent = () => {
        switch(activeTab) {
            case 'sources': return <div className="h-96 overflow-y-auto"><FileTreeView nodes={apkInfo.decompiledSources} onSelect={()=>{}} selectedPath={null} /></div>;
            case 'resources': return <div className="h-96 overflow-y-auto"><FileTreeView nodes={apkInfo.resources} onSelect={()=>{}} selectedPath={null} /></div>;
            case 'dependencies': return (
                 <div className="space-y-2 text-sm font-mono max-h-96 overflow-y-auto">
                    {apkInfo.dependencies.map(dep => <div key={dep} className="bg-[var(--color-surface)] p-2 rounded-md">{dep}</div>)}
                </div>
            );
            case 'scan': return (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                    {apkInfo.securityReport.map(finding => (
                        <details key={finding.id} className={`p-3 rounded-lg ${severityColors[finding.severity]}`}>
                            <summary className="font-bold cursor-pointer flex justify-between items-center">
                                <span>{finding.title}</span>
                                <span className={`text-xs px-2 py-0.5 rounded-full ${severityColors[finding.severity]}`}>{finding.severity}</span>
                            </summary>
                            <div className="mt-2 text-sm space-y-2 border-t border-current/20 pt-2">
                                <p><strong>Description:</strong> {finding.description}</p>
                                <p><strong>Resolution:</strong> {finding.resolution}</p>
                            </div>
                        </details>
                    ))}
                </div>
            );
        }
    };

    return (
        <div className="bg-[var(--color-surface)] p-4 rounded-lg">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <FaBoxOpen size={24} className="text-[var(--color-primary)]"/>
                    <div>
                        <h3 className="font-bold">APK Analysis: {apkInfo.name}</h3>
                        <p className="text-xs text-[var(--color-text-secondary)]">{apkInfo.packageName}</p>
                    </div>
                </div>
            </div>
            <div className="flex border-b border-[var(--color-border)] mb-4">
                {tabs.map(t => <button key={t.id} onClick={() => setActiveTab(t.id)} className={`flex items-center gap-2 px-4 py-2 text-sm ${activeTab === t.id ? 'text-white border-b-2 border-[var(--color-primary)]' : 'text-[var(--color-text-secondary)] hover:text-white'}`}>{t.icon}{t.label}</button>)}
            </div>
            <div>{renderContent()}</div>
        </div>
    );
};

// --- Sub-component: Device Manager ---
const DeviceManager = () => (
    <div className="bg-[var(--color-surface)] p-4 rounded-lg">
        <h3 className="font-bold mb-4">Devices</h3>
        <div className="space-y-2">
            {MOCK_DEVICES.map(d => (
                <div key={d.id} className="flex items-center justify-between p-2 bg-[var(--color-surface-light)] rounded-md">
                    <div className="flex items-center gap-3">
                        <FaMobileScreenButton className={`w-6 h-6 ${d.status === 'connected' ? 'text-green-400' : 'text-gray-500'}`} />
                        <div>
                            <p className="font-semibold">{d.name}</p>
                            <p className="text-xs text-[var(--color-text-secondary)]">{d.platform} {d.apiLevel}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                         <span className={`text-xs px-2 py-0.5 rounded-full ${d.status === 'connected' ? 'bg-green-500/20 text-green-400' : 'bg-gray-500/20 text-gray-400'}`}>{d.status}</span>
                         <button disabled={d.status !== 'connected'} className="p-1 hover:bg-[var(--color-border)] rounded-md disabled:opacity-50"><FaRotate /></button>
                         <button disabled={d.status !== 'connected'} className="p-1 hover:bg-[var(--color-border)] rounded-md disabled:opacity-50"><FaPowerOff /></button>
                    </div>
                </div>
            ))}
        </div>
    </div>
);

// --- Sub-component: Logcat Viewer ---
const LogcatViewer = () => {
    const [logs, setLogs] = useState<LogEntry[]>([]);
    const [isPaused, setIsPaused] = useState(false);
    const endRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if(isPaused) return;
        const interval = setInterval(() => {
            setLogs(prev => [...prev, generateLog()].slice(-200)); // Keep last 200 logs
        }, 1500);
        return () => clearInterval(interval);
    }, [isPaused]);

    useEffect(() => {
        if(!isPaused) endRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [logs, isPaused]);

    const levelColors: {[key in LogEntry['level']]: string} = { info: 'text-blue-400', debug: 'text-gray-400', warn: 'text-yellow-400', error: 'text-red-500' };

    return (
        <div className="bg-[var(--color-surface)] rounded-lg flex flex-col h-full">
            <div className="flex-shrink-0 p-2 border-b border-[var(--color-border)] flex items-center justify-between">
                <h3 className="font-bold text-sm">Logcat</h3>
                <div className="flex items-center gap-2">
                    <input type="text" placeholder="Filter logs..." className="bg-[var(--color-background)] text-xs px-2 py-1 rounded-md border border-[var(--color-border)]" />
                    <button onClick={() => setIsPaused(!isPaused)} className="p-1 hover:bg-[var(--color-border)] rounded-md">{isPaused ? <FaPlay /> : <FaPause />}</button>
                    <button onClick={() => setLogs([])} className="p-1 hover:bg-[var(--color-border)] rounded-md"><FaTrash /></button>
                </div>
            </div>
            <div className="flex-1 p-2 overflow-y-auto font-mono text-xs">
                {logs.map((log, i) => (
                    <div key={i} className="flex">
                        <span className="text-gray-500 mr-2">{log.timestamp}</span>
                        <span className={`${levelColors[log.level]} w-12 flex-shrink-0`}>{log.level.toUpperCase()}</span>
                        <span className="text-purple-400 w-28 flex-shrink-0">{log.source}</span>
                        <span className="text-white flex-1 whitespace-pre-wrap">{log.message}</span>
                    </div>
                ))}
                <div ref={endRef} />
            </div>
        </div>
    );
};

// --- Sub-component: System Tools ---
const SystemTools = () => {
    const [isRooted, setIsRooted] = useState(true);
    const [magiskModules, setMagiskModules] = useState(MOCK_MAGISK_MODULES);
    const [xposedHooks, setXposedHooks] = useState(MOCK_XPOSED_HOOKS);

    const toggleModule = (id: string) => setMagiskModules(mods => mods.map(m => m.id === id ? {...m, enabled: !m.enabled} : m));
    const toggleHook = (id: string) => setXposedHooks(hooks => hooks.map(h => h.id === id ? {...h, enabled: !h.enabled} : h));

    return (
        <div className="grid grid-cols-2 gap-4 h-full">
            <div className="bg-[var(--color-surface)] p-4 rounded-lg flex flex-col">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="font-bold">Magisk Module Manager</h3>
                    <div className="flex items-center gap-2 text-sm">
                        <span className={isRooted ? 'text-green-400' : 'text-gray-400'}>Root Access</span>
                        <label className="toggle-switch"><input type="checkbox" checked={isRooted} onChange={() => setIsRooted(!isRooted)} /><span className="toggle-slider"></span></label>
                    </div>
                </div>
                <div className="space-y-2 overflow-y-auto">
                    {magiskModules.map(mod => (
                        <div key={mod.id} className="flex items-center justify-between p-2 bg-[var(--color-surface-light)] rounded-md text-sm">
                            <div>
                                <p>{mod.name} <span className="text-xs text-gray-400">{mod.version}</span></p>
                                <p className="text-xs text-gray-400">by {mod.author}</p>
                            </div>
                            <label className="toggle-switch"><input type="checkbox" checked={mod.enabled} onChange={() => toggleModule(mod.id)} disabled={!isRooted} /><span className="toggle-slider"></span></label>
                        </div>
                    ))}
                </div>
            </div>
            <div className="bg-[var(--color-surface)] p-4 rounded-lg flex flex-col">
                <h3 className="font-bold mb-4">LSPosed Hook Manager</h3>
                <div className="space-y-2 overflow-y-auto">
                    {xposedHooks.map(hook => (
                        <div key={hook.id} className="flex items-center justify-between p-2 bg-[var(--color-surface-light)] rounded-md text-sm">
                            <div>
                                <p>{hook.name}</p>
                                <p className="text-xs text-gray-400 font-mono" title={hook.description}>{hook.targetClass}.{hook.targetMethod}</p>
                            </div>
                             <label className="toggle-switch"><input type="checkbox" checked={hook.enabled} onChange={() => toggleHook(hook.id)} disabled={!isRooted} /><span className="toggle-slider"></span></label>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

// --- Sub-component: Build & Deploy ---
const BuildDeploy = () => {
    const { state: { buildState }, dispatch } = useAppContext();
    const logEndRef = useRef<HTMLDivElement>(null);
    useEffect(() => { logEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [buildState.log]);

    const handleBuild = () => {
        dispatch({ type: 'SET_BUILD_STATE', payload: { status: 'building', log: ['Build process started...'], startTime: Date.now(), endTime: undefined, outputUrl: undefined } });

        const mockLog: string[] = [
            'vite v5.2.0 building for production...',
            '✓ 24 modules transformed (24 ops, 0.21s)',
            'rendering chunks...',
            'computing gzip size...',
            'dist/index.html   0.48 kB │ gzip: 0.31 kB',
            'dist/assets/index-3f8c8b1a.css   2.11 kB │ gzip: 0.84 kB',
            'dist/assets/index-8a6b4c2d.js   52.49 kB │ gzip: 19.33 kB'
        ];
        
        let i = 0;
        const interval = setInterval(() => {
            if (i < mockLog.length) {
                dispatch({ type: 'SET_BUILD_STATE', payload: { log: [...buildState.log, mockLog[i]] } });
                i++;
            } else {
                clearInterval(interval);
                dispatch({ type: 'SET_BUILD_STATE', payload: { status: 'success', endTime: Date.now(), outputUrl: `https://pro-verve-preview-1a2b3c.vercel.app` }});
            }
        }, 500);
    };

    const statusColors: Record<BuildStatus, string> = {
        idle: 'text-gray-400',
        building: 'text-blue-400 animate-pulse',
        success: 'text-green-400',
        failed: 'text-red-400',
    };

    return (
        <div className="grid grid-cols-3 gap-4 h-full">
            <div className="col-span-1 bg-[var(--color-surface)] p-4 rounded-lg flex flex-col">
                <h3 className="font-bold mb-4">Configuration</h3>
                <div className="space-y-4">
                     <div>
                        <label className="text-sm font-medium text-[var(--color-text-secondary)] mb-1 block">Build Target</label>
                        <select className="w-full bg-[var(--color-background)] p-2 rounded border border-[var(--color-border)]">
                            <option value="web">Web (Vercel)</option>
                            <option value="android">Android (APK)</option>
                            <option value="ios">iOS (IPA)</option>
                        </select>
                     </div>
                     <div>
                        <label className="text-sm font-medium text-[var(--color-text-secondary)] mb-1 block">Environment</label>
                        <select className="w-full bg-[var(--color-background)] p-2 rounded border border-[var(--color-border)]">
                            <option value="production">Production</option>
                            <option value="preview">Preview</option>
                            <option value="development">Development</option>
                        </select>
                     </div>
                </div>
                <div className="mt-auto">
                    <button onClick={handleBuild} disabled={buildState.status === 'building'} className="w-full py-3 bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] rounded-lg font-bold disabled:opacity-50 flex items-center justify-center gap-2">
                        {buildState.status === 'building' ? <FaRotate className="animate-spin" /> : <FaRocket />}
                        Build & Deploy
                    </button>
                </div>
            </div>
            <div className="col-span-2 bg-[var(--color-surface)] p-4 rounded-lg flex flex-col">
                <div className="flex justify-between items-center mb-2">
                    <h3 className="font-bold">Build Log</h3>
                    <p className={`font-mono text-sm uppercase ${statusColors[buildState.status]}`}>{buildState.status}</p>
                </div>
                <div className="flex-1 bg-black rounded-md p-2 font-mono text-xs overflow-y-auto">
                    {buildState.log.map((line, i) => <p key={i}>{line}</p>)}
                    <div ref={logEndRef} />
                </div>
                {buildState.status === 'success' && (
                    <div className="mt-2 text-center bg-green-500/10 p-2 rounded-md">
                        <p className="text-green-400">Deployment successful!</p>
                        <a href={buildState.outputUrl} target="_blank" rel="noreferrer" className="text-sm text-cyan-400 hover:underline">{buildState.outputUrl}</a>
                    </div>
                )}
            </div>
        </div>
    );
};

// --- Main DevTools Component ---
type TabId = 'build' | 'dev' | 'apk' | 'system' | 'devices' | 'perf' | 'state' | 'api';
export const DevTools: FC = () => {
    const { state } = useAppContext();
    const { projectName, pages, customComponents } = state;
    const [activeTab, setActiveTab] = useState<TabId>('apk');

    const dynamicApkInfo = useMemo(() => generateDynamicApkInfo(projectName, pages, customComponents), [projectName, pages, customComponents]);

    const tabs: { id: TabId, name: string, icon: React.ReactNode }[] = [
        { id: 'build', name: 'Build', icon: <FaRocket /> },
        { id: 'dev', name: 'Code', icon: <FaCode /> },
        { id: 'apk', name: 'Analysis', icon: <FaBoxOpen /> },
        { id: 'system', name: 'System', icon: <FaGear /> },
        { id: 'devices', name: 'Devices', icon: <FaMobileScreenButton /> },
        { id: 'perf', name: 'Perf', icon: <FaChartLine /> },
        { id: 'state', name: 'State', icon: <FaChartBar /> },
        { id: 'api', name: 'Mock API', icon: <FaServer /> },
    ];

    const renderContent = () => {
        switch(activeTab) {
            case 'build': return <BuildDeploy />;
            case 'dev': return <DevelopmentView />;
            case 'apk': return <APKAnalyzer apkInfo={dynamicApkInfo} />;
            case 'system': return <SystemTools />;
            case 'devices': return (
                <div className="flex flex-col gap-4 h-full">
                    <div className="flex-1"><DeviceManager/></div>
                    <div className="flex-[2] min-h-0"><LogcatViewer/></div>
                </div>
            );
            case 'perf': return (
                <div className="flex flex-col gap-4">
                    <div className="flex gap-4">
                        <PerformanceChart title="CPU" icon={<FaMicrochip />} color="#8A42F4" unit="%" max={100} />
                        <PerformanceChart title="Memory" icon={<FaDatabase />} color="#00E0FF" unit="MB" max={4096} />
                    </div>
                    <div className="flex gap-4">
                         <PerformanceChart title="Network" icon={<FaWifi />} color="#F44336" unit="kb/s" max={2000} />
                         <PerformanceChart title="Disk I/O" icon={<FaFloppyDisk />} color="#4CAF50" unit="mb/s" max={50} />
                    </div>
                </div>
            );
            case 'state': return <StateInspector />;
            case 'api': return <MockApiEditor />;
        }
    }

    return (
        <div className="flex-1 flex bg-[var(--color-background)] overflow-hidden">
            <nav className="w-20 bg-[var(--color-surface)] flex flex-col items-center py-4 gap-2">
                {tabs.map(tab => (
                    <button 
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        title={tab.name}
                        className={`w-full p-3 flex flex-col items-center justify-center gap-1 text-xs transition-colors relative ${activeTab === tab.id ? 'text-white' : 'text-[var(--color-text-secondary)] hover:text-white hover:bg-[var(--color-surface-light)]'}`}
                    >
                        {activeTab === tab.id && <div className="absolute left-0 top-0 bottom-0 w-1 bg-[var(--color-primary)] rounded-r-full"/>}
                        {tab.icon}
                        <span className="truncate">{tab.name}</span>
                    </button>
                ))}
            </nav>
            <main className="flex-1 p-4 overflow-y-auto">
                {renderContent()}
            </main>
        </div>
    );
};