/** @type {import('tailwindcss').Config} */
export default {
    content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
    theme: {
        extend: {
            colors: {
                navy: {
                    900: '#0F1729', // deepest background
                    800: '#1A2540', // sidebar
                    700: '#243152', // cards
                    600: '#2E3D64', // hover states
                },
                chalk: {
                    100: '#F5F5F0', // primary text on dark
                    200: '#E8E8E0', // secondary text
                    400: '#A0A0A8', // muted/placeholder
                },
                amber: {
                    400: '#F59E0B', // primary accent
                    500: '#D97706', // hover accent
                },
                success: '#10B981',
                danger: '#EF4444',
                info: '#3B82F6',
            },
            fontFamily: {
                sans: ['Inter', 'system-ui', 'sans-serif'],
                mono: ['"JetBrains Mono"', '"Fira Code"', 'monospace'],
            },
            boxShadow: {
                card: '0 4px 24px rgba(0,0,0,0.3)',
                glow: '0 0 20px rgba(245,158,11,0.15)',
            },
            spacing: {
                70: '17.5rem', // sidebar width
            },
        },
    },
    plugins: [],
};
