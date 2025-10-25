/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
    "./screens/**/*.{js,jsx,ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: 'rgba(4, 120, 87, 0.1)',
          600: '#047857',
          700: '#059669',
        },
        accent: {
          red: '#ef4444',
          redDark: '#dc2626',
        },
        gray: {
          50: '#fafafa',
          100: '#f4f4f5',
          200: '#e4e4e7',
          300: '#d4d4d8',
          500: '#a1a1aa',
          600: '#71717a',
          900: '#09090b',
        },
        faith: {
          gold: '#FFD700',
        },
      },
    },
  },
  plugins: [],
}
