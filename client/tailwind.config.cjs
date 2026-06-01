/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            fontFamily: {
                sans: ['Inter', 'sans-serif'],
                heading: ['Outfit', 'sans-serif'],
            },
            colors: {
                primary: {
                    50: '#f5f3ff',
                    100: '#ede9fe',
                    200: '#ddd6fe',
                    300: '#c4b5fd',
                    400: '#a78bfa',
                    500: '#8b5cf6', // Brand
                    600: '#7c3aed', // Action
                    700: '#6d28d9', // Hover
                    800: '#5b21b6',
                    900: '#4c1d95', // Deep
                },
                accent: {
                    DEFAULT: '#d946ef', // Fuchsia 500
                    hover: '#c026d3', // Fuchsia 600
                },
                success: {
                    DEFAULT: '#10b981', // Emerald 500
                    bg: '#ecfdf5',
                },
                surface: {
                    DEFAULT: '#ffffff',
                    subtle: '#f8fafc', // Slate 50
                }
            },
            animation: {
                'fade-in': 'fadeIn 0.4s ease-out',
                'slide-up': 'slideUp 0.5s cubic-bezier(0.16, 1, 0.3, 1)',
                'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
                'gradient-x': 'gradient-x 10s ease infinite',
                'float': 'float 6s ease-in-out infinite',
                'glow': 'glow 3s ease-in-out infinite alternate',
            },
            keyframes: {
                fadeIn: {
                    '0%': { opacity: '0' },
                    '100%': { opacity: '1' },
                },
                slideUp: {
                    '0%': { transform: 'translateY(20px)', opacity: '0' },
                    '100%': { transform: 'translateY(0)', opacity: '1' },
                },
                'gradient-x': {
                    '0%, 100%': {
                        'background-size': '200% 200%',
                        'background-position': 'left center',
                    },
                    '50%': {
                        'background-size': '200% 200%',
                        'background-position': 'right center',
                    },
                },
                float: {
                    '0%, 100%': { transform: 'translateY(0)' },
                    '50%': { transform: 'translateY(-10px)' },
                },
                glow: {
                    '0%': { 'box-shadow': '0 0 15px 0px rgba(139, 92, 246, 0.3)' },
                    '100%': { 'box-shadow': '0 0 30px 10px rgba(139, 92, 246, 0.6)' },
                }
            }
        },
    },
    plugins: [],
}
