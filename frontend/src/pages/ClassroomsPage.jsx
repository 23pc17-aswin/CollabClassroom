import { useState, useEffect } from 'react';
import { useApi } from '../hooks/useApi';
import { useNavigate } from 'react-router-dom';
import Modal from '../components/ui/Modal';

export default function ClassroomsPage() {
  const api = useApi();
  const navigate = useNavigate();
  const [classrooms, setClassrooms] = useState([]);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [joinOpen, setJoinOpen] = useState(false);
  const [form, setForm] = useState({ name: '', subject: '', description: '' });
  const [joinCode, setJoinCode] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const [cRes, uRes] = await Promise.all([
          api.get('/api/v2/classrooms'),
          api.get('/api/v2/users/me'),
        ]);
        setClassrooms(cRes.data);
        setUser(uRes.data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      const { data } = await api.post('/api/v2/classrooms', form);
      setClassrooms(prev => [data, ...prev]);
      setCreateOpen(false);
      setForm({ name: '', subject: '', description: '' });
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create classroom');
    } finally {
      setSubmitting(false);
    }
  };

  const handleJoin = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      const { data } = await api.post('/api/v2/classrooms/join', { code: joinCode });
      navigate(`/classrooms/${data.classroomId}`);
    } catch (err) {
      setError(err.response?.data?.error || 'Invalid classroom code');
    } finally {
      setSubmitting(false);
    }
  };

  const isTeacher = user?.role === 'TEACHER';
  const isStudent = user?.role === 'STUDENT';
  const isAdmin = user?.role === 'ADMIN';

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin w-8 h-8 border-2 border-amber-400 border-t-transparent rounded-full" />
    </div>
  );

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">Classrooms</h1>
          <p className="text-slate-400 text-sm mt-1">
            {isAdmin || isTeacher ? 'Manage your classrooms' : 'Your enrolled classrooms'}
          </p>
        </div>
        
        <div className="flex gap-3">
            {/* 🔥 ONLY Teachers can create classrooms */}
            {isTeacher && (
                <button 
                    onClick={() => setCreateOpen(true)} 
                    className="bg-amber-500 hover:bg-amber-400 text-navy-900 font-bold px-4 py-2 rounded-xl transition-colors text-sm flex items-center gap-2 shadow-lg shadow-amber-500/20"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg>
                    Create Classroom
                </button>
            )}

            {/* 🔥 ONLY Students can join via code */}
            {isStudent && (
                <button
                    onClick={() => setJoinOpen(true)}
                    className="bg-amber-500 hover:bg-amber-400 text-navy-900 font-semibold px-4 py-2 rounded-lg transition-colors"
                >
                    Join by Code
                </button>
            )}
        </div>
      </div>

      {/* Grid */}
      {classrooms.length === 0 ? (
        <div className="text-center py-16 text-slate-400">
          <div className="text-5xl mb-4">🏫</div>
          <p className="text-lg">
              {isTeacher ? 'No classrooms yet. Create one!' : isAdmin ? 'No classrooms exist on the platform yet.' : 'Not enrolled in any classroom yet.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {classrooms.map(c => (
            <div
              key={c.id}
              onClick={() => navigate(`/classrooms/${c.id}`)}
              className="bg-[#162133] border border-[#1e3a5f]/50 rounded-2xl p-6 cursor-pointer hover:border-amber-500/50 hover:shadow-lg hover:shadow-amber-500/10 transition-all group"
            >
              <div className="flex items-start justify-between mb-4">
                <span className="text-xs font-semibold bg-amber-500/20 text-amber-400 px-2 py-1 rounded-full">
                  {c.subject}
                </span>
                {c.isArchived && (
                  <span className="text-xs bg-slate-700 text-slate-400 px-2 py-1 rounded-full">Archived</span>
                )}
              </div>
              <h3 className="text-white font-bold text-lg mb-2 group-hover:text-amber-400 transition-colors">{c.name}</h3>
              
              {/* Show Teacher Name with Avatar Fallback */}
              {c.teacher && (
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-5 h-5 rounded-full bg-amber-500/20 flex items-center justify-center text-amber-400 text-[10px] font-bold overflow-hidden">
                      {c.teacher.avatarUrl ? (
                          <img src={c.teacher.avatarUrl} alt="T" className="w-full h-full object-cover" />
                      ) : (
                          c.teacher.name.charAt(0).toUpperCase()
                      )}
                  </div>
                  <p className="text-slate-400 text-sm">{c.teacher.name}</p>
                </div>
              )}

              <div className="flex items-center gap-4 text-slate-500 text-xs mt-4 pt-4 border-t border-slate-700/50">
                <span>👥 {c._count?.enrollments ?? '—'} students</span>
                <span>📋 {c._count?.assignments ?? '—'} assignments</span>
              </div>
              
              {/* Admins and Teachers can see the code */}
              {(isTeacher || isAdmin) && c.code && (
                <div className="mt-3 flex items-center gap-2">
                  <span className="text-slate-500 text-xs">Code:</span>
                  <code
                    className="font-mono text-amber-400 text-xs bg-amber-500/10 px-2 py-0.5 rounded cursor-copy"
                    onClick={e => { e.stopPropagation(); navigator.clipboard.writeText(c.code); }}
                  >
                    {c.code}
                  </code>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Create Classroom Modal */}
      <Modal isOpen={createOpen} onClose={() => { setCreateOpen(false); setError(''); }} title="Create Classroom">
        <form onSubmit={handleCreate} className="space-y-4">
          {error && <p className="text-red-400 text-sm bg-red-500/10 p-3 rounded-lg">{error}</p>}
          <div>
            <label className="block text-slate-400 text-sm mb-1">Classroom Name *</label>
            <input
              className="w-full bg-[#0F1729] border border-[#1e3a5f] text-white rounded-lg px-3 py-2 focus:outline-none focus:border-amber-500"
              value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
              placeholder="e.g. Advanced Mathematics" required
            />
          </div>
          <div>
            <label className="block text-slate-400 text-sm mb-1">Subject *</label>
            <input
              className="w-full bg-[#0F1729] border border-[#1e3a5f] text-white rounded-lg px-3 py-2 focus:outline-none focus:border-amber-500"
              value={form.subject} onChange={e => setForm(p => ({ ...p, subject: e.target.value }))}
              placeholder="e.g. Mathematics" required
            />
          </div>
          <div>
            <label className="block text-slate-400 text-sm mb-1">Description</label>
            <textarea
              className="w-full bg-[#0F1729] border border-[#1e3a5f] text-white rounded-lg px-3 py-2 focus:outline-none focus:border-amber-500 resize-none"
              rows={3} value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
              placeholder="Optional description"
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setCreateOpen(false)} className="px-4 py-2 text-slate-400 hover:text-white transition-colors">Cancel</button>
            <button type="submit" disabled={submitting} className="bg-amber-500 hover:bg-amber-400 text-navy-900 font-semibold px-6 py-2 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed">
              {submitting ? 'Creating…' : 'Create'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Join by Code Modal */}
      <Modal isOpen={joinOpen} onClose={() => { setJoinOpen(false); setError(''); }} title="Join a Classroom">
        <form onSubmit={handleJoin} className="space-y-4">
          {error && <p className="text-red-400 text-sm bg-red-500/10 p-3 rounded-lg">{error}</p>}
          <div>
            <label className="block text-slate-400 text-sm mb-1">Classroom Code</label>
            <input
              className="w-full bg-[#0F1729] border border-[#1e3a5f] text-white rounded-lg px-3 py-2 focus:outline-none focus:border-amber-500 font-mono text-lg tracking-widest text-center uppercase"
              value={joinCode} onChange={e => setJoinCode(e.target.value.toUpperCase())}
              placeholder="XXXXXXXX" maxLength={8} required
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setJoinOpen(false)} className="px-4 py-2 text-slate-400 hover:text-white transition-colors">Cancel</button>
            <button type="submit" disabled={submitting} className="bg-amber-500 hover:bg-amber-400 text-navy-900 font-semibold px-6 py-2 rounded-lg disabled:opacity-50">
              {submitting ? 'Joining…' : 'Join'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}