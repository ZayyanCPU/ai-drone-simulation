/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'cyber-dark': '#0a0e1a',
        'cyber-darker': '#0f1419',
        'cyber-green': '#00ff41',
        'cyber-cyan': '#00d9ff',
        'cyber-orange': '#ff6b35',
        'cyber-warning': '#ffaa00',
        'cyber-danger': '#ff0055',
      },
      fontFamily: {
        'mono': ['Fira Code', 'monospace'],
      },
      animation: {
        'glitch': 'glitch 0.3s infinite',
        'scan': 'scan 8s linear infinite',
        'blink': 'blink 1s step-end infinite',
      },
      keyframes: {
        glitch: {
          '0%, 100%': { transform: 'translate(0)' },
          '33%': { transform: 'translate(-2px, 2px)' },
          '66%': { transform: 'translate(2px, -2px)' },
        },
        scan: {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(100%)' },
        },
        blink: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0' },
        },
      },
    },
  },
  plugins: [],
}

