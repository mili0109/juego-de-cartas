/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        felt: '#0b4d3a',
        feltDark: '#083828',
      },
    },
  },
  plugins: [],
};
