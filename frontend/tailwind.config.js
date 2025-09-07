/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      colors: {
        primary: '#3C50E0',
        secondary: '#80CAEE',
        success: '#10B981',
        danger: '#DC3545',
        warning: '#F2994A',
        black: '#1C2434',
        'box-dark': '#24303F',
        'box-dark-2': '#1A222C',
        'body-color': '#64748B',
        stroke: '#E2E8F0',
        strokedark: '#2E3A47',
        'form-input': '#24303F',
        whiten: '#F1F5F9',
        white: '#FFFFFF',
        gray: {
          DEFAULT: '#EFF4FB',
          '2': '#F7F9FC',
          '300': '#D1D5DB',
          '400': '#9CA3AF',
          '500': '#6B7280',
          '600': '#4B5563',
        },
      }
    }
  },
  plugins: [],
}