import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { execSync } from 'node:child_process'

let lastUpdate = ''
try {
  lastUpdate = execSync('git log -1 --pretty=format:%cI').toString().trim()
} catch {}

export default defineConfig({
  plugins: [react()],
  define: {
    __LAST_UPDATE__: JSON.stringify(lastUpdate)
  }
})
