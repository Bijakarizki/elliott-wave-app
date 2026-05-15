/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
        sans: ['DM Sans', 'system-ui', 'sans-serif'],
      },
      colors: {
        bg: '#0a0a0f',
        surface: '#111118',
        border: '#1e1e2e',
        accent: '#f0b429',
        green: '#00d084',
        red: '#ff4466',
        blue: '#4da6ff',
        purple: '#a78bfa',
        muted: '#4a4a6a',
        text: '#e2e2f0',
        subtle: '#8888aa',
      }
    }
  },
  plugins: []
}
