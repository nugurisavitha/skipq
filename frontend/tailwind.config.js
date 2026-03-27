/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,jsx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: '#F2A93E',
        'primary-dark': '#F07054',
        secondary: '#004E89',
        'secondary-dark': '#003D5C',
        success: '#277d2a',
        error: '#cc3300',
        warning: '#ffcc00',
        info: '#157DEC',
        dark: '#2c323f',
        'body-bg': '#fafafb',
        'card-bg': '#ffffff',
        border: '#dedbdb',
        'input-bg': '#f8f8f8',
        'dark-primary': '#E5953A',
        'dark-secondary': '#0064B0',
        'dark-success': '#34A853',
        'dark-error': '#EA4335',
        'dark-warning': '#FBBC04',
        'dark-info': '#4285F4',
        'dark-bg': '#1A1F2E',
        'dark-card': '#242A3A',
      },
      fontFamily: {
        sans: ['Poppins', 'Inter', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        card: '15px',
      },
      keyframes: {
        slideInRight: {
          '0%': { transform: 'translateX(100%)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        slideInLeft: {
          '0%': { transform: 'translateX(-100%)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        fadeOut: {
          '0%': { opacity: '1' },
          '100%': { opacity: '0' },
        },
        pulse: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.5' },
        },
      },
      animation: {
        slideInRight: 'slideInRight 0.3s ease-out',
        slideInLeft: 'slideInLeft 0.3s ease-out',
        fadeIn: 'fadeIn 0.3s ease-out',
        fadeOut: 'fadeOut 0.3s ease-out',
        spin: 'spin 1s linear infinite',
        pulse: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
    },
  },
  plugins: [],
};
