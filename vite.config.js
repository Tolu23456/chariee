import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    host: '0.0.0.0',
    port: 5000,
    allowedHosts: true,
  },
  define: {
    'import.meta.env.VITE_OPENROUTER_API_KEY': JSON.stringify(process.env.VITE_OPENROUTER_API_KEY),
  },
})
