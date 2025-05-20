/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './src/**/*.{html,js,jsx,ts,tsx}',
  ],
  theme: {
    fontFamily: {
      sans: ['Poppins', 'sans-serif'],
    },
    extend: {
      colors: {
        customLightBlue: '#08B4D6',
      },
      keyframes: {
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' }
        }
      },
      animation: {
        'fade-in': 'fade-in 0.3s ease-in-out'
      }
    },
  },
  variants: {
    extend: {},
  },
  corePlugins: {
    textSizeAdjust: false,
  },
  plugins: [],
}
