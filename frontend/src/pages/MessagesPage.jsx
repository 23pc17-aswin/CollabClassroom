import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from 'react-oidc-context';
import { useApi } from '../hooks/useApi';
import { io } from 'socket.io-client';
import toast from 'react-hot-toast';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export default function MessagesPage() {
  const auth = useAuth();
  const api = useApi();
  
  const [user, setUser] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [recentChats, setRecentChats] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [loadingChat, setLoadingChat] = useState(false);

  const socketRef = useRef(null);
  const bottomRef = useRef(null);
  const selectedUserRef = useRef(null);

  useEffect(() => {
    api.get('/api/v2/users/me').then(res => setUser(res.data)).catch(console.error);
    fetchRecentChats();
  }, []);

  const fetchRecentChats = async () => {
    try {
      const { data } = await api.get('/api/v2/users/me/conversations');
      setRecentChats(data);
    } catch (err) {
      console.error("Failed to load recent chats", err);
    }
  };

  useEffect(() => {
    if (!auth.user?.access_token || !user) return;

    const socket = io(API_URL, {
      auth: { token: auth.user.access_token },
      transports: ['websocket'],
    });
    
    socketRef.current = socket;

    socket.on('dm:message', (msg) => {
      fetchRecentChats();

      const activeChatId = selectedUserRef.current?.id;
      
      if (activeChatId && (msg.senderId === activeChatId || msg.receiverId === activeChatId)) {
        setMessages(prev => {
            // Prevent duplicate messages if the socket fires twice
            if (prev.some(m => m._id === msg._id)) return prev;
            return [...prev, msg];
        });
      } else if (msg.senderId !== user.id) {
        // 🔥 FIXED: A clean, guaranteed-to-work notification!
        toast(`New message from ${msg.senderName}`, {
            icon: '💬',
            style: {
                borderRadius: '10px',
                background: '#162133',
                color: '#fff',
                border: '1px solid #f59e0b'
            },
        });
      }
    });

    socket.on('error', (errMsg) => toast.error(errMsg));

    return () => socket.disconnect();
  }, [auth.user?.access_token, user]);

  useEffect(() => {
    selectedUserRef.current = selectedUser;
  }, [selectedUser]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (searchQuery.length >= 2) {
        try {
          const { data } = await api.get(`/api/v2/users/search?q=${searchQuery}`);
          setSearchResults(data);
        } catch (err) {
          console.error("Search failed", err);
        }
      } else {
        setSearchResults([]);
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  const handleSelectUser = async (targetUser) => {
    setSelectedUser(targetUser);
    setSearchQuery('');
    setSearchResults([]);
    setLoadingChat(true);
    
    try {
      const { data } = await api.get(`/api/v2/users/${targetUser.id}/messages`);
      setMessages(data);
    } catch (err) {
      toast.error("Failed to load chat history");
    } finally {
      setLoadingChat(false);
    }
  };

  const sendMessage = useCallback(() => {
    if (!inputText.trim() || !socketRef.current || !selectedUser) return;
    
    socketRef.current.emit('dm:send', { 
        receiverId: selectedUser.id, 
        text: inputText 
    });
    
    setInputText('');
  }, [inputText, selectedUser]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const isOwnMessage = (msg) => msg.senderId === user?.id;

  const renderMessageText = (text) => {
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    return text.split(urlRegex).map((part, i) => {
      if (part.match(urlRegex)) {
        return <a key={i} href={part} target="_blank" rel="noopener noreferrer" className="text-amber-300 font-bold underline hover:text-amber-200 break-all">{part}</a>;
      }
      return part;
    });
  };

  return (
    <div className="flex h-[calc(100vh-6rem)] gap-4 p-4">
      
      {/* LEFT SIDEBAR */}
      <div className="w-80 bg-[#162133] rounded-2xl border border-[#1e3a5f] flex flex-col overflow-hidden shadow-lg">
        <div className="p-4 bg-[#0F1729] sticky top-0 z-10 border-b border-[#1e3a5f]">
            <div className="relative group">
                <input 
                    type="text" 
                    placeholder="Search people..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-[#162133] border border-[#1e3a5f] text-white rounded-full pl-10 pr-4 py-2 text-sm transition-all focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/50 group-hover:border-slate-500"
                />
                <span className="absolute left-3.5 top-2.5 text-slate-400 group-focus-within:text-amber-500 transition-colors">🔍</span>
                {searchQuery && (
                    <button onClick={() => setSearchQuery('')} className="absolute right-3.5 top-2.5 text-slate-400 hover:text-white">✕</button>
                )}
            </div>
        </div>
        
        <div className="flex-1 overflow-y-auto p-2">
            {searchQuery.length > 0 ? (
                <>
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wider px-2 mb-2 mt-2">Search Results</p>
                    {searchResults.length === 0 && <p className="text-slate-500 text-sm px-2">No users found.</p>}
                    {searchResults.map(u => (
                        <button key={u.id} onClick={() => handleSelectUser(u)} className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-[#1e3a5f]/50 transition-colors text-left">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold ${u.role === 'TEACHER' ? 'bg-amber-500' : 'bg-blue-500'}`}>
                                {u.name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                                <p className="text-white font-medium text-sm">{u.name}</p>
                                <p className="text-slate-400 text-xs">{u.role}</p>
                            </div>
                        </button>
                    ))}
                </>
            ) : (
                <>
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wider px-2 mb-2 mt-2">Recent Chats</p>
                    {recentChats.length === 0 ? (
                        <div className="text-center mt-10 px-4">
                            <div className="text-4xl mb-3 opacity-50">👻</div>
                            <p className="text-slate-500 text-sm">It's quiet here. Search for someone above to start a chat!</p>
                        </div>
                    ) : (
                        recentChats.map(chat => (
                            <button key={chat.user.id} onClick={() => handleSelectUser(chat.user)} 
                                className={`w-full flex items-center gap-3 p-3 rounded-xl transition-colors text-left mb-1 ${selectedUser?.id === chat.user.id ? 'bg-[#1e3a5f]' : 'hover:bg-[#1e3a5f]/50'}`}>
                                <div className={`w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center text-white font-bold ${chat.user.role === 'TEACHER' ? 'bg-amber-500' : 'bg-blue-500'}`}>
                                    {chat.user.name.charAt(0).toUpperCase()}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex justify-between items-baseline mb-0.5">
                                        <p className="text-white font-medium text-sm truncate">{chat.user.name}</p>
                                        <p className="text-[10px] text-slate-500 flex-shrink-0 ml-2">
                                            {new Date(chat.lastMessage.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                                        </p>
                                    </div>
                                    <p className={`text-xs truncate ${chat.lastMessage.senderId !== user?.id && !chat.lastMessage.read ? 'text-white font-semibold' : 'text-slate-400'}`}>
                                        {chat.lastMessage.senderId === user?.id ? 'You: ' : ''}{chat.lastMessage.text}
                                    </p>
                                </div>
                            </button>
                        ))
                    )}
                </>
            )}
        </div>
      </div>

      {/* RIGHT SIDE: Chat Window */}
      <div className="flex-1 bg-[#162133] rounded-2xl border border-[#1e3a5f] flex flex-col overflow-hidden shadow-lg">
        {selectedUser ? (
            <>
                <div className="p-4 border-b border-[#1e3a5f] flex items-center gap-3 bg-[#0F1729] shadow-sm z-10">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold ${selectedUser.role === 'TEACHER' ? 'bg-amber-500' : 'bg-blue-500'}`}>
                        {selectedUser.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                        <h3 className="text-white font-bold">{selectedUser.name}</h3>
                        <p className="text-slate-400 text-xs">{selectedUser.email}</p>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-[#0F1729]/30">
                    {loadingChat ? (
                        <div className="flex justify-center items-center h-full">
                            <div className="animate-spin w-6 h-6 border-2 border-amber-400 border-t-transparent rounded-full" />
                        </div>
                    ) : messages.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-slate-500">
                            <p>This is the beginning of your direct message history with {selectedUser.name}.</p>
                        </div>
                    ) : (
                        messages.map((msg, i) => (
                            <div key={msg._id || i} className={`flex gap-2 ${isOwnMessage(msg) ? 'flex-row-reverse' : ''}`}>
                                <div className={`max-w-[70%] flex flex-col ${isOwnMessage(msg) ? 'items-end' : 'items-start'}`}>
                                    <div className={`px-4 py-2.5 rounded-2xl text-sm text-white shadow-sm ${
                                        isOwnMessage(msg) 
                                            ? 'bg-amber-500/20 border border-amber-500/30 rounded-tr-sm' 
                                            : 'bg-[#1e3a5f] rounded-tl-sm'
                                    }`}>
                                        {renderMessageText(msg.text)}
                                    </div>
                                    <span className="text-[10px] text-slate-500 mt-1 px-1">
                                        {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                </div>
                            </div>
                        ))
                    )}
                    <div ref={bottomRef} />
                </div>

                <div className="p-4 border-t border-[#1e3a5f] bg-[#0F1729]">
                    <div className="flex gap-2">
                        <textarea
                            rows={1}
                            value={inputText}
                            onChange={(e) => setInputText(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder={`Message @${selectedUser.name}...`}
                            className="flex-1 bg-[#162133] border border-[#1e3a5f] text-white rounded-xl px-4 py-3 text-sm resize-none focus:outline-none focus:border-amber-500 max-h-32 transition-colors"
                        />
                        <button
                            onClick={sendMessage}
                            disabled={!inputText.trim()}
                            className="bg-amber-500 hover:bg-amber-400 text-navy-900 font-bold px-6 rounded-xl disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-lg shadow-amber-500/20"
                        >
                            Send
                        </button>
                    </div>
                </div>
            </>
        ) : (
            <div className="flex flex-col items-center justify-center h-full text-slate-500 bg-[#0F1729]/30">
                <svg className="w-20 h-20 mb-4 opacity-20" fill="currentColor" viewBox="0 0 20 20"><path d="M2 5a2 2 0 012-2h7a2 2 0 012 2v4a2 2 0 01-2 2H9l-3 3v-3H4a2 2 0 01-2-2V5z"></path><path d="M15 7v2a4 4 0 01-4 4H9.828l-1.766 1.767c.28.149.599.233.938.233h2l3 3v-3h2a2 2 0 002-2V9a2 2 0 00-2-2h-1z"></path></svg>
                <h2 className="text-xl font-bold text-slate-400 mb-2">Your Messages</h2>
                <p className="text-sm">Select a chat from the sidebar to start talking.</p>
            </div>
        )}
      </div>
    </div>
  );
}