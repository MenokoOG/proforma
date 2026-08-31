import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  // GitHub project pages are served from /<repo>/, not from the domain root,
  // so CI sets BASE_PATH. Local dev and preview keep '/'.
  base: process.env.BASE_PATH ?? '/',
  plugins: [react()],
  server: {
    port: 5173,
    // The optional AI Assist server (npm run assist) listens on 8787.
    // The app works fully without it; this proxy just makes it reachable in dev.
    proxy: {
      '/api': {
        target: 'http://localhost:8787',
        changeOrigin: true,
      },
    },
  },
  build: {
    target: 'es2022',
    sourcemap: false,
    rollupOptions: {
      output: {
        // React changes on a release cadence; the app changes on ours.
        // Splitting them means a deploy only invalidates the app chunk.
        manualChunks: {
          react: ['react', 'react-dom', 'react-dom/client'],
        },
      },
    },
  },
})
