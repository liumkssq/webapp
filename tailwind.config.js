/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#3498db',
          dark: '#2980b9',
          light: '#5dade2',
        },
        secondary: {
          DEFAULT: '#2ecc71',
          dark: '#27ae60',
          light: '#58d68d',
        },
        background: {
          DEFAULT: '#f8f9fa',
          dark: '#e9ecef',
        },
        text: {
          DEFAULT: '#343a40',
          light: '#6c757d',
          lightest: '#adb5bd',
        },
        danger: {
          DEFAULT: '#e74c3c',
          dark: '#c0392b',
        },
        warning: {
          DEFAULT: '#f39c12',
          dark: '#d35400',
        },
      },
      fontFamily: {
        sans: ['PingFang SC', 'Helvetica Neue', 'Arial', 'sans-serif'],
      },
      boxShadow: {
        'card': '0 2px 8px rgba(0, 0, 0, 0.1)',
        'nav': '0 -2px 10px rgba(0, 0, 0, 0.05)',
      },
      borderRadius: {
        'ios': '13px',
      },
    },
  },
  plugins: [],
}