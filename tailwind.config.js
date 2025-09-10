/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: '#ffffff', // Fondo principal (blanco)
        panel: '#ffffff', // Cards, paneles (blanco)
        sidebar: '#ffffff', // Sidebar y navbar (blanco)
        border: '#e5e7eb', // Bordes y separadores (gris claro)
        hover: '#f9fafb', // Hover para paneles/cards (gris muy claro)
        text: 'rgb(13, 109, 177)', // Texto principal (azul)
        'text-secondary': 'rgb(13, 109, 177)', // Texto secundario (azul)
        primary: 'rgb(13, 109, 177)', // Azul
        success: '#10b981', // Verde
        warning: '#facc15', // Amarillo
        error: '#ef4444', // Rojo
        accent: '#8b5cf6', // Morado
        'brand-blue': 'rgb(13, 109, 177)', // Color de marca personalizado
      },
    },
  },
  plugins: [],
};
