// frontend/tailwind.config.js
/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
        colors: {
            reddit: {
            50: '#FFF5F3',
            100: '#FFE6E0',
            500: '#FF4500',
            600: '#E63E00',
            700: '#CC3700',
            },
            bot: {
            active: '#10B981',
            paused: '#6B7280',
            error: '#EF4444',
            },
            dashboard: {
            bg: '#F9FAFB',
            card: '#FFFFFF',
            border: '#E5E7EB',
            }
        },
        fontFamily: {
            sans: ['Inter var', 'Inter', 'system-ui', 'sans-serif'],
            mono: ['JetBrains Mono', 'Menlo', 'monospace'],
        },
        boxShadow: {
            'bot-card': '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
            'modal': '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 10px 10px -5px rgb(0 0 0 / 0.04)',
        },
        animation: {
            'bounce-slow': 'bounce 2s infinite',
            'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
            'status-blink': 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        }
        },
    },
    plugins: [
        require('@tailwindcss/forms'),
        require('@tailwindcss/typography'),
        // Custom plugin for dashboard-specific utilities
        function({ addComponents, theme }) {
        addComponents({
            '.dashboard-container': {
            maxWidth: theme('maxWidth.7xl'),
            marginLeft: 'auto',
            marginRight: 'auto',
            paddingLeft: theme('spacing.4'),
            paddingRight: theme('spacing.4'),
            '@screen sm': {
                paddingLeft: theme('spacing.6'),
                paddingRight: theme('spacing.6'),
            },
            '@screen lg': {
                paddingLeft: theme('spacing.8'),
                paddingRight: theme('spacing.8'),
            },
            }
        })
        }
    ],
}