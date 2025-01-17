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
        target: 'https://61b5-38-252-219-16.ngrok-free.app',
        changeOrigin: true,
        secure: false,
      },
      '/login': {
        target: 'https://80d4-38-252-219-16.ngrok-free.app',
        changeOrigin: true,
        secure: false,
      },
    },
  },
});
