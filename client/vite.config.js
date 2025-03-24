import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
      '/socket.io': {
        target: 'http://localhost:5000',
        ws: true,
      },
    },
  },
  define: {
    // Fix process.env usage for React 19
    'process.env': {},
  },
  esbuild: {
    // Custom targets for compatibility
    target: 'es2020'
  },
  build: {
    target: 'es2020',
    cssTarget: 'chrome80',
    outDir: 'dist',
    // Better optimization
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: false,
      },
    },
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'ui-vendor': ['@heroicons/react', 'chart.js', 'react-chartjs-2'],
        },
      },
    },
  },
});
