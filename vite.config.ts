import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    allowedHosts: ['chad-valium-skating-responsibility.trycloudflare.com'], // Permite este host
    proxy: {
      '/api': {
        target: 'https://wedding-front-kappa.vercel.app/',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api/, '') 
      }
    }
  }
})
