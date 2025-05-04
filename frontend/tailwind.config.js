/** @type {import('tailwindcss').Config} */
// frontend/tailwind.config.js
module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx,html}'],
  theme: {
    extend: {},
  },
  plugins: [require('@tailwindcss/aspect-ratio')],
};
