import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api/onlinecompiler': {
        target: 'https://api.onlinecompiler.io',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/onlinecompiler/, ''),
      },
    },
  },
})
