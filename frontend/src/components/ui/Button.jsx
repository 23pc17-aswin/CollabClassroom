/** @module components/ui/Button */

const variants = {
    primary: 'bg-amber-400 hover:bg-amber-500 text-navy-900 font-semibold shadow-sm hover:shadow-glow',
    secondary: 'border border-chalk-400 text-chalk-200 hover:bg-navy-600',
    danger: 'bg-danger/10 hover:bg-danger/20 text-red-300 border border-red-700',
    ghost: 'text-chalk-400 hover:text-chalk-100 hover:bg-navy-700',
};

const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base',
};

/**
 * Reusable button with variant and size support.
 * @param {{ variant?: string, size?: string, isLoading?: boolean } & React.ButtonHTMLAttributes<HTMLButtonElement>} props
 */
export default function Button({
    children,
    variant = 'primary',
    size = 'md',
    isLoading = false,
    className = '',
    ...props
}) {
    return (
        <button
            className={`inline-flex items-center justify-center gap-2 rounded-lg transition-all
                ${variants[variant] || variants.primary}
                ${sizes[size] || sizes.md}
                disabled:opacity-50 disabled:cursor-not-allowed
                ${className}`}
            disabled={isLoading || props.disabled}
            {...props}
        >
            {isLoading && (
                <span className="animate-spin rounded-full h-4 w-4 border-2 border-current border-t-transparent" />
            )}
            {children}
        </button>
    );
}
