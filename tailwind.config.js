/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: '#005B63',
        petroleo: {
          50: '#E6F3F5',
          100: '#CCE7EB',
          200: '#99CFD7',
          300: '#66B7C3',
          400: '#339FAA',
          500: '#1F8892',
          600: '#006D77',
          700: '#005B63',
          800: '#004A50',
          900: '#00373C',
          950: '#002629',
        },
        papel: '#C9D0B8',
      },
      animation: {
        'fade-in-up': 'fade-in-up 0.3s ease-out',
      },
      keyframes: {
        'fade-in-up': {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
}
