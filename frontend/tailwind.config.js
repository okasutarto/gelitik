/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    './index.html',
    './src/**/*.{vue,js,ts,jsx,tsx}'
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#3713ec',
          50: '#eff0ff',
          100: '#e2e4ff',
          200: '#cbceff',
          300: '#a9a9ff',
          400: '#8a7eff',
          500: '#6f53fc',
          600: '#3713ec',
          700: '#5424d8',
          800: '#4520af',
          900: '#3a1f8c'
        },
        background: {
          light: '#f6f6f8',
          dark: '#131022'
        }
      },
      fontFamily: {
        display: ['Inter', 'sans-serif']
      },
      borderRadius: {
        DEFAULT: '0.25rem',
        lg: '0.5rem',
        xl: '0.75rem',
        '2xl': '1rem',
        full: '9999px'
      }
    }
  },
  plugins: []
}
