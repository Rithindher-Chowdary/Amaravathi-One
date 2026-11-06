/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'Segoe UI', 'sans-serif'],
      },
      colors: {
        navy: {
          DEFAULT: '#0B1F3A',
          50: '#F1F5FB',
          100: '#DCE6F5',
          200: '#B9CDE8',
          600: '#123B6D',
          700: '#0E2C52',
          800: '#0A2240',
          900: '#071528',
        },
        teal: {
          DEFAULT: '#0E9F9F',
          50: '#ECFDFB',
          100: '#D0F7F3',
          200: '#A5EFE9',
          600: '#0B8585',
          700: '#0A6E6E',
        },
        saffron: {
          DEFAULT: '#F59E0B',
          50: '#FFF8EB',
          100: '#FEF0C7',
          500: '#F59E0B',
          600: '#D97706',
        },
        surface: '#F6F8FB',
      },
      boxShadow: {
        soft: '0 1px 2px rgba(11,31,58,0.04), 0 12px 32px -16px rgba(11,31,58,0.18)',
        lift: '0 18px 48px -20px rgba(11,31,58,0.35)',
      },
      keyframes: {
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        'fade-up': 'fade-up 0.5s ease-out both',
      },
    },
  },
  plugins: [],
};
