/**
 * WorkspacePage — real-time collaborative code editor.
 * Split-screen: participant list (left) + Monaco Editor (right).
 * @module components/collaboration/WorkspacePage
 */

import { useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import MonacoEditor from '@monaco-editor/react';
import { useAuth } from 'react-oidc-context';
import { useCollaboration } from '../../hooks/useCollaboration';
import ParticipantList from './ParticipantList';
import Spinner from '../ui/Spinner';

const LANGUAGES = [
    { label: 'JavaScript', value: 'javascript' },
    { label: 'Python', value: 'python' },
    { label: 'TypeScript', value: 'typescript' },
    { label: 'Java', value: 'java' },
    { label: 'C++', value: 'cpp' },
    { label: 'Go', value: 'go' },
];

export default function WorkspacePage() {
    const { roomId } = useParams();
    const auth = useAuth();
    const [language, setLanguage] = useState('javascript');
    const editorRef = useRef(null);
    const { ydoc, provider, awareness, isConnected } = useCollaboration(roomId || 'default-room');

    const name = auth.user?.profile?.name || 'Anonymous';
    const roles = auth.user?.profile?.realm_access?.roles ?? [];
    const role = ['ADMIN', 'TEACHER', 'STUDENT'].find((r) => roles.includes(r)) || 'STUDENT';

    function handleEditorMount(editor, monaco) {
        editorRef.current = editor;

        // Set awareness state for participant list
        if (awareness) {
            awareness.setLocalStateField('user', {
                name,
                role,
                color: '#F59E0B',
            });
        }

        // Yjs MonacoBinding would be wired here in production
        // Requires: import { MonacoBinding } from 'y-monaco';
        // const ytext = ydoc.getText('monaco');
        // new MonacoBinding(ytext, editor.getModel(), new Set([editor]), awareness);
    }

    return (
        <div className="flex h-[calc(100vh-4rem)] bg-navy-900">
            {/* Left panel — Participants */}
            <div className="w-70 flex-shrink-0 border-r border-white/5 bg-navy-800 flex flex-col">
                <div className="p-4 border-b border-white/5">
                    <div className="flex items-center justify-between">
                        <h2 className="text-chalk-100 font-semibold text-sm">Participants</h2>
                        <div className={`flex items-center gap-1.5 text-xs ${isConnected ? 'text-green-400' : 'text-chalk-400'}`}>
                            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-400 animate-pulse' : 'bg-chalk-400'}`} />
                            {isConnected ? 'Live' : 'Connecting...'}
                        </div>
                    </div>
                </div>
                <ParticipantList awareness={awareness} />
            </div>

            {/* Right panel — Monaco Editor */}
            <div className="flex-1 flex flex-col min-w-0">
                {/* Toolbar */}
                <div className="h-12 bg-navy-800 border-b border-white/5 flex items-center justify-between px-4">
                    <div className="flex items-center gap-3">
                        <select
                            value={language}
                            onChange={(e) => setLanguage(e.target.value)}
                            className="bg-navy-700 text-chalk-200 text-sm rounded-lg px-3 py-1.5 border border-white/10 focus:outline-none focus:border-amber-400/50"
                        >
                            {LANGUAGES.map((l) => (
                                <option key={l.value} value={l.value}>{l.label}</option>
                            ))}
                        </select>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-chalk-400 text-xs">Room: {roomId}</span>
                        <button className="bg-amber-400 hover:bg-amber-500 text-navy-900 text-sm font-semibold px-3 py-1.5 rounded-lg transition-colors">
                            ▶ Run
                        </button>
                    </div>
                </div>

                {/* Editor */}
                <div className="flex-1">
                    <MonacoEditor
                        height="100%"
                        language={language}
                        defaultValue={`// Virtual Classroom — Collaborative Workspace\n// Room: ${roomId}\n// Start typing to collaborate in real-time!\n`}
                        theme="vs-dark"
                        onMount={handleEditorMount}
                        options={{
                            fontSize: 14,
                            fontFamily: '"JetBrains Mono", "Fira Code", monospace',
                            minimap: { enabled: false },
                            padding: { top: 16 },
                            lineNumbers: 'on',
                            scrollBeyondLastLine: false,
                            automaticLayout: true,
                        }}
                    />
                </div>
            </div>
        </div>
    );
}
