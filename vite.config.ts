import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    allowedHosts: ['https://wedding-front-kappa.vercel.app'], // Permite este host
    proxy: {
      '/api': {
        target: 'https://wedding-back-bkutww.fly.dev',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api/, '')
      }
    }
    
  }
})
