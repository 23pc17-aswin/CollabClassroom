import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../lib/api';
import useAuthStore from '../store/authStore';

// ── Colour palette for classroom cards ───────────────────────
const ACCENT_COLORS = [
    '#6366f1', '#8b5cf6', '#ec4899', '#14b8a6', '#f59e0b', '#ef4444',
];

// ── Skeleton Card ─────────────────────────────────────────────
function SkeletonCard() {
    return (
        <div className="glass-card p-5 space-y-3">
            <div className="skeleton h-24 w-full rounded-xl" />
            <div className="skeleton h-4 w-2/3" />
            <div className="skeleton h-3 w-1/2" />
        </div>
    );
}

// ── Classroom Card ────────────────────────────────────────────
function ClassCard({ classroom, role, membershipStatus }) {
    const color = classroom.coverColor || '#6366f1';

    return (
        <Link
            to={membershipStatus === 'ACTIVE' || role !== 'STUDENT' ? `/classrooms/${classroom.id}` : '#'}
            className={`block glass-card overflow-hidden hover:border-brand-500/50 hover:shadow-glow transition-all duration-300 group
        ${membershipStatus === 'PENDING' ? 'opacity-70 cursor-default' : ''}`}
        >
            {/* Cover bar */}
            <div className="h-20 relative" style={{ background: `linear-gradient(135deg, ${color}cc, ${color}44)` }}>
                <div className="absolute inset-0 flex items-end p-4">
                    <div>
                        <p className="font-bold text-white text-base leading-tight line-clamp-1 group-hover:text-brand-200 transition-colors">
                            {classroom.name}
                        </p>
                        {classroom.subject && (
                            <p className="text-white/70 text-xs mt-0.5">{classroom.subject}</p>
                        )}
                    </div>
                </div>
                {membershipStatus === 'PENDING' && (
                    <div className="absolute top-2 right-2 badge bg-amber-500/20 text-amber-300 border border-amber-500/30">
                        ⏳ Pending
                    </div>
                )}
            </div>

            {/* Info */}
            <div className="p-4 space-y-2">
                <div className="flex items-center gap-2 text-muted">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    <span className="text-xs">{classroom.teacher?.name || 'You'}</span>
                </div>
                {classroom._count && (
                    <div className="flex items-center gap-2 text-muted">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        <span className="text-xs">{classroom._count.memberships || 0} students</span>
                    </div>
                )}
                {classroom.classCode && role !== 'STUDENT' && (
                    <div className="mt-2 font-mono text-xs text-brand-400 bg-brand-500/10 rounded-lg px-3 py-1.5 inline-block">
                        {classroom.classCode}
                    </div>
                )}
            </div>
        </Link>
    );
}

// ── Modal: Create Classroom ───────────────────────────────────
function CreateClassroomModal({ onClose, onSuccess }) {
    const [form, setForm] = useState({ name: '', description: '', subject: '', coverColor: ACCENT_COLORS[0] });
    const qc = useQueryClient();

    const mutation = useMutation({
        mutationFn: (data) => api.post('/classrooms', data),
        onSuccess: (data) => {
            qc.invalidateQueries({ queryKey: ['my-classrooms'] });
            toast.success(`"${data.classroom.name}" created! Code: ${data.classroom.classCode}`);
            onSuccess?.();
            onClose();
        },
        onError: (err) => toast.error(err?.response?.data?.message || 'Failed to create classroom.'),
    });

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="glass-card w-full max-w-md p-6 animate-slide-up">
                <h2 className="section-title mb-5">Create Classroom</h2>
                <form
                    onSubmit={(e) => { e.preventDefault(); mutation.mutate(form); }}
                    className="space-y-4"
                >
                    <div>
                        <label className="label">Classroom name *</label>
                        <input className="input-field" placeholder="e.g. Data Structures & Algorithms" required
                            value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                    </div>
                    <div>
                        <label className="label">Subject <span className="text-slate-500">(optional)</span></label>
                        <input className="input-field" placeholder="e.g. Computer Science"
                            value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} />
                    </div>
                    <div>
                        <label className="label">Description <span className="text-slate-500">(optional)</span></label>
                        <textarea className="input-field resize-none" rows={2} placeholder="What is this class about?"
                            value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
                    </div>
                    <div>
                        <label className="label">Cover colour</label>
                        <div className="flex gap-2 flex-wrap mt-1">
                            {ACCENT_COLORS.map((c) => (
                                <button key={c} type="button" onClick={() => setForm({ ...form, coverColor: c })}
                                    className={`w-8 h-8 rounded-full transition-all ${form.coverColor === c ? 'ring-2 ring-white scale-110' : 'opacity-70 hover:opacity-100'}`}
                                    style={{ background: c }} />
                            ))}
                        </div>
                    </div>

                    <div className="flex gap-3 pt-2">
                        <button type="button" onClick={onClose} className="btn-ghost flex-1 justify-center">Cancel</button>
                        <button type="submit" disabled={mutation.isPending} className="btn-primary flex-1 justify-center">
                            {mutation.isPending ? 'Creating…' : 'Create'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

// ── Modal: Join Classroom ─────────────────────────────────────
function JoinClassroomModal({ onClose }) {
    const [classCode, setClassCode] = useState('');
    const qc = useQueryClient();

    const mutation = useMutation({
        mutationFn: (data) => api.post('/classrooms/join', data),
        onSuccess: (data) => {
            qc.invalidateQueries({ queryKey: ['my-classrooms'] });
            toast.success(data.message);
            onClose();
        },
        onError: (err) => toast.error(err?.response?.data?.message || 'Failed to join classroom.'),
    });

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="glass-card w-full max-w-sm p-6 animate-slide-up">
                <h2 className="section-title mb-2">Join Classroom</h2>
                <p className="text-muted mb-5">Ask your teacher for the 8-character class code.</p>
                <form onSubmit={(e) => { e.preventDefault(); mutation.mutate({ classCode }); }} className="space-y-4">
                    <input
                        className="input-field text-center font-mono text-lg tracking-widest uppercase"
                        placeholder="XXXXXXXX"
                        value={classCode}
                        onChange={(e) => setClassCode(e.target.value.toUpperCase())}
                        maxLength={8}
                        required
                    />
                    <div className="flex gap-3">
                        <button type="button" onClick={onClose} className="btn-ghost flex-1 justify-center">Cancel</button>
                        <button type="submit" disabled={mutation.isPending} className="btn-primary flex-1 justify-center">
                            {mutation.isPending ? 'Joining…' : 'Join'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

// ── HomePage ──────────────────────────────────────────────────
export default function HomePage() {
    const { user } = useAuthStore();
    const [showCreate, setShowCreate] = useState(false);
    const [showJoin, setShowJoin] = useState(false);

    const { data, isLoading } = useQuery({
        queryKey: ['my-classrooms'],
        queryFn: () => api.get('/classrooms'),
    });

    const taughtClassrooms = data?.taught || [];
    const joinedMemberships = data?.memberships || [];

    const isTeacher = user?.role === 'TEACHER' || user?.role === 'ADMIN';

    return (
        <div className="max-w-6xl mx-auto space-y-8 animate-fade-in">

            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-black text-white">
                        Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 17 ? 'afternoon' : 'evening'},{' '}
                        <span className="gradient-text">{user?.name?.split(' ')[0]}</span> 👋
                    </h1>
                    <p className="text-muted mt-1">Here's your classroom overview</p>
                </div>
                <div className="flex gap-3">
                    {isTeacher && (
                        <button onClick={() => setShowCreate(true)} className="btn-primary">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                            Create Class
                        </button>
                    )}
                    {user?.role === 'STUDENT' && (
                        <button onClick={() => setShowJoin(true)} className="btn-primary">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                            </svg>
                            Join Class
                        </button>
                    )}
                </div>
            </div>

            {/* My Classes (taught) */}
            {isTeacher && (
                <section>
                    <h2 className="section-title mb-4">My Classes</h2>
                    {isLoading ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {[1, 2, 3].map((i) => <SkeletonCard key={i} />)}
                        </div>
                    ) : taughtClassrooms.length === 0 ? (
                        <div className="glass-card p-12 text-center">
                            <div className="w-16 h-16 rounded-2xl bg-brand-500/15 flex items-center justify-center mx-auto mb-4">
                                <svg className="w-8 h-8 text-brand-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                                </svg>
                            </div>
                            <p className="text-white font-semibold mb-1">No classes yet</p>
                            <p className="text-muted mb-4">Create your first classroom to get started</p>
                            <button onClick={() => setShowCreate(true)} className="btn-primary mx-auto">Create a classroom</button>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {taughtClassrooms.map((c) => (
                                <ClassCard key={c.id} classroom={c} role={user.role} />
                            ))}
                        </div>
                    )}
                </section>
            )}

            {/* Enrolled Classes (student) */}
            {user?.role === 'STUDENT' && (
                <section>
                    <h2 className="section-title mb-4">My Classrooms</h2>
                    {isLoading ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {[1, 2, 3].map((i) => <SkeletonCard key={i} />)}
                        </div>
                    ) : joinedMemberships.length === 0 ? (
                        <div className="glass-card p-12 text-center">
                            <div className="w-16 h-16 rounded-2xl bg-brand-500/15 flex items-center justify-center mx-auto mb-4">
                                <svg className="w-8 h-8 text-brand-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                                </svg>
                            </div>
                            <p className="text-white font-semibold mb-1">Not enrolled yet</p>
                            <p className="text-muted mb-4">Join a classroom with a code from your teacher</p>
                            <button onClick={() => setShowJoin(true)} className="btn-primary mx-auto">Join a classroom</button>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {joinedMemberships.map((m) => (
                                <ClassCard key={m.id} classroom={m.classroom} role={user.role} membershipStatus={m.status} />
                            ))}
                        </div>
                    )}
                </section>
            )}

            {/* Modals */}
            {showCreate && <CreateClassroomModal onClose={() => setShowCreate(false)} />}
            {showJoin && <JoinClassroomModal onClose={() => setShowJoin(false)} />}
        </div>
    );
}
