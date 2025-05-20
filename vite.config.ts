import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from 'tailwindcss';
import autoprefixer from 'autoprefixer';
import dotenv from 'dotenv';

// Cargar variables desde .env
dotenv.config();

const API_BASE_URL = process.env.VITE_API_BASE_URL || 'http://localhost:3030';
const LOGIN_API_BASE_URL = process.env.VITE_LOGIN_API_BASE_URL || 'http://localhost:3050';

// Plugin para eliminar console.logs en producción
const removeConsolePlugin = () => ({
  name: 'remove-console',
  transform(code: string, id: string) {
    if (process.env.NODE_ENV === 'production' && id.endsWith('.ts') || id.endsWith('.tsx')) {
      return {
        code: code.replace(/console\.(log|info|debug|warn)\((.*?)\);?/g, ''),
        map: null
      }
    }
  }
});

export default defineConfig(({ mode }) => ({
  base: '/',
  plugins: [react(), removeConsolePlugin()],
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
  build: {
    minify: mode === 'production',
    rollupOptions: {
      output: {
        entryFileNames: mode === 'production' ? 'assets/[hash].js' : 'assets/[name].js',
        chunkFileNames: mode === 'production' ? 'assets/[hash].js' : 'assets/[name].js',
        assetFileNames: mode === 'production' ? 'assets/[hash].[ext]' : 'assets/[name].[ext]'
      }
    }
  },
  server: {
    port: 5177,
    cors: true,
    historyApiFallback: {
      disableDotRule: true,
      rewrites: [
        { from: /^\/.*/, to: '/index.html' }
      ]
    },
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
}));
