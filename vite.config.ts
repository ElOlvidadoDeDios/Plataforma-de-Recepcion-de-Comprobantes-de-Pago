import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from 'tailwindcss';
import autoprefixer from 'autoprefixer';
import dotenv from 'dotenv';

// Cargar variables desde .env
dotenv.config();

const API_BASE_URL = process.env.VITE_API_BASE_URL || 'http://localhost:3030';
const LOGIN_API_BASE_URL = process.env.VITE_LOGIN_API_BASE_URL || 'http://localhost:3050';

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
    port: 5177,
    cors: true,
    proxy: {
      '/socket.io': {
        target: API_BASE_URL,
        ws: true,
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path,
        headers: {
          'Access-Control-Allow-Origin': '*'
        }
      },
      '/api': {
        target: API_BASE_URL,
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path,
        headers: {
          'Access-Control-Allow-Origin': '*'
        }
      },
      '/auth': {
        target: LOGIN_API_BASE_URL,
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path,
        headers: {
          'Access-Control-Allow-Origin': '*'
        }
      }
    },
  },
});
