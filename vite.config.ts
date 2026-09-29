import { defineConfig, Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'fs'
import path from 'path'

// Plugin de resolución robusta para Cloudflare Pages / Linux
// Evita errores por diferencias de mayúsculas/minúsculas entre Windows y Linux
function caseSensitiveFallbackPlugin(): Plugin {
  return {
    name: 'case-sensitive-fallback',
    resolveId(source, importer) {
      if (source.startsWith('.') && importer) {
        const importerDir = path.dirname(importer)
        const targetPath = path.resolve(importerDir, source)

        // 1. Probar extensiones estándar
        for (const ext of ['', '.ts', '.tsx', '.js', '.jsx', '.json']) {
          const candidate = targetPath + ext
          if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) {
            return candidate
          }
        }

        // 2. Si no se encontró, buscar en el directorio ignorando mayúsculas/minúsculas
        const targetDir = path.dirname(targetPath)
        const targetBase = path.basename(targetPath).toLowerCase()

        if (fs.existsSync(targetDir)) {
          try {
            const files = fs.readdirSync(targetDir)
            for (const f of files) {
              const withoutExt = f.replace(/\.(ts|tsx|js|jsx)$/, '').toLowerCase()
              if (f.toLowerCase() === targetBase || withoutExt === targetBase) {
                return path.resolve(targetDir, f)
              }
            }
          } catch {
            // ignore
          }
        }
      }
      return null
    }
  }
}

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), caseSensitiveFallbackPlugin()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './'),
      '@services': path.resolve(__dirname, './services'),
      '@components': path.resolve(__dirname, './components'),
    },
    extensions: ['.mjs', '.js', '.ts', '.jsx', '.tsx', '.json']
  },
  server: {
    host: true,
    port: 5173,
  }
})
