/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{svelte,ts,js}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Quicksand', 'system-ui', 'sans-serif'],
      },
      colors: {
        // Charcoal surfaces
        charcoal: {
          950: '#0e0d0a',
          900: '#1c1a16',
          800: '#26231d',
          700: '#312d26',
          600: '#3d382f',
          500: '#4a4438',
        },
        // Borders
        stone: {
          750: '#3a3530',
        },
        // Muted text
        sand: {
          600: '#7a7168',
          500: '#9c9285',
          400: '#bdb3a8',
          200: '#e8e0d4',
          100: '#f5efe6',
        },
        // Amber accent
        amber: {
          // Tailwind's amber is kept, but we add a dim variant
          dim: '#78350f',
        },
      },
    },
  },
  plugins: [],
}