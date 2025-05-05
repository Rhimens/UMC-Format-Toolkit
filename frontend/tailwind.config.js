/** @type {import('tailwindcss').Config} */
// frontend/tailwind.config.js
module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx,html}'],
  theme: {
    extend: {},
  },
  plugins: [require('@tailwindcss/aspect-ratio')],
  safelist: [
    'border-red-600', 'border-yellow-500', 'border-yellow-300',
    'border-blue-600', 'border-blue-300', 'border-purple-600',
    'border-purple-300', 'border-green-400',
  ],
};