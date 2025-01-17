import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from 'tailwindcss';
import autoprefixer from 'autoprefixer';
import dotenv from 'dotenv';

// Cargar variables desde .env
dotenv.config();

export default defineConfig({
  base: '/',
  plugins: [react()],
  css: {
    postcss: {
      plugins: [
        tailwindcss,
        autoprefixer({
          overrideBrowserslist: ['last 2 versions', 'not ie < 9', '> 1%'],
          cascade: false,
        }),
      ],
    },
  },
  server: {
    proxy: {
      // Redirigir rutas relacionadas a la API principal
      '/src': {
        target: process.env.VITE_API_BASE_URL,
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api/, ''), // Opcional, si necesitas ajustar el path
      },
      // Redirigir rutas relacionadas al API de login o secundaria
      '/componentes': {
        target: process.env.VITE_LOGIN_API_BASE_URL,
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/auth/, ''), // Opcional, si necesitas ajustar el path
      }

    },
  },
});
