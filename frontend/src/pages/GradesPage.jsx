import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useApi } from '../hooks/useApi';
import Spinner from '../components/ui/Spinner';

/**
 * GradesPage — student-only grade report across all classrooms.
 */
export default function GradesPage() {
    const api = useApi();

    // 1. Fetch DB User to get the correct UUID
    const { data: dbUser } = useQuery({
        queryKey: ['me'],
        queryFn: () => api.get('/api/v2/users/me').then(res => res.data),
    });

    // 2. Fetch Grades using that UUID
    const { data, isLoading } = useQuery({
        queryKey: ['grades', dbUser?.id],
        queryFn: () => api.get(`/api/v2/users/${dbUser.id}/grades`).then(res => res.data),
        enabled: !!dbUser?.id, // Only run this once we have the ID
    });

    const gradeColor = (score, max) => {
        if (!max || score == null) return 'text-slate-400';
        const pct = (score / max) * 100;
        if (pct >= 80) return 'text-green-400';
        if (pct >= 60) return 'text-amber-400';
        return 'text-red-400';
    };

    const gradeBg = (score, max) => {
        if (!max || score == null) return 'bg-[#162133] border-[#1e3a5f]';
        const pct = (score / max) * 100;
        if (pct >= 80) return 'bg-green-500/10 border-green-500/30';
        if (pct >= 60) return 'bg-amber-500/10 border-amber-500/30';
        return 'bg-red-500/10 border-red-500/30';
    };

    if (isLoading || !dbUser) return <div className="flex items-center justify-center h-64"><Spinner size="lg" /></div>;
    if (!data) return <div className="text-slate-400 text-center py-16">Could not load grades.</div>;

    const totalSubmissions = data.submissions?.length || 0;
    const gradedSubmissions = data.submissions?.filter(s => s.grade != null) || [];
    const avgPct = gradedSubmissions.length
        ? (gradedSubmissions.reduce((acc, s) => acc + (s.grade / s.assignment.maxMarks) * 100, 0) / gradedSubmissions.length).toFixed(1)
        : '—';

    return (
        <div className="max-w-4xl mx-auto space-y-8">
            <h1 className="text-2xl font-bold text-white">My Grades</h1>

            {/* Summary Cards */}
            <div className="grid grid-cols-3 gap-4">
                {[
                    { label: 'Assignments Submitted', val: totalSubmissions },
                    { label: 'Average Grade', val: avgPct === '—' ? '—' : `${avgPct}%` },
                    { label: 'Tests Attempted', val: data.testAttempts?.length || 0 },
                ].map(s => (
                    <div key={s.label} className="bg-[#162133] border border-[#1e3a5f] rounded-2xl p-5 text-center">
                        <p className="text-amber-400 text-3xl font-black">{s.val}</p>
                        <p className="text-slate-400 text-sm mt-1">{s.label}</p>
                    </div>
                ))}
            </div>

            {/* Assignments */}
            <div>
                <h2 className="text-white font-semibold mb-4">Assignments</h2>
                {!totalSubmissions
                    ? <p className="text-slate-500 text-sm bg-[#162133] border border-[#1e3a5f] p-6 rounded-xl text-center">No submissions yet.</p>
                    : (
                        <div className="space-y-3">
                            {data.submissions.map(sub => (
                                <div key={sub.id} className={`border rounded-xl p-4 flex items-center justify-between ${gradeBg(sub.grade, sub.assignment.maxMarks)}`}>
                                    <div>
                                        <p className="text-white font-medium">{sub.assignment.title}</p>
                                        <p className="text-slate-400 text-xs mt-0.5">{sub.assignment.classroom?.name} · {sub.assignment.classroom?.subject}</p>
                                        <p className="text-slate-500 text-xs mt-0.5">Submitted: {new Date(sub.submittedAt).toLocaleDateString()}{sub.isLate ? ' (Late)' : ''}</p>
                                    </div>
                                    <div className="text-right">
                                        {sub.grade != null
                                            ? <p className={`text-2xl font-black ${gradeColor(sub.grade, sub.assignment.maxMarks)}`}>{sub.grade}<span className="text-sm text-slate-500">/{sub.assignment.maxMarks}</span></p>
                                            : <p className="text-slate-500 text-sm mt-2 font-medium">Not graded</p>}
                                        {sub.feedback && <p className="text-slate-400 text-xs mt-1 max-w-40 text-right">{sub.feedback}</p>}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
            </div>

            {/* Tests */}
            <div>
                <h2 className="text-white font-semibold mb-4">Tests</h2>
                {!(data.testAttempts?.length)
                    ? <p className="text-slate-500 text-sm bg-[#162133] border border-[#1e3a5f] p-6 rounded-xl text-center">No tests attempted yet.</p>
                    : (
                        <div className="space-y-3">
                            {data.testAttempts.map(att => (
                                <div key={att.id} className={`border rounded-xl p-4 flex items-center justify-between ${gradeBg(att.score, att.test.totalMarks)}`}>
                                    <div>
                                        <p className="text-white font-medium">{att.test.title}</p>
                                        <p className="text-slate-400 text-xs mt-0.5">{att.test.classroom?.name}</p>
                                        <p className="text-slate-500 text-xs mt-0.5">Submitted: {new Date(att.submittedAt).toLocaleDateString()}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className={`text-2xl font-black ${gradeColor(att.score, att.test.totalMarks)}`}>
                                            {att.score?.toFixed(0)}<span className="text-sm text-slate-500">/{att.test.totalMarks}</span>
                                        </p>
                                        <p className="text-slate-400 text-xs mt-1">{((att.score / att.test.totalMarks) * 100).toFixed(1)}%</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
            </div>
        </div>
    );
}