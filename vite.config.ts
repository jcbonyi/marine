import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Vercel serves this app at the domain root; local/Netlify use the /marine/ subpath.
const base = process.env.VERCEL ? '/' : '/marine/'

export default defineConfig({
  plugins: [react()],
  base,
})
