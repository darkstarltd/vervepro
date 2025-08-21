import React, { useState, useEffect, useRef, KeyboardEvent, useCallback } from 'react';
import { useAppContext } from '../context/AppContext';

const TerminalOutput: React.FC<{ line: string }> = ({ line }) => {
    return <div dangerouslySetInnerHTML={{ __html: line.replace(/ /g, '&nbsp;') }} />;
};

export const TerminalPanel: React.FC = () => {
    const { state, dispatch } = useAppContext();
    const { unsavedChanges, commits } = state;
    const [history, setHistory] = useState<string[]>(['Pro-Verve Terminal v2.0. Type `help` for commands.']);
    const [input, setInput] = useState('');
    const [commandHistory, setCommandHistory] = useState<string[]>([]);
    const [historyIndex, setHistoryIndex] = useState(-1);
    const endOfTerminalRef = useRef<HTMLDivElement>(null);

    const executeCommand = (command: string) => {
        const [cmd, ...args] = command.split(' ');
        let output: string | string[] = `<span class="text-red-500">command not found: ${cmd}</span>`;
        switch (cmd.toLowerCase()) {
            case 'help':
                output = [
                    'Available commands:',
                    '> <span class="text-cyan-400">help</span>              - Shows this help message.',
                    '> <span class="text-cyan-400">clear</span>             - Clears the terminal screen.',
                    '> <span class="text-cyan-400">git</span>               - Interact with source control (status, log, commit).',
                    '> <span class="text-cyan-400">proverve</span>          - Displays system information.',
                ];
                break;
            case 'clear':
                setHistory([]);
                return;
            case 'proverve':
                output = [
                    'Pro-Verve Visual Development Environment',
                    '<span class="text-gray-500">Version:</span> 2.0.1',
                    '<span class="text-gray-500">AI Core:</span> Gemini 2.5 Flash',
                    '<span class="text-gray-500">Status:</span> <span class="text-green-400">All systems operational</span>'
                ];
                break;
            case 'git':
                const gitCmd = args[0]?.toLowerCase();
                if (gitCmd === 'status') {
                    output = `You have <span class="text-yellow-400">${unsavedChanges}</span> unsaved changes.`;
                } else if (gitCmd === 'log') {
                    if (commits.length === 0) {
                        output = 'No commits yet.';
                    } else {
                        output = commits.flatMap(c => [
                            `<span class="text-yellow-400">commit ${c.id}</span>`,
                            `Date:   ${new Date(c.timestamp).toLocaleString()}`,
                            ``,
                            `    ${c.message}`,
                            ` `
                        ]);
                    }
                } else if (gitCmd === 'commit' && args[1] === '-m') {
                    const message = args.slice(2).join(' ');
                    if (message) {
                        dispatch({ type: 'COMMIT_CHANGES', payload: message });
                        output = `Committed changes: "${message}"`;
                    } else {
                        output = 'Please provide a commit message.';
                    }
                } else {
                    output = 'Usage: git <status|log|commit -m "message">';
                }
                break;
        }
        setHistory(prev => [...prev, `<span class="text-green-400">$</span> ${command}`, ...(Array.isArray(output) ? output : [output])]);
    };

    const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' && input.trim()) {
            const trimmedInput = input.trim();
            executeCommand(trimmedInput);
            if (trimmedInput) {
                setCommandHistory(prev => [trimmedInput, ...prev.filter(c => c !== trimmedInput)]);
            }
            setInput('');
            setHistoryIndex(-1);
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            if (commandHistory.length > 0) {
                const newIndex = Math.min(commandHistory.length - 1, historyIndex + 1);
                setHistoryIndex(newIndex);
                setInput(commandHistory[newIndex]);
            }
        } else if (e.key === 'ArrowDown') {
            e.preventDefault();
            if (historyIndex >= 0) {
                const newIndex = Math.max(-1, historyIndex - 1);
                setHistoryIndex(newIndex);
                setInput(newIndex === -1 ? '' : commandHistory[newIndex]);
            }
        }
    };

    useEffect(() => {
        endOfTerminalRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [history]);

    return (
        <div className="bg-black text-white font-mono text-sm h-full flex flex-col">
            <div className="flex-1 p-4 overflow-y-auto" onClick={() => document.getElementById('terminal-input')?.focus()}>
                {history.map((line, i) => <TerminalOutput key={i} line={line} />)}
                <div className="flex items-center">
                    <span className="text-green-400">$</span>
                    <input
                        id="terminal-input"
                        type="text"
                        value={input}
                        onChange={e => setInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        className="bg-transparent border-none outline-none text-white flex-1 ml-2"
                        autoFocus
                        autoComplete="off"
                    />
                </div>
                <div ref={endOfTerminalRef} />
            </div>
        </div>
    );
};
