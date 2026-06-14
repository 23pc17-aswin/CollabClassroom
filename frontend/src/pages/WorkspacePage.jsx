import { useEffect, useRef, useState, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from 'react-oidc-context';
import { useApi } from '../hooks/useApi';
import { useCollaboration } from '../hooks/useCollaboration';
import { io } from 'socket.io-client';
import toast from 'react-hot-toast';

const COLORS = ['#f59e0b', '#3b82f6', '#10b981', '#8b5cf6', '#ef4444', '#ec4899'];
const randomColor = () => COLORS[Math.floor(Math.random() * COLORS.length)];

const LANGUAGES = [
  { label: 'JavaScript', value: 'javascript' },
  { label: 'Python', value: 'python' },
  { label: 'Java', value: 'java' },
  { label: 'TypeScript', value: 'typescript' },
  { label: 'C++', value: 'cpp' },
  { label: 'Rust', value: 'rust' }
];

export default function WorkspacePage() {
  const { classroomId, roomId: paramRoomId } = useParams();
  const roomId = (classroomId || paramRoomId || 'default') + '-workspace';

  const auth = useAuth();
  const api = useApi();
  const [user, setUser] = useState(null);
  const [language, setLanguage] = useState('javascript');
  const [participants, setParticipants] = useState([]);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [sharing, setSharing] = useState(false);

  // Terminal State
  const [output, setOutput] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [showTerminal, setShowTerminal] = useState(false);

  const editorRef = useRef(null);
  const bindingRef = useRef(null);

  const { ydoc, provider, awareness, isConnected } = useCollaboration(roomId);

  useEffect(() => {
    api.get('/api/v2/users/me').then(res => setUser(res.data)).catch(console.error);
  }, []);

  useEffect(() => {
    if (!awareness || !user) return;
    // This tells Yjs who this user is and what color their cursor should be
    awareness.setLocalStateField('user', {
      name: user.name,
      role: user.role,
      color: randomColor(),
    });
  }, [awareness, user]);

  useEffect(() => {
    if (!awareness) return;
    const updateParticipants = () => {
      const states = [];
      awareness.getStates().forEach((state, clientId) => {
        if (state.user) {
          states.push({ clientId, ...state.user, isLocal: clientId === awareness.clientID });
        }
      });
      setParticipants(states);
    };
    awareness.on('change', updateParticipants);
    updateParticipants();
    return () => awareness.off('change', updateParticipants);
  }, [awareness]);

  const handleEditorMount = useCallback(async (editor, monaco) => {
    editorRef.current = editor;
    
    if (!ydoc || !awareness) return;
    
    const { MonacoBinding } = await import('y-monaco');
    const yText = ydoc.getText('monaco');
    
    bindingRef.current = new MonacoBinding(
      yText,
      editor.getModel(),
      new Set([editor]),
      awareness
    );
  }, [ydoc, awareness]);

  const shareUrl = () => {
    if (!auth.user?.access_token || !classroomId || sharing) return;
    setSharing(true);
    
    const url = window.location.href;
    navigator.clipboard.writeText(url);
    
    const socket = io(import.meta.env.VITE_API_URL || 'http://localhost:8000', {
      auth: { token: auth.user.access_token },
      transports: ['websocket'],
    });

    socket.on('connect', () => {
      socket.emit('classroom:join', classroomId);
      setTimeout(() => {
        socket.emit('chat:send', {
          classroomId,
          text: `🚀 I have started a Live Workspace! Join here: ${url}`
        });
        toast.success('Workspace Invite sent to Class Chat!');
        setTimeout(() => {
            socket.disconnect();
            setSharing(false);
        }, 500);
      }, 500);
    });
  };

  // 🔥 UPGRADED: Execute Code Function
  const runCode = async () => {
    if (!editorRef.current) return;
    const code = editorRef.current.getValue();
    if (!code.trim()) {
        toast.error("Please write some code first!");
        return;
    }

    setIsRunning(true);
    setShowTerminal(true);

    // ── NATIVE BROWSER RUNNER FOR JAVASCRIPT ──
    if (language === 'javascript') {
        setOutput('Executing JavaScript locally...');
        
        setTimeout(() => {
            const originalLog = console.log;
            const originalError = console.error;
            let logs = [];
            
            // Intercept console commands to display in our terminal
            console.log = (...args) => logs.push(args.map(a => typeof a === 'object' ? JSON.stringify(a) : a).join(' '));
            console.error = (...args) => logs.push('[Error] ' + args.join(' '));
            
            try {
                // Execute the code safely
                const fn = new Function(code);
                fn();
                setOutput(logs.join('\n') || '\n[Program exited with no output]');
            } catch (err) {
                setOutput(logs.join('\n') + `\n[Execution Error]: ${err.message}`);
            }
            
            // Restore normal console behavior
            console.log = originalLog;
            console.error = originalError;
            setIsRunning(false);
        }, 300);
        return;
    }

    // ── FALLBACK FOR OTHER LANGUAGES ──
    setOutput(
      `Execution failed: Public Piston API is locked down.\n\n` +
      `Note: To run ${language}, you will need to add an execution engine (like a local Docker Piston container or a Judge0 API key) to your backend.\n\n` + 
      `For now, switch the language to "JavaScript" to test the real-time execution feature in the browser!`
    );
    setIsRunning(false);
  };

  return (
    <>
      {/* 🔥 NEW: Custom CSS to force Yjs Cursor Nametags to display! */}
      <style>{`
        .yRemoteSelectionHead::after {
            position: absolute;
            content: attr(data-client-name);
            top: -22px;
            left: -2px;
            color: #ffffff !important;
            font-size: 11px !important;
            font-weight: 700;
            font-family: ui-sans-serif, system-ui, sans-serif;
            padding: 2px 8px;
            border-radius: 4px;
            pointer-events: none;
            z-index: 50;
            white-space: nowrap;
            /* Add a subtle shadow so it pops off the dark background */
            box-shadow: 0 2px 4px rgba(0,0,0,0.3);
        }
        /* Fade the highlight slightly so the text is easier to read */
        .yRemoteSelection {
            opacity: 0.4;
        }
      `}</style>

      <div className="flex h-[calc(100vh-4rem)] bg-[#0F1729] rounded-2xl overflow-hidden border border-[#1e3a5f]">
        
        {/* Sidebar */}
        {sidebarOpen && (
          <aside className="w-64 bg-[#162133] border-r border-[#1e3a5f] flex flex-col">
            <div className="p-4 border-b border-[#1e3a5f]">
              <h3 className="text-white font-semibold text-sm truncate">
                {classroomId ? `Room: ${classroomId}` : 'Workspace'}
              </h3>
              <div className="flex items-center gap-2 mt-1">
                  <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-400 animate-pulse' : 'bg-red-400'}`} />
                  <p className="text-slate-500 text-xs">{isConnected ? 'Live Collaboration' : 'Connecting...'}</p>
              </div>
            </div>
            <div className="p-4 flex-1 overflow-y-auto">
              <p className="text-slate-400 text-xs font-medium uppercase tracking-wide mb-3">
                Participants ({participants.length})
              </p>
              <div className="space-y-2">
                {participants.map(p => (
                  <div key={p.clientId} className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: p.color }} />
                    <span className="text-white text-sm truncate">{p.name}{p.isLocal ? ' (you)' : ''}</span>
                    <span className={`text-xs ml-auto ${p.role === 'TEACHER' ? 'text-amber-400' : p.role === 'ADMIN' ? 'text-red-400' : 'text-slate-500'}`}>
                      {p.role}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </aside>
        )}

        {/* Main Panel */}
        <div className="flex-1 flex flex-col min-w-0">
          
          {/* Toolbar */}
          <div className="flex items-center gap-3 px-4 py-2.5 bg-[#162133] border-b border-[#1e3a5f]">
            <button onClick={() => setSidebarOpen(p => !p)} className="text-slate-400 hover:text-white text-lg leading-none">
              {sidebarOpen ? '◀' : '▶'}
            </button>
            <select
              value={language}
              onChange={e => setLanguage(e.target.value)}
              className="bg-[#0F1729] border border-[#1e3a5f] text-white rounded-lg px-2 py-1 text-xs focus:outline-none focus:border-amber-500"
            >
              {LANGUAGES.map(l => <option key={l.value} value={l.value}>{l.label}</option>)}
            </select>
            <span className="text-slate-600 text-xs hidden sm:block">
                workspace.{language === 'javascript' ? 'js' : language === 'typescript' ? 'ts' : language === 'python' ? 'py' : language === 'cpp' ? 'cpp' : language}
            </span>
            
            <div className="ml-auto flex items-center gap-2">
              <div className="flex gap-1 mr-2">
                {participants.slice(0, 5).map(p => (
                  <div key={p.clientId} className="w-6 h-6 rounded-full border-2 border-[#162133] -ml-2 first:ml-0 flex items-center justify-center text-[10px] font-bold text-white" style={{ backgroundColor: p.color }} title={p.name}>
                      {p.name.charAt(0).toUpperCase()}
                  </div>
                ))}
              </div>

              <button onClick={runCode} disabled={isRunning}
                  className="flex items-center gap-2 text-xs font-bold text-white bg-green-600 hover:bg-green-500 px-4 py-1.5 rounded-lg transition-colors disabled:opacity-50">
                  {isRunning ? <span className="animate-spin w-3 h-3 border-2 border-white border-t-transparent rounded-full" /> : '▶'} 
                  {isRunning ? 'Running...' : 'Run Code'}
              </button>

              {user?.role !== 'STUDENT' && (
                  <button onClick={shareUrl} disabled={sharing}
                    className="text-xs font-bold text-navy-900 bg-amber-400 hover:bg-amber-500 px-4 py-1.5 rounded-lg transition-colors disabled:opacity-50">
                    {sharing ? 'Sharing...' : 'Share to Class'}
                  </button>
              )}
            </div>
          </div>

          {/* Editor Area */}
          <div className="flex-1 relative flex flex-col min-h-0">
            
            <div className="flex-1 min-h-0">
              {ydoc && awareness ? (
                <MonacoEditorWrapper language={language} onMount={handleEditorMount} />
              ) : (
                <div className="absolute inset-0 bg-[#0F1729] flex flex-col items-center justify-center z-10">
                  <div className="animate-spin w-8 h-8 border-2 border-amber-400 border-t-transparent rounded-full mb-4" />
                  <p className="text-amber-400 text-sm font-medium">Connecting to Collaboration Server...</p>
                </div>
              )}
            </div>

            {/* Terminal Panel */}
            {showTerminal && (
                <div className="h-48 bg-[#0F1729] border-t border-[#1e3a5f] flex flex-col shadow-[0_-4px_20px_rgba(0,0,0,0.3)] z-20">
                    <div className="flex items-center justify-between px-4 py-2 bg-[#162133] border-b border-[#1e3a5f]">
                        <span className="text-slate-400 text-xs font-bold uppercase tracking-wider flex items-center gap-2">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 9l3 3-3 3m5 0h3M4 18h16a2 2 0 002-2V6a2 2 0 00-2-2H4a2 2 0 00-2 2v10a2 2 0 002 2z"></path></svg>
                            Terminal Output
                        </span>
                        <div className="flex gap-3">
                            <button onClick={() => setOutput('')} className="text-slate-500 hover:text-slate-300 text-xs">Clear</button>
                            <button onClick={() => setShowTerminal(false)} className="text-slate-500 hover:text-slate-300 text-xs">✕ Close</button>
                        </div>
                    </div>
                    <div className="flex-1 p-4 overflow-y-auto font-mono text-sm text-slate-300 whitespace-pre-wrap selection:bg-amber-500/30">
                        {output}
                    </div>
                </div>
            )}

          </div>
        </div>
      </div>
    </>
  );
}

function MonacoEditorWrapper({ language, onMount }) {
  const [Editor, setEditor] = useState(null);
  useEffect(() => {
    import('@monaco-editor/react').then(m => setEditor(() => m.default));
  }, []);
  
  if (!Editor) return <div className="flex items-center justify-center h-full"><div className="animate-spin w-6 h-6 border-2 border-amber-400 border-t-transparent rounded-full" /></div>;
  
  return (
    <Editor
      height="100%"
      language={language}
      theme="vs-dark"
      onMount={onMount}
      options={{
        fontSize: 14,
        minimap: { enabled: false },
        scrollBeyondLastLine: false,
        automaticLayout: true,
        padding: { top: 16 },
      }}
    />
  );
}