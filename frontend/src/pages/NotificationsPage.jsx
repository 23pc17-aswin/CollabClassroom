import { useState, useEffect } from 'react';
import { useApi } from '../hooks/useApi';

/**
 * NotificationsPage — full notification list with mark-read.
 */
export default function NotificationsPage() {
  const api = useApi();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/api/v2/users/me/notifications').then(res => {
      setNotifications(res.data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const markAllRead = async () => {
    await api.patch('/api/v2/users/me/notifications/read', {});
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const markRead = async (id) => {
    await api.patch('/api/v2/users/me/notifications/read', { ids: [id] });
    setNotifications(prev => prev.map(n => n._id === id ? { ...n, read: true } : n));
  };

  const typeIcon = (type) => {
    const icons = { assignment: '📋', grade: '🎯', test: '📝', enrollment: '🏫', announcement: '📢' };
    return icons[type] || '🔔';
  };

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin w-8 h-8 border-2 border-amber-400 border-t-transparent rounded-full" /></div>;

  const unread = notifications.filter(n => !n.read).length;

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Notifications</h1>
          {unread > 0 && <p className="text-slate-400 text-sm mt-0.5">{unread} unread</p>}
        </div>
        {unread > 0 && (
          <button onClick={markAllRead} className="text-amber-400 hover:text-amber-300 text-sm transition-colors">
            Mark all read
          </button>
        )}
      </div>

      {!notifications.length ? (
        <div className="text-center py-16 text-slate-400">
          <div className="text-4xl mb-3">🔔</div>
          <p>No notifications yet.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {notifications.map(n => (
            <div
              key={n._id}
              onClick={() => !n.read && markRead(n._id)}
              className={`flex gap-4 p-4 rounded-xl border transition-colors cursor-pointer ${
                n.read
                  ? 'bg-[#162133] border-[#1e3a5f]'
                  : 'bg-amber-500/5 border-amber-500/30 hover:bg-amber-500/10'
              }`}
            >
              <div className="text-2xl flex-shrink-0">{typeIcon(n.type)}</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <p className={`font-medium text-sm ${n.read ? 'text-slate-300' : 'text-white'}`}>{n.title}</p>
                  {!n.read && <div className="w-2 h-2 bg-amber-400 rounded-full flex-shrink-0 mt-1.5" />}
                </div>
                <p className="text-slate-400 text-xs mt-0.5 leading-relaxed">{n.message}</p>
                <p className="text-slate-600 text-xs mt-1.5">{new Date(n.createdAt).toLocaleString()}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
