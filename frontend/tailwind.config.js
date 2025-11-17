/** @type {import('tailwindcss').Config} */
export default {
  // ESTA ES LA SOLUCIÓN:
  content: [
    "./frontend/index.html",
    "./frontend/src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}