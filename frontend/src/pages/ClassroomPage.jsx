import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { useApi } from '../hooks/useApi';

import ChatPage from './ChatPage';
import MaterialsPage from './MaterialsPage';

const TABS = ['Assignments', 'Tests', 'Materials', 'Chat', 'Members', 'Workspace', 'Pending'];

function AssignmentCard({ assignment, isTeacher, classroomId }) {
    const isOverdue = new Date() > new Date(assignment.dueDate) && !assignment.mySubmission;
    const isDue = !isOverdue && new Date(assignment.dueDate) - Date.now() < 48 * 3600 * 1000;

    return (
        <Link to={`/classrooms/${classroomId}/assignments/${assignment.id}`} className="block">
            <div className="glass-card p-5 flex items-start gap-4 hover:border-amber-500/40 transition-all">
                <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <svg className="w-5 h-5 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                </div>
                <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                        <p className="font-semibold text-white text-sm">{assignment.title}</p>
                        <div className="flex gap-1.5 flex-shrink-0">
                            {isOverdue && <span className="bg-red-500/20 text-red-400 px-2 py-0.5 rounded-full text-xs font-bold">Overdue</span>}
                            {isDue && <span className="bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded-full text-xs font-bold">Due soon</span>}
                            {assignment.mySubmission && <span className="bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full text-xs font-bold">✓ Submitted</span>}
                        </div>
                    </div>
                    {assignment.description && (
                        <p className="text-slate-400 text-xs mt-1 line-clamp-2">{assignment.description}</p>
                    )}
                    <div className="flex items-center gap-4 mt-2">
                        <span className="text-slate-400 text-xs">
                            Due: {new Date(assignment.dueDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </span>
                        <span className="text-slate-400 text-xs">{assignment.totalMarks} marks</span>
                        {isTeacher && <span className="text-slate-400 text-xs">{assignment._count?.submissions || 0} submissions</span>}
                    </div>
                </div>
            </div>
        </Link>
    );
}

function TestCard({ test, classroomId }) {
    const scheduledAt = new Date(test.scheduledAt);
    return (
        <Link to={`/classrooms/${classroomId}/tests/${test.id}`} className="block">
            <div className="glass-card p-5 flex items-start gap-4 hover:border-amber-500/40 transition-all">
                <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                    </svg>
                </div>
                <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                        <p className="font-semibold text-white text-sm">{test.title}</p>
                        <div className="flex gap-1.5 flex-shrink-0">
                            {test.isPublished 
                                ? <span className="bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full text-xs font-bold">Published</span>
                                : <span className="bg-slate-700 text-slate-300 px-2 py-0.5 rounded-full text-xs font-bold">Draft</span>}
                        </div>
                    </div>
                    <div className="flex items-center gap-4 mt-2">
                        <span className="text-slate-400 text-xs">
                            Scheduled: {scheduledAt.toLocaleDateString()} {scheduledAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        <span className="text-slate-400 text-xs">{test.duration} mins</span>
                        <span className="text-slate-400 text-xs">{test.totalMarks} marks</span>
                    </div>
                </div>
            </div>
        </Link>
    );
}

function CreateAssignmentModal({ classroomId, onClose }) {
    const qc = useQueryClient();
    const api = useApi();
    const [form, setForm] = useState({ title: '', description: '', dueDate: '', totalMarks: 100 });

    const mutation = useMutation({
        mutationFn: (data) => api.post(`/api/v2/classrooms/${classroomId}/assignments`, data).then(res => res.data),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['assignments', classroomId] });
            toast.success('Assignment created!');
            onClose();
        },
        onError: (err) => toast.error(err?.response?.data?.message || 'Failed.'),
    });

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="glass-card w-full max-w-md p-6">
                <h2 className="text-xl font-bold text-white mb-5">New Assignment</h2>
                <form onSubmit={(e) => { e.preventDefault(); mutation.mutate(form); }} className="space-y-4">
                    <div>
                        <label className="block text-slate-400 text-xs mb-1">Title *</label>
                        <input className="w-full bg-[#0F1729] border border-[#1e3a5f] text-white rounded px-3 py-2 text-sm focus:outline-none focus:border-amber-500" required value={form.title}
                            onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Assignment title" />
                    </div>
                    <div>
                        <label className="block text-slate-400 text-xs mb-1">Description</label>
                        <textarea className="w-full bg-[#0F1729] border border-[#1e3a5f] text-white rounded px-3 py-2 text-sm focus:outline-none focus:border-amber-500 resize-none" rows={3} value={form.description}
                            onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Instructions…" />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-slate-400 text-xs mb-1">Due date *</label>
                            <input type="datetime-local" className="w-full bg-[#0F1729] border border-[#1e3a5f] text-white rounded px-3 py-2 text-sm" required value={form.dueDate}
                                onChange={(e) => setForm({ ...form, dueDate: e.target.value })} />
                        </div>
                        <div>
                            <label className="block text-slate-400 text-xs mb-1">Total marks</label>
                            <input type="number" className="w-full bg-[#0F1729] border border-[#1e3a5f] text-white rounded px-3 py-2 text-sm" min={1} value={form.totalMarks}
                                onChange={(e) => setForm({ ...form, totalMarks: +e.target.value })} />
                        </div>
                    </div>
                    <div className="flex gap-3 pt-2">
                        <button type="button" onClick={onClose} className="flex-1 text-slate-400 py-2 hover:text-white transition-colors">Cancel</button>
                        <button type="submit" disabled={mutation.isPending} className="flex-1 bg-amber-500 text-navy-900 font-bold py-2 rounded-lg hover:bg-amber-400 transition-colors">
                            {mutation.isPending ? 'Creating…' : 'Create'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

function CreateTestModal({ classroomId, onClose }) {
    const qc = useQueryClient();
    const api = useApi();
    const [form, setForm] = useState({ title: '', description: '', scheduledAt: '', duration: 60, totalMarks: 100 });

    const mutation = useMutation({
        mutationFn: (data) => {
            const payload = {
                ...data,
                questions: [
                    {
                        questionText: "Sample Question 1",
                        options: ["Option A", "Option B", "Option C", "Option D"],
                        correctAnswer: "Option A",
                        marks: data.totalMarks
                    }
                ]
            };
            return api.post(`/api/v2/classrooms/${classroomId}/tests`, payload).then(res => res.data);
        },
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['classroom', classroomId] });
            toast.success('Test created as a Draft!');
            onClose();
        },
        onError: (err) => toast.error(err?.response?.data?.message || 'Failed.'),
    });

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="glass-card w-full max-w-md p-6">
                <h2 className="text-xl font-bold text-white mb-5">Create New Test</h2>
                <form onSubmit={(e) => { e.preventDefault(); mutation.mutate(form); }} className="space-y-4">
                    <div>
                        <label className="block text-slate-400 text-xs mb-1">Title *</label>
                        <input className="w-full bg-[#0F1729] border border-[#1e3a5f] text-white rounded px-3 py-2 text-sm focus:outline-none focus:border-amber-500" required value={form.title}
                            onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Test Title" />
                    </div>
                    <div>
                        <label className="block text-slate-400 text-xs mb-1">Description</label>
                        <textarea className="w-full bg-[#0F1729] border border-[#1e3a5f] text-white rounded px-3 py-2 text-sm focus:outline-none focus:border-amber-500 resize-none" rows={2} value={form.description}
                            onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Test details..." />
                    </div>
                    <div>
                        <label className="block text-slate-400 text-xs mb-1">Scheduled Date & Time *</label>
                        <input type="datetime-local" className="w-full bg-[#0F1729] border border-[#1e3a5f] text-white rounded px-3 py-2 text-sm" required value={form.scheduledAt}
                            onChange={(e) => setForm({ ...form, scheduledAt: e.target.value })} />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-slate-400 text-xs mb-1">Duration (mins) *</label>
                            <input type="number" className="w-full bg-[#0F1729] border border-[#1e3a5f] text-white rounded px-3 py-2 text-sm" min={1} required value={form.duration}
                                onChange={(e) => setForm({ ...form, duration: +e.target.value })} />
                        </div>
                        <div>
                            <label className="block text-slate-400 text-xs mb-1">Total Marks *</label>
                            <input type="number" className="w-full bg-[#0F1729] border border-[#1e3a5f] text-white rounded px-3 py-2 text-sm" min={1} required value={form.totalMarks}
                                onChange={(e) => setForm({ ...form, totalMarks: +e.target.value })} />
                        </div>
                    </div>
                    <div className="flex gap-3 pt-2">
                        <button type="button" onClick={onClose} className="flex-1 text-slate-400 py-2 hover:text-white transition-colors">Cancel</button>
                        <button type="submit" disabled={mutation.isPending} className="flex-1 bg-amber-500 text-navy-900 font-bold py-2 rounded-lg hover:bg-amber-400 transition-colors">
                            {mutation.isPending ? 'Creating…' : 'Create'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default function ClassroomPage() {
    const { classroomId } = useParams();
    const api = useApi();
    const qc = useQueryClient();
    
    const [tab, setTab] = useState('Assignments');
    const [showCreateAssign, setShowCreateAssign] = useState(false);
    const [showCreateTest, setShowCreateTest] = useState(false);

    const { data: dbUser } = useQuery({
        queryKey: ['me'],
        queryFn: () => api.get('/api/v2/users/me').then(res => res.data),
    });

    const role = dbUser?.role || 'STUDENT';
    const isTeacher = role === 'TEACHER' || role === 'ADMIN';

    const { data: classroomData, isLoading: classLoading } = useQuery({
        queryKey: ['classroom', classroomId],
        queryFn: () => api.get(`/api/v2/classrooms/${classroomId}`).then(res => res.data),
    });

    const { data: assignData, isLoading: assignLoading } = useQuery({
        queryKey: ['assignments', classroomId],
        queryFn: () => api.get(`/api/v2/classrooms/${classroomId}/assignments`).then(res => res.data),
        enabled: tab === 'Assignments',
    });

    const { data: pendingData } = useQuery({
        queryKey: ['pending', classroomId],
        queryFn: () => api.get(`/api/v2/classrooms/${classroomId}/pending`).then(res => res.data),
        enabled: tab === 'Pending' && isTeacher,
    });

    const approveMutation = useMutation({
        mutationFn: ({ userId, action }) => api.post(`/api/v2/classrooms/${classroomId}/members/approval`, { userId, action }).then(res => res.data),
        onSuccess: () => { qc.invalidateQueries({ queryKey: ['pending', classroomId] }); toast.success('Done!'); },
        onError: (err) => toast.error(err?.response?.data?.message || 'Action failed.'),
    });

    const classroom = classroomData?.classroom || classroomData;

    if (classLoading) {
        return (
            <div className="max-w-4xl mx-auto space-y-4">
                <div className="skeleton h-10 w-1/3" />
                <div className="skeleton h-6 w-1/4" />
                <div className="skeleton h-48 w-full rounded-2xl mt-4" />
            </div>
        );
    }

    if (!classroom) {
        return (
            <div className="text-center py-20">
                <p className="text-slate-400">Classroom not found or you don't have access.</p>
                <Link to="/" className="text-amber-400 hover:underline mt-4 inline-flex">← Back to Dashboard</Link>
            </div>
        );
    }

    const visibleTabs = isTeacher ? TABS : TABS.filter((t) => t !== 'Pending');

    return (
        <div className="max-w-5xl mx-auto">
            {/* Header */}
            <div
                className="rounded-2xl p-6 mb-6 relative overflow-hidden"
                style={{ background: `linear-gradient(135deg, ${classroom.coverColor || '#6366f1'}99, ${classroom.coverColor || '#6366f1'}22)` }}
            >
                <div className="relative z-10">
                    <Link to="/" className="text-white/60 hover:text-white text-sm transition-colors">← Dashboard</Link>
                    <h1 className="text-2xl font-black text-white mt-2">{classroom.name}</h1>
                    {classroom.subject && <p className="text-white/70 text-sm mt-0.5">{classroom.subject}</p>}
                    <div className="flex items-center gap-4 mt-3">
                        <span className="text-white/60 text-sm">Taught by: {classroom.teacher?.name}</span>
                        {isTeacher && (
                            <span className="font-mono text-sm bg-black/30 text-white/80 px-3 py-1 rounded-lg">
                                Code: {classroom.classCode || classroom.code}
                            </span>
                        )}
                    </div>
                </div>
            </div>

            {/* Tabs Navigation */}
            <div className="flex gap-1 bg-[#162133] rounded-xl p-1 mb-6 flex-wrap w-full md:w-fit">
                {visibleTabs.map((t) => (
                    <button key={t} onClick={() => setTab(t)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all
              ${tab === t ? 'bg-amber-500 text-navy-900 shadow-lg' : 'text-slate-400 hover:text-white'}`}>
                        {t}
                        {t === 'Pending' && pendingData?.pending?.length > 0 && (
                            <span className="ml-1.5 bg-red-500/20 text-red-400 text-xs px-2 py-0.5 rounded-full font-bold">
                                {pendingData.pending.length}
                            </span>
                        )}
                    </button>
                ))}

                {/* Contextual Action Buttons */}
                {isTeacher && tab === 'Assignments' && (
                    <button onClick={() => setShowCreateAssign(true)} className="bg-amber-500/20 text-amber-400 hover:bg-amber-500/30 transition-colors ml-auto md:ml-2 py-1.5 px-3 text-sm rounded-lg font-bold">
                        + Add Assignment
                    </button>
                )}
                {isTeacher && tab === 'Tests' && (
                    <button onClick={() => setShowCreateTest(true)} className="bg-purple-500/20 text-purple-400 hover:bg-purple-500/30 transition-colors ml-auto md:ml-2 py-1.5 px-3 text-sm rounded-lg font-bold">
                        + Add Test
                    </button>
                )}
            </div>

            {/* Tab Content Rendering */}
            <div className="animate-fade-in">
                
                {/* 1. Assignments Tab */}
                {tab === 'Assignments' && (
                    <div className="space-y-3">
                        {assignLoading && [1, 2].map((i) => <div key={i} className="skeleton h-24 rounded-2xl" />)}
                        {!assignLoading && (assignData || []).length === 0 && (
                            <div className="glass-card p-10 text-center">
                                <p className="text-slate-400 mb-4">No assignments yet.</p>
                                {isTeacher && <button onClick={() => setShowCreateAssign(true)} className="bg-amber-500 text-navy-900 font-bold px-4 py-2 rounded-lg mx-auto">Create first assignment</button>}
                            </div>
                        )}
                        {(assignData || []).map((a) => (
                            <AssignmentCard key={a.id} assignment={a} isTeacher={isTeacher} classroomId={classroomId} />
                        ))}
                    </div>
                )}

                {/* 2. Tests Tab */}
                {tab === 'Tests' && (
                    <div className="space-y-3">
                        {(classroom.tests || []).length === 0 && (
                            <div className="glass-card p-10 text-center">
                                <p className="text-slate-400 mb-4">No tests have been created yet.</p>
                                {isTeacher && <button onClick={() => setShowCreateTest(true)} className="bg-purple-500 text-white font-bold px-4 py-2 rounded-lg mx-auto">Create first test</button>}
                            </div>
                        )}
                        {(classroom.tests || []).map((t) => (
                            <TestCard key={t.id} test={t} classroomId={classroomId} />
                        ))}
                    </div>
                )}

                {/* 3. Materials Tab */}
                {tab === 'Materials' && (
                    <div className="glass-card p-6">
                        <MaterialsPage classroomId={classroomId} />
                    </div>
                )}

                {/* 4. Chat Tab */}
                {tab === 'Chat' && (
                    <div className="h-[600px]">
                        <ChatPage classroomId={classroomId} />
                    </div>
                )}

                {/* 5. Members Tab */}
                {tab === 'Members' && (
                    <div className="space-y-3">
                        {/* 🔥 NEW: The Teacher Card */}
                        <div className="glass-card flex items-center gap-4 p-4 border border-amber-500/30 bg-amber-500/5 shadow-[0_0_15px_rgba(245,158,11,0.1)]">
                            <div className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold bg-amber-500 overflow-hidden shrink-0">
                                {classroom.teacher?.avatarUrl ? (
                                    <img src={classroom.teacher.avatarUrl} alt="Teacher" className="w-full h-full object-cover" />
                                ) : (
                                    classroom.teacher?.name?.charAt(0).toUpperCase() || 'T'
                                )}
                            </div>
                            <div>
                                <p className="font-bold text-amber-400 text-base">
                                    {classroom.teacher?.name}
                                    <span className="text-[10px] ml-2 py-0.5 px-2 bg-amber-500/20 text-amber-300 rounded-full font-bold uppercase tracking-wider">Teacher</span>
                                </p>
                                <p className="text-slate-400 text-xs mt-0.5">{classroom.teacher?.email}</p>
                            </div>
                        </div>

                        {/* Students List */}
                        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider pt-2 pl-2">Enrolled Students ({classroom.enrollments?.length || 0})</h3>
                        
                        {(classroom.enrollments || []).length === 0 && (
                            <div className="glass-card p-10 text-center text-slate-400">No active students yet.</div>
                        )}
                        
                        {(classroom.enrollments || []).map((m) => (
                            <div key={m.userId || m.id} className="glass-card flex items-center gap-4 p-4 hover:bg-[#1e3a5f]/30 transition-colors">
                                <div className="w-10 h-10 rounded-full bg-[#1e3a5f] flex items-center justify-center font-bold text-white overflow-hidden shrink-0 border border-slate-600">
                                    {m.user?.avatarUrl ? (
                                        <img src={m.user.avatarUrl} alt={m.user.name} className="w-full h-full object-cover" />
                                    ) : (
                                        m.user?.name?.charAt(0).toUpperCase()
                                    )}
                                </div>
                                <div>
                                    <p className="font-medium text-white text-sm">{m.user?.name}</p>
                                    <p className="text-slate-400 text-xs mt-0.5">{m.user?.email}</p>
                                </div>
                                <div className="ml-auto text-xs text-slate-500 font-mono">
                                    {m.user?.userId}
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* 6. Workspace Tab */}
                {tab === 'Workspace' && (
                    <div className="glass-card p-12 text-center border border-amber-500/20">
                        <div className="w-20 h-20 bg-amber-500/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
                            <span className="text-4xl">💻</span>
                        </div>
                        <h2 className="text-2xl font-bold text-white mb-2">Collaborative Workspace</h2>
                        
                        {isTeacher ? (
                            <>
                                <p className="text-slate-400 mb-8 max-w-md mx-auto">
                                    Launch the real-time collaborative code editor. Once inside, click "Share" to invite your students via the class chat.
                                </p>
                                <Link to={`/classrooms/${classroomId}/workspace`} className="bg-amber-500 hover:bg-amber-400 text-navy-900 font-bold px-8 py-3 rounded-lg transition-colors inline-block">
                                    Launch Workspace 🚀
                                </Link>
                            </>
                        ) : (
                            <>
                                <p className="text-slate-400 mb-8 max-w-md mx-auto">
                                    This workspace is currently locked. Wait for your teacher to launch the session and share the invite link in the class chat.
                                </p>
                                <button disabled className="bg-slate-800 text-slate-500 font-bold px-8 py-3 rounded-lg transition-colors inline-block cursor-not-allowed">
                                    Waiting for Teacher...
                                </button>
                            </>
                        )}
                    </div>
                )}

                {/* 7. Pending Tab (Teacher Only) */}
                {tab === 'Pending' && isTeacher && (
                    <div className="space-y-3">
                        {(pendingData?.pending || []).length === 0 && (
                            <div className="glass-card p-10 text-center text-slate-400">No pending requests.</div>
                        )}
                        {(pendingData?.pending || []).map((m) => (
                            <div key={m.id} className="glass-card flex items-center gap-4 p-4">
                                <div className="w-9 h-9 rounded-full bg-[#1e3a5f] flex items-center justify-center font-bold text-white overflow-hidden shrink-0">
                                    {m.user?.avatarUrl ? (
                                        <img src={m.user.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                                    ) : (
                                        m.user.name?.charAt(0).toUpperCase()
                                    )}
                                </div>
                                <div className="flex-1">
                                    <p className="font-medium text-white text-sm">{m.user.name}</p>
                                    <p className="text-slate-400 text-xs">{m.user.email}</p>
                                </div>
                                <div className="flex gap-2">
                                    <button onClick={() => approveMutation.mutate({ userId: m.user.id, action: 'approve' })}
                                        className="bg-green-500 text-white py-1.5 px-3 text-xs font-bold rounded-lg" disabled={approveMutation.isPending}>
                                        Approve
                                    </button>
                                    <button onClick={() => approveMutation.mutate({ userId: m.user.id, action: 'reject' })}
                                        className="bg-red-500/20 text-red-400 border border-red-500 py-1.5 px-3 text-xs font-bold rounded-lg" disabled={approveMutation.isPending}>
                                        Reject
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Render Modals */}
            {showCreateAssign && <CreateAssignmentModal classroomId={classroomId} onClose={() => setShowCreateAssign(false)} />}
            {showCreateTest && <CreateTestModal classroomId={classroomId} onClose={() => setShowCreateTest(false)} />}
        </div>
    );
}