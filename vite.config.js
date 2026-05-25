import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// IMPORTANT: Change 'strengthen-app' to match your GitHub repository name exactly
export default defineConfig({
  plugins: [react()],
  base: '/strengthen-app/',
})
