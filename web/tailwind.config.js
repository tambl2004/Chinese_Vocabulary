/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Design system colors from fe.md
        primary: {
          DEFAULT: '#00685f', // Teal
          dark: '#005049',
          light: '#6bd8cb',
          container: '#008378',
        },
        surface: {
          DEFAULT: '#ffffff',
          dim: '#d8dadc',
          bright: '#f7f9fb',
          container: '#eceef0',
        },
        text: {
          charcoal: '#1e293b',
          muted: '#545f73',
        },
        // Memory status colors
        status: {
          green: {
            text: '#00685f',
            bg: '#e6f3f1',
          },
          yellow: {
            text: '#b45309', // Warm amber
            bg: '#fef3c7',
          },
          red: {
            text: '#ba1a1a', // Error
            bg: '#ffdad6',
          }
        }
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        chinese: ['Noto Sans SC', 'Noto Sans TC', 'sans-serif'],
      },
      boxShadow: {
        'soft': '0px 4px 20px rgba(30, 41, 59, 0.05)',
        'soft-lg': '0px 10px 30px rgba(30, 41, 59, 0.1)',
      },
      borderRadius: {
        'DEFAULT': '0.5rem', // 8px for buttons/inputs
        'card': '1rem',      // 16px for cards
      }
    },
  },
  plugins: [],
}
