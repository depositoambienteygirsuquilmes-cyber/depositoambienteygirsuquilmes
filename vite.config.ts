import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: true, // IMPORTANTE: Esto habilita el acceso desde la red WiFi (Celular)
    port: 5173,
  }
})