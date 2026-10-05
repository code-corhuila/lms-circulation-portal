import { federation } from '@module-federation/vite'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    federation({
      name: 'circulation_portal',
      filename: 'remoteEntry.js',
      exposes: {
        './routes': './src/routes.tsx',
      },
      // 'shell/apiClient' and 'shell/session' (src/shell.d.ts) resolve
      // against this — lms-front's own federation({ exposes }) is what
      // actually serves them.
      remotes: {
        shell: {
          type: 'module',
          name: 'shell',
          entry: 'http://localhost:3000/remoteEntry.js',
        },
      },
      shared: ['react', 'react-dom', 'react-router-dom'],
    }),
  ],
  server: {
    port: 3003,
  },
  build: {
    target: 'esnext',
  },
})
