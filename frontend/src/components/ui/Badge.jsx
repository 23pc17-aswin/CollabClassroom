/** @module components/ui/Badge */

const badgeColors = {
    ADMIN: 'bg-red-900/50 text-red-300 border border-red-700',
    TEACHER: 'bg-amber-900/50 text-amber-300 border border-amber-700',
    STUDENT: 'bg-blue-900/50 text-blue-300 border border-blue-700',
};

/**
 * Role badge component.
 * @param {{ role: 'ADMIN' | 'TEACHER' | 'STUDENT', className?: string }} props
 */
export default function Badge({ role, label, className = '' }) {
    const text = label || role;
    const colorClass = badgeColors[role] || 'bg-white/10 text-chalk-200 border border-white/20';
    return (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colorClass} ${className}`}>
            {text}
        </span>
    );
}
