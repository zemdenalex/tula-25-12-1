import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://85.198.80.80:8000',
        changeOrigin: true,
        secure: false,
      },
    },
  },
});