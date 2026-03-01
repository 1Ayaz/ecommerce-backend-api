import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// Plugin to inject env vars into the service worker at build/serve time
function swEnvPlugin() {
  return {
    name: 'sw-env-inject',
    // During dev: serve the SW with env vars replaced on-the-fly
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (req.url === '/firebase-messaging-sw.js') {
          const env = loadEnv('', process.cwd(), 'VITE_')
          const swPath = path.resolve(__dirname, 'public/firebase-messaging-sw.js')
          let content = fs.readFileSync(swPath, 'utf-8')
          // Replace all __VITE_*__ placeholders with actual env values
          content = content.replace(/__VITE_(\w+)__/g, (_, key) => env[`VITE_${key}`] || '')
          res.setHeader('Content-Type', 'application/javascript')
          res.setHeader('Service-Worker-Allowed', '/')
          res.end(content)
          return
        }
        next()
      })
    },
    // During build: replace placeholders in the output
    generateBundle(_, bundle) {
      const env = loadEnv('', process.cwd(), 'VITE_')
      for (const file of Object.values(bundle)) {
        if (file.fileName === 'firebase-messaging-sw.js' && file.source) {
          file.source = file.source.replace(/__VITE_(\w+)__/g, (_, key) => env[`VITE_${key}`] || '')
        }
      }
    }
  }
}

export default defineConfig({
  plugins: [react(), swEnvPlugin()],
  server: {
    host: true,
    headers: {
      'Cross-Origin-Opener-Policy': 'same-origin-allow-popups',
    },
    proxy: {
      '/api': 'http://localhost:5000',
    },
  },
})
