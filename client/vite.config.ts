// path: client/vite.config.ts
// version: 1.2 (Fixed TypeScript Errors)
// last-modified: 30 สิงหาคม 2568 11:00

import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  plugins: [react()],
  server: {
    port: 5173,
    host: true,
    strictPort: true,
  },
  preview: {
    port: 5173,
    host: true,
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          utils: ['axios']
        }
      }
    }
  },
  define: {
    // เพื่อให้ React DevTools ทำงานได้ใน production
    __DEV__: JSON.stringify(mode !== 'production')
  }
}))