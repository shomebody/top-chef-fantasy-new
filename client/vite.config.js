// @ts-check
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import fs from 'fs';

// Type-safe configuration function
export default defineConfig(/** @type {import('vite').ConfigEnv} */ ({ mode }) => {
  const env = {
    VITE_BACKEND_PORT: process.env.VITE_BACKEND_PORT || '5000',
  };

  let backendPort;
  try {
    const portFile = fs.readFileSync(path.resolve(__dirname, 'backend-port.json'), 'utf-8');
    backendPort = JSON.parse(portFile).port || env.VITE_BACKEND_PORT;
  } catch (e) {
    backendPort = env.VITE_BACKEND_PORT;
  }

  /** @type {import('vite').UserConfig} */
  const config = {
    plugins: [react()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    css: {
      postcss: './postcss.config.cjs',
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
    },
    esbuild: {
      target: 'es2020',
    },
    build: {
      target: 'es2020',
      cssTarget: 'chrome80',
      outDir: 'dist',
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
  };

  return config;
});