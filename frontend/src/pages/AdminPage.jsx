import { useState, useEffect } from 'react';
import { useApi } from '../hooks/useApi';
import Modal from '../components/ui/Modal';

/**
 * AdminPage — Admin control panel with Users tab and Stats tab.
 * Replaces old AdminDashboard.jsx.
 */
export default function AdminPage() {
  const api = useApi();
  const [tab, setTab] = useState('users');
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [provisionOpen, setProvisionOpen] = useState(false);
  const [provisionResult, setProvisionResult] = useState(null);
  const [form, setForm] = useState({ name: '', userId: '', email: '', role: 'STUDENT' });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      const [uRes, sRes] = await Promise.all([
        api.get(`/api/v2/admin/users?${roleFilter ? `role=${roleFilter}&` : ''}${search ? `search=${search}` : ''}`),
        api.get('/api/v2/admin/stats'),
      ]);
      setUsers(uRes.data.users);
      setStats(sRes.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, [tab, roleFilter, search]);

  const handleProvision = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      const { data } = await api.post('/api/v2/admin/users', form);
      setProvisionResult(data);
      loadData();
    } catch (err) {
      setError(err.response?.data?.error || 'Provisioning failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeactivate = async (id, name) => {
    if (!window.confirm(`Deactivate ${name}? They will not be able to log in.`)) return;
    try {
      await api.patch(`/api/v2/admin/users/${id}/deactivate`);
      setUsers(prev => prev.map(u => u.id === id ? { ...u, isActive: false } : u));
    } catch (e) {
      alert(e.response?.data?.error || 'Failed to deactivate');
    }
  };

  const roleBadge = (role) => {
    const colors = { ADMIN: 'bg-red-500/20 text-red-400', TEACHER: 'bg-amber-500/20 text-amber-400', STUDENT: 'bg-blue-500/20 text-blue-400' };
    return <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${colors[role] || ''}`}>{role}</span>;
  };

  return (
    <div className="max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold text-white mb-6">Admin Control Panel</h1>

      {/* Tabs */}
      <div className="flex gap-1 bg-[#162133] p-1 rounded-xl mb-6 w-fit">
        {['users', 'stats'].map(t => (
          <button key={t} onClick={() => setTab(t)} className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors capitalize ${tab === t ? 'bg-amber-500 text-navy-900' : 'text-slate-400 hover:text-white'}`}>
            {t}
          </button>
        ))}
      </div>

      {/* Users Tab */}
      {tab === 'users' && (
        <div>
          <div className="flex flex-wrap items-center gap-3 mb-6">
            <input
              className="bg-[#162133] border border-[#1e3a5f] text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-amber-500 w-56"
              placeholder="Search name / email / roll…"
              value={search} onChange={e => setSearch(e.target.value)}
            />
            <select
              className="bg-[#162133] border border-[#1e3a5f] text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-amber-500"
              value={roleFilter} onChange={e => setRoleFilter(e.target.value)}
            >
              <option value="">All Roles</option>
              <option>STUDENT</option>
              <option>TEACHER</option>
              <option>ADMIN</option>
            </select>
            <button onClick={() => { setProvisionOpen(true); setProvisionResult(null); setError(''); }}
              className="ml-auto bg-amber-500 hover:bg-amber-400 text-navy-900 font-semibold px-4 py-2 rounded-lg text-sm">
              + Provision User
            </button>
          </div>

          {loading ? (
            <div className="flex items-center justify-center h-40"><div className="animate-spin w-7 h-7 border-2 border-amber-400 border-t-transparent rounded-full" /></div>
          ) : (
            <div className="bg-[#162133] border border-[#1e3a5f] rounded-2xl overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-slate-400 border-b border-slate-700 text-xs uppercase tracking-wide">
                    <th className="text-left px-4 py-3">Name</th>
                    <th className="text-left px-4 py-3">Roll / ID</th>
                    <th className="text-left px-4 py-3">Email</th>
                    <th className="text-left px-4 py-3">Role</th>
                    <th className="text-left px-4 py-3">Status</th>
                    <th className="text-left px-4 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {users.map(u => (
                    <tr key={u.id} className="text-white hover:bg-white/5">
                      <td className="px-4 py-3 font-medium">{u.name}</td>
                      <td className="px-4 py-3 text-slate-400 font-mono text-xs">{u.userId}</td>
                      <td className="px-4 py-3 text-slate-400 text-xs">{u.email}</td>
                      <td className="px-4 py-3">{roleBadge(u.role)}</td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-0.5 rounded-full ${u.isActive ? 'bg-green-500/20 text-green-400' : 'bg-slate-700 text-slate-400'}`}>
                          {u.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {u.isActive && u.role !== 'ADMIN' && (
                          <button onClick={() => handleDeactivate(u.id, u.name)}
                            className="text-xs text-red-400 hover:text-red-300 hover:underline">
                            Deactivate
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {!users.length && <p className="text-slate-500 text-sm text-center py-8">No users found.</p>}
            </div>
          )}
        </div>
      )}

      {/* Stats Tab */}
      {tab === 'stats' && stats && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Total Users', val: stats.totalUsers, icon: '👥' },
              { label: 'Classrooms', val: stats.totalClassrooms, icon: '🏫' },
              { label: 'Assignments', val: stats.totalAssignments, icon: '📋' },
              { label: 'Pending Grading', val: stats.pendingGrading, icon: '⏳' },
            ].map(s => (
              <div key={s.label} className="bg-[#162133] border border-[#1e3a5f] rounded-2xl p-5 text-center">
                <div className="text-3xl mb-2">{s.icon}</div>
                <p className="text-amber-400 text-3xl font-black">{s.val}</p>
                <p className="text-slate-400 text-sm mt-1">{s.label}</p>
              </div>
            ))}
          </div>

          <div className="bg-[#162133] border border-[#1e3a5f] rounded-2xl p-6">
            <h3 className="text-white font-semibold mb-4">Users by Role</h3>
            <div className="space-y-3">
              {Object.entries(stats.usersByRole || {}).map(([role, count]) => {
                const pct = Math.round((count / stats.totalUsers) * 100);
                const colors = { ADMIN: 'bg-red-500', TEACHER: 'bg-amber-500', STUDENT: 'bg-blue-500' };
                return (
                  <div key={role}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-white">{role}</span>
                      <span className="text-slate-400">{count} ({pct}%)</span>
                    </div>
                    <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${colors[role] || 'bg-slate-500'}`} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Provision User Modal */}
      <Modal isOpen={provisionOpen} onClose={() => { setProvisionOpen(false); setProvisionResult(null); }} title="Provision New User">
        {provisionResult ? (
          <div className="space-y-4">
            <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-4">
              <p className="text-green-400 font-semibold mb-1">User provisioned successfully!</p>
              <p className="text-slate-300 text-sm">{provisionResult.user?.name} ({provisionResult.user?.role})</p>
            </div>
            <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4">
              <p className="text-slate-400 text-xs mb-1">Temporary Password (share securely):</p>
              <div className="flex items-center gap-2">
                <code className="text-amber-400 font-mono text-sm flex-1">{provisionResult.temporaryPassword}</code>
                <button onClick={() => navigator.clipboard.writeText(provisionResult.temporaryPassword)}
                  className="text-xs text-slate-400 hover:text-white border border-slate-600 px-2 py-1 rounded">
                  Copy
                </button>
              </div>
            </div>
            <button onClick={() => { setProvisionOpen(false); setProvisionResult(null); setForm({ name: '', userId: '', email: '', role: 'STUDENT' }); }}
              className="w-full bg-amber-500 hover:bg-amber-400 text-navy-900 font-semibold py-2 rounded-lg">
              Done
            </button>
          </div>
        ) : (
          <form onSubmit={handleProvision} className="space-y-4">
            {error && <p className="text-red-400 text-sm bg-red-500/10 p-3 rounded-lg">{error}</p>}
            {[
              { label: 'Full Name', key: 'name', placeholder: 'e.g. Jane Doe' },
              { label: 'Roll Number / Employee ID', key: 'userId', placeholder: 'e.g. CS2021017' },
              { label: 'College Email', key: 'email', placeholder: 'e.g. jane@college.edu', type: 'email' },
            ].map(f => (
              <div key={f.key}>
                <label className="block text-slate-400 text-sm mb-1">{f.label} *</label>
                <input type={f.type || 'text'}
                  className="w-full bg-[#0F1729] border border-[#1e3a5f] text-white rounded-lg px-3 py-2 focus:outline-none focus:border-amber-500"
                  value={form[f.key]} onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                  placeholder={f.placeholder} required
                />
              </div>
            ))}
            <div>
              <label className="block text-slate-400 text-sm mb-1">Role *</label>
              <select className="w-full bg-[#0F1729] border border-[#1e3a5f] text-white rounded-lg px-3 py-2 focus:outline-none focus:border-amber-500"
                value={form.role} onChange={e => setForm(p => ({ ...p, role: e.target.value }))}>
                <option>STUDENT</option>
                <option>TEACHER</option>
              </select>
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button type="button" onClick={() => setProvisionOpen(false)} className="px-4 py-2 text-slate-400 hover:text-white">Cancel</button>
              <button type="submit" disabled={submitting} className="bg-amber-500 hover:bg-amber-400 text-navy-900 font-semibold px-6 py-2 rounded-lg disabled:opacity-50">
                {submitting ? 'Provisioning…' : 'Provision'}
              </button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}
