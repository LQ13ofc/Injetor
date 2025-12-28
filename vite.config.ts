import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig({
  plugins: [react()],
  root: path.join(__dirname, 'src'),
  base: './',
  build: {
    outDir: path.join(__dirname, 'dist/renderer'),
    emptyOutDir: true,
    minify: 'terser',
    sourcemap: false,
    rollupOptions: {
      external: ['electron'],
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom'],
          'ui-vendor': ['lucide-react']
        }
      }
    },
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true
      }
    }
  },
  resolve: {
    alias: {
      '@': path.join(__dirname, 'src')
    }
  },
  server: {
    port: 5173,
    strictPort: true,
    host: true
  },
  optimizeDeps: {
    exclude: ['electron']
  }
});