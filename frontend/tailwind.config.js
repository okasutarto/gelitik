/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{vue,js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        "cyber-yellow": "#FFCC00",
        primary: {
          DEFAULT: "#3713ec",
          50: "#eff0ff",
          100: "#e2e4ff",
          200: "#cbceff",
          300: "#a9a9ff",
          400: "#8a7eff",
          500: "#6f53fc",
          600: "#3713ec",
          700: "#5424d8",
          800: "#4520af",
          900: "#3a1f8c",
        },
        background: {
          light: "#f6f6f8",
          dark: "#131022",
        },
        sidebar: "#1e1b4b",
        instagram: "#E1306C",
        tiktok: "#000000",
      },
      fontFamily: {
        display: ["Inter", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"],
      },
      borderRadius: {
        DEFAULT: "0.25rem",
        lg: "0.5rem",
        xl: "0.75rem",
        "2xl": "1rem",
        full: "9999px",
      },
      borderWidth: {
        '3': '3px',
      },
      boxShadow: {
        "neo-hard": "8px 8px 0px 0px rgba(0, 0, 0, 1)",
        "neo-hard-lg": "12px 12px 0px 0px rgba(0, 0, 0, 1)",
        "neo-hard-sm": "6px 6px 0px 0px rgba(0, 0, 0, 1)",
        "brutal": "8px 8px 0px 0px rgba(0,0,0,1)",
        "brutal-md": "6px 6px 0px 0px rgba(0,0,0,1)",
        "brutal-sm": "4px 4px 0px 0px rgba(0,0,0,1)",
        "brutal-active": "2px 2px 0px 0px rgba(0,0,0,1)",
      },
    },
  },
  plugins: [],
};
