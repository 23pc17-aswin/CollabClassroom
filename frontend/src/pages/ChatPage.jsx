import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { io } from 'socket.io-client';
import { useAuth } from 'react-oidc-context';
import { useApi } from '../hooks/useApi';
import toast from 'react-hot-toast';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export default function ChatPage({ classroomId: propClassroomId }) {
  const params = useParams();
  const classroomId = propClassroomId || params.classroomId;
  const api = useApi();
  const auth = useAuth();

  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [user, setUser] = useState(null);
  const [onlineCount, setOnlineCount] = useState(0);
  const [typingUsers, setTypingUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  const socketRef = useRef(null);
  const bottomRef = useRef(null);
  const textAreaRef = useRef(null);
  const typingTimers = useRef({});

  // 1. Load initial history and user
  useEffect(() => {
    if (!classroomId) return;
    const load = async () => {
      try {
        const [hRes, uRes] = await Promise.all([
          api.get(`/api/v2/classrooms/${classroomId}/chat?limit=50`),
          api.get('/api/v2/users/me'),
        ]);
        setMessages(hRes.data);
        setUser(uRes.data);
        setHasMore(hRes.data.length >= 50);
      } catch (err) {
        console.error("Failed to load chat history", err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [classroomId]);

  // 2. Connect socket & handle auto-reconnects
  useEffect(() => {
    if (!auth.user?.access_token || !classroomId) return;

    const socket = io(API_URL, {
      auth: { token: auth.user.access_token },
      transports: ['websocket'],
    });
    
    socketRef.current = socket;

    // Always rejoin the room upon connection or reconnection!
    socket.on('connect', () => {
        socket.emit('classroom:join', classroomId);
    });

    // Listen for backend errors so they aren't silent anymore
    socket.on('error', (errMsg) => {
        toast.error(`Chat Error: ${errMsg}`);
    });

    socket.on('chat:message', (msg) => {
      setMessages(prev => [...prev, msg]);
    });

    socket.on('presence:update', (onlineIds) => {
      setOnlineCount(onlineIds.length);
    });

    socket.on('chat:typing', ({ name, isTyping }) => {
      setTypingUsers(prev => {
        if (isTyping && !prev.includes(name)) return [...prev, name];
        if (!isTyping) return prev.filter(n => n !== name);
        return prev;
      });
      clearTimeout(typingTimers.current[name]);
      if (isTyping) {
        typingTimers.current[name] = setTimeout(() => {
          setTypingUsers(prev => prev.filter(n => n !== name));
        }, 2000);
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [auth.user?.access_token, classroomId]);

  // 3. Auto-scroll to bottom
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = useCallback(() => {
    if (!text.trim() || !socketRef.current) return;
    
    // Send to backend
    socketRef.current.emit('chat:send', { classroomId, text });
    socketRef.current.emit('chat:typing', { classroomId, isTyping: false });
    
    // Clear input
    setText('');
  }, [text, classroomId]);

  const handleTyping = (e) => {
    setText(e.target.value);
    if (socketRef.current) {
      socketRef.current.emit('chat:typing', { classroomId, isTyping: true });
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const loadMore = async () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    const oldest = messages[0]?.createdAt;
    try {
      const { data } = await api.get(`/api/v2/classrooms/${classroomId}/chat?limit=50&before=${oldest}`);
      setMessages(prev => [...data, ...prev]);
      setHasMore(data.length >= 50);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingMore(false);
    }
  };

  const getRoleColor = (role) => {
    if (role === 'TEACHER') return 'bg-amber-500';
    if (role === 'ADMIN') return 'bg-red-500';
    return 'bg-blue-500';
  };

  const isOwnMessage = (msg) => msg.senderId === user?.id;

  // Helper to parse URLs into clickable links
  const renderMessageText = (text) => {
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    return text.split(urlRegex).map((part, i) => {
      if (part.match(urlRegex)) {
        
        // 🔥 FIXED: If the link is to our own app, use React Router for a seamless SPA transition!
        if (part.startsWith(window.location.origin)) {
            const internalPath = part.replace(window.location.origin, '');
            return (
                <Link key={i} to={internalPath} className="text-amber-300 font-bold underline hover:text-amber-200 break-all">
                    {part}
                </Link>
            );
        }

        // If it's an external link (like YouTube), open in a new tab normally
        return (
          <a key={i} href={part} target="_blank" rel="noopener noreferrer" className="text-amber-300 font-bold underline hover:text-amber-200 break-all">
            {part}
          </a>
        );
      }
      return part;
    });
  };

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin w-6 h-6 border-2 border-amber-400 border-t-transparent rounded-full" /></div>;

  return (
    <div className="flex flex-col h-full bg-[#162133] rounded-2xl border border-[#1e3a5f] overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-[#1e3a5f] flex items-center justify-between">
        <h3 className="text-white font-semibold">Classroom Chat</h3>
        <span className="text-xs text-slate-400">{onlineCount} online</span>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {hasMore && (
          <button onClick={loadMore} disabled={loadingMore}
            className="w-full text-xs text-slate-500 hover:text-amber-400 transition-colors py-2">
            {loadingMore ? 'Loading…' : '↑ Load older messages'}
          </button>
        )}
        {messages.map((msg, i) => (
          <div key={msg._id || i} className={`flex gap-2 ${isOwnMessage(msg) ? 'flex-row-reverse' : ''} ${msg.type === 'system' ? 'justify-center' : ''}`}>
            {msg.type === 'system' ? (
              <p className="text-slate-500 text-xs italic text-center">{msg.text}</p>
            ) : (
              <>
                <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-white text-xs font-bold ${getRoleColor(msg.senderRole)}`}>
                  {msg.senderName?.charAt(0).toUpperCase()}
                </div>
                <div className={`max-w-[70%] ${isOwnMessage(msg) ? 'items-end' : 'items-start'} flex flex-col`}>
                  <div className="flex items-baseline gap-2 mb-1 flex-row-reverse">
                    <span className="text-xs text-slate-500">{new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    <span className="text-xs font-medium text-slate-300">{isOwnMessage(msg) ? 'You' : msg.senderName}</span>
                  </div>
                  <div className={`px-3 py-2 rounded-2xl text-sm text-white break-words ${
                    isOwnMessage(msg) ? 'bg-amber-500/20 border border-amber-500/30' : 'bg-[#0F1729]'
                  }`}>
                    {/* Render text with active links */}
                    {renderMessageText(msg.text)}
                  </div>
                </div>
              </>
            )}
          </div>
        ))}
        {typingUsers.length > 0 && (
          <p className="text-slate-500 text-xs italic">
            {typingUsers.join(', ')} {typingUsers.length === 1 ? 'is' : 'are'} typing…
          </p>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="px-4 py-3 border-t border-[#1e3a5f] flex gap-2">
        <textarea
          ref={textAreaRef}
          rows={1}
          value={text}
          onChange={handleTyping}
          onKeyDown={handleKeyDown}
          placeholder="Type a message… (Enter to send)"
          className="flex-1 bg-[#0F1729] border border-[#1e3a5f] text-white rounded-xl px-3 py-2 text-sm resize-none focus:outline-none focus:border-amber-500 max-h-24"
        />
        <button
          onClick={sendMessage}
          disabled={!text.trim()}
          className="bg-amber-500 hover:bg-amber-400 text-navy-900 font-bold px-4 rounded-xl disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          ➤
        </button>
      </div>
    </div>
  );
}