/* eslint-disable no-undef */
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { defineConfig } from 'vite';

// ESM equivalent of __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig(({ mode }) => {
  const env = {
    VITE_BACKEND_PORT: process.env.VITE_BACKEND_PORT || '5000',
  };

  let backendPort;
  try {
    const portFile = fs.readFileSync(path.resolve(__dirname, 'backend-port.json'), 'utf-8');
    backendPort = JSON.parse(portFile).port || env.VITE_BACKEND_PORT;
  } catch (portReadingError) {
    console.warn(`Failed to read backend-port.json, falling back to ${env.VITE_BACKEND_PORT}:`, portReadingError.message);
    backendPort = env.VITE_BACKEND_PORT;
  }

  return {
      plugins: [react(), tailwindcss()],
      resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    server: {
      port: 5173,
      proxy: {
        '/api': {
          target: `http://localhost:${backendPort}`,
          changeOrigin: true,
        },
        '/socket.io': {
          target: `http://localhost:${backendPort}`,
          ws: true,
        },
      },
      hmr: { overlay: true },
    },
    build: {
      target: 'es2022',
      cssTarget: 'chrome80',
      outDir: 'dist',
      minify: 'esbuild',
      sourcemap: mode !== 'production',
      rollupOptions: {
        output: {
          manualChunks: {
            'react-vendor': ['react', 'react-dom', 'react-router-dom'],
            'ui-vendor': ['@heroicons/react', 'chart.js', 'react-chartjs-2'],
            'firebase-vendor': ['firebase/app', 'firebase/auth', 'firebase/firestore', 'firebase/storage'],
          },
        },
      },
    },
    define: {
      'process.env.NODE_ENV': JSON.stringify(mode),
      __DEBUG__: mode !== 'production',
    },
  };
});