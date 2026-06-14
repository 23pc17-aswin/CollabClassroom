/** @module components/ui/Spinner */
export default function Spinner({ size = 'md', className = '' }) {
    const sizes = { sm: 'h-4 w-4', md: 'h-8 w-8', lg: 'h-12 w-12' };
    return (
        <div
            className={`animate-spin rounded-full border-2 border-white/10 border-t-amber-400 ${sizes[size]} ${className}`}
            role="status"
            aria-label="Loading"
        />
    );
}
