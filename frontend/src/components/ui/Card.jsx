/** @module components/ui/Card */
export default function Card({ children, className = '', hover = false, ...props }) {
    return (
        <div
            className={`bg-navy-700 rounded-xl shadow-card border border-white/5
                ${hover ? 'hover:border-amber-400/30 hover:shadow-glow transition-all cursor-pointer' : ''}
                ${className}`}
            {...props}
        >
            {children}
        </div>
    );
}
