import { useQuery } from '@tanstack/react-query';
import { useApi } from '../hooks/useApi';

const ROLE_COLORS = {
    ADMIN: 'bg-red-500/20 text-red-300',
    TEACHER: 'bg-amber-500/20 text-amber-300',
    STUDENT: 'bg-blue-500/20 text-blue-300',
};

export default function AdminDashboard() {
    const api = useApi();
    
    const { data, isLoading } = useQuery({
        queryKey: ['all-users'],
        queryFn: () => api.get('/api/v2/users').then(res => res.data),
    });

    const users = data?.users || [];

    return (
        <div className="max-w-5xl mx-auto">
            <div className="mb-6">
                <h1 className="section-title">Admin Dashboard</h1>
                <p className="text-muted mt-1">
                    {users.length} total user{users.length !== 1 ? 's' : ''} registered
                </p>
            </div>

            <div className="glass-card overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-white/8">
                                <th className="text-left px-5 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">User</th>
                                <th className="text-left px-5 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Email</th>
                                <th className="text-left px-5 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Role</th>
                                <th className="text-left px-5 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Joined</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {isLoading && [1, 2, 3, 4, 5].map((i) => (
                                <tr key={i}>
                                    <td colSpan={4} className="px-5 py-3"><div className="skeleton h-5 w-full" /></td>
                                </tr>
                            ))}
                            {!isLoading && users.map((u) => (
                                <tr key={u.id} className="hover:bg-white/4 transition-colors">
                                    <td className="px-5 py-3">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-amber-400/20 flex items-center justify-center text-xs font-bold text-amber-400 flex-shrink-0">
                                                {u.name?.charAt(0).toUpperCase()}
                                            </div>
                                            <span className="text-white text-sm font-medium">{u.name}</span>
                                        </div>
                                    </td>
                                    <td className="px-5 py-3 text-muted text-sm">{u.email}</td>
                                    <td className="px-5 py-3">
                                        <span className={`badge ${ROLE_COLORS[u.role] || ''}`}>{u.role.toLowerCase()}</span>
                                    </td>
                                    <td className="px-5 py-3 text-muted text-sm">
                                        {new Date(u.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}