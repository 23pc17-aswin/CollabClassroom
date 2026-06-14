/**
 * ClassroomCard — displays classroom info in a grid.
 * @module components/classroom/ClassroomCard
 */

import { useNavigate } from 'react-router-dom';

const subjectColors = [
    'bg-purple-500/20 text-purple-300 border-purple-500/30',
    'bg-blue-500/20 text-blue-300 border-blue-500/30',
    'bg-green-500/20 text-green-300 border-green-500/30',
    'bg-pink-500/20 text-pink-300 border-pink-500/30',
    'bg-orange-500/20 text-orange-300 border-orange-500/30',
];

function hashSubject(str = '') {
    let h = 0;
    for (const c of str) h = (h * 31 + c.charCodeAt(0)) & 0xfffffff;
    return subjectColors[h % subjectColors.length];
}

/**
 * @param {{ classroom: object, isTeacher?: boolean }} props
 */
export default function ClassroomCard({ classroom, isTeacher = false }) {
    const navigate = useNavigate();
    const subjectColor = hashSubject(classroom.subject);

    return (
        <div
            onClick={() => navigate(`/classrooms/${classroom.id}`)}
            className="bg-navy-700 rounded-xl p-6 shadow-card border border-white/5
                hover:border-amber-400/30 hover:shadow-glow transition-all cursor-pointer
                flex flex-col gap-4 group"
        >
            {/* Top row */}
            <div className="flex items-start justify-between gap-2">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${subjectColor}`}>
                    {classroom.subject || 'General'}
                </span>
                <span className="text-chalk-400/50 text-xs font-mono bg-white/5 px-2 py-0.5 rounded">
                    {classroom.classCode}
                </span>
            </div>

            {/* Name */}
            <div>
                <h3 className="text-chalk-100 font-semibold text-lg leading-snug group-hover:text-amber-400 transition-colors">
                    {classroom.name}
                </h3>
                {classroom.teacher && (
                    <p className="text-chalk-400 text-sm mt-1">
                        {isTeacher ? 'You are the teacher' : `by ${classroom.teacher.name}`}
                    </p>
                )}
            </div>

            {/* Stats */}
            <div className="flex items-center gap-4 pt-2 border-t border-white/5">
                <div className="flex items-center gap-1.5 text-chalk-400 text-sm">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span>{classroom._count?.memberships ?? 0} students</span>
                </div>
                <div className="flex items-center gap-1.5 text-chalk-400 text-sm">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                    <span>{classroom._count?.assignments ?? 0} assignments</span>
                </div>
            </div>
        </div>
    );
}
