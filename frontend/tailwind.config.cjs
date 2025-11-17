// 1. Importamos el módulo 'path' de Node.js
const path = require('path');

/** @type {import('tailwindcss').Config} */
module.exports = {
  // 2. Usamos path.join para crear rutas absolutas
  // __dirname es una variable de Node que significa "esta carpeta actual"
  content: [
    path.join(__dirname, "./index.html"),
    path.join(__dirname, "./src/**/*.{js,ts,jsx,tsx}"),
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}