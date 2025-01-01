/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './src/**/*.{html,js,jsx,ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        customLightBlue: '#08B4D6',
      },
    },
  },
  corePlugins: {
    textSizeAdjust: false, 
  },
  plugins: [],
}
