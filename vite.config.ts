import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0', // Permite conexiones desde cualquier IP
    port: 5173,      // Puerto específico
    strictPort: false, // Permite usar otro puerto si 5173 está ocupado
    proxy: {
      '/dilescore-api': {
        target: 'http://192.168.3.34:8080',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/dilescore-api/, ''),
      },
    },
  },
  build: {
    chunkSizeWarningLimit: 1600,
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'query': ['@tanstack/react-query'],
          'http': ['axios'],
          'export': ['exceljs', 'jspdf', 'html2canvas'],
          'ui': [
            '@radix-ui/react-dialog',
            '@radix-ui/react-label',
            '@radix-ui/react-select',
            '@radix-ui/react-slot',
            'class-variance-authority',
            'clsx',
            'tailwind-merge'
          ]
        }
      }
    }
  }
});
