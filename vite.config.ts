import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from 'tailwindcss';
import autoprefixer from 'autoprefixer';

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
      '/api': {
        target: 'https://d079-38-252-219-16.ngrok-free.app ',
        changeOrigin: true,
        secure: false,
      },
      '/login': {
        target: 'https://9a88-38-252-219-16.ngrok-free.app',
        changeOrigin: true,
        secure: false,
      },
    },
  },
});
