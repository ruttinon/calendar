import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ mode }) => ({
  base: mode === 'production' ? '/calendar/' : '/',
  plugins: [react()],
  server: {
    port: 5178,
  },
  optimizeDeps: {
    include: ['react-signature-canvas']
  }
}))
