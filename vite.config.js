import process from 'node:process'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  /* En GitHub Pages la web vive en /citaly/ (lo pone el workflow). En local, en la raíz. */
  base: process.env.BASE_PATH || '/',
})
