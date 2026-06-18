/** @type {import('tailwindcss').Config} */

export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    container: {
      center: true,
    },
    extend: {
      colors: {
        abyss: {
          950: '#05050a',
          900: '#0a0a0f',
          850: '#0f0f18',
          800: '#14141f',
          700: '#1a1a28',
          600: '#25253a',
        },
        blood: {
          900: '#4a0000',
          800: '#6b0000',
          700: '#8b0000',
          600: '#a81212',
          500: '#c41e1e',
          400: '#dc3545',
        },
        amber: {
          900: '#785520',
          700: '#a8802a',
          500: '#c9a227',
          400: '#dbb83a',
        },
        ghost: {
          900: '#8a8780',
          700: '#b5b1ab',
          500: '#e8e6e3',
          300: '#f0eeea',
        },
        void: {
          900: '#1a0a2e',
          800: '#24103f',
          700: '#301854',
        },
        moss: {
          900: '#0f1f0f',
          800: '#1a2f1a',
          700: '#254025',
        },
      },
      fontFamily: {
        serif: ['"Noto Serif SC"', '"Source Han Serif CN"', 'Georgia', 'serif'],
        sans: ['"Noto Sans SC"', '"Source Han Sans CN"', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'glow-red': '0 0 12px rgba(139, 0, 0, 0.6), inset 0 0 6px rgba(139, 0, 0, 0.2)',
        'glow-amber': '0 0 12px rgba(201, 162, 39, 0.4), inset 0 0 6px rgba(201, 162, 39, 0.15)',
        'inner-abyss': 'inset 0 2px 8px rgba(0, 0, 0, 0.6)',
        'card': '0 2px 12px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.04)',
      },
      animation: {
        'pulse-slow': 'pulse 3s ease-in-out infinite',
        'breath': 'breath 2.4s ease-in-out infinite',
        'flicker': 'flicker 4s linear infinite',
        'float': 'float 6s ease-in-out infinite',
      },
      keyframes: {
        breath: {
          '0%, 100%': { boxShadow: '0 0 8px rgba(139, 0, 0, 0.3)' },
          '50%': { boxShadow: '0 0 20px rgba(139, 0, 0, 0.8)' },
        },
        flicker: {
          '0%, 100%': { opacity: '1' },
          '41%': { opacity: '1' },
          '42%': { opacity: '0.8' },
          '43%': { opacity: '1' },
          '45%': { opacity: '0.9' },
          '46%': { opacity: '1' },
          '49%': { opacity: '0.85' },
          '50%': { opacity: '1' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-6px)' },
        },
      },
      backgroundImage: {
        'noise': "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.08'/%3E%3C/svg%3E\")",
        'gradient-radial-blood': 'radial-gradient(ellipse at top, rgba(139,0,0,0.15), transparent 70%)',
      },
    },
  },
  plugins: [],
};
