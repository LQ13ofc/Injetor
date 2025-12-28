
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./*.{js,ts,jsx,tsx}",
    "./src/**/*.{js,ts,jsx,tsx}",
    "!./node_modules/**",
    "!./dist/**",
    "!./release/**"
  ],
  theme: {
    extend: {
      colors: {
        'main': 'var(--bg-primary)',
        'panel': 'var(--bg-secondary)',
        'sidebar': 'var(--bg-tertiary)',
        'content': 'var(--text-primary)',
        'muted': 'var(--text-muted)',
        'border-dim': 'var(--border-dim)',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      animation: {
        'in': 'fadeIn 0.3s ease-out forwards',
      },
      keyframes: {
        fadeIn: {
          'from': { opacity: '0' },
          'to': { opacity: '1' },
        }
      }
    },
  },
  plugins: [],
}
