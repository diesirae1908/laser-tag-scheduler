/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        laser: {
          cyan: '#00e5ff',
          green: '#00e676',
          orange: '#ff6d00',
          pink: '#ff4081',
          dark: '#08080f',
          card: '#10101a',
          border: '#1c1c2e',
          muted: '#2a2a40',
        },
      },
    },
  },
  plugins: [],
};
