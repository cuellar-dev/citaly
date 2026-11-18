import process from 'node:process'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  /* En GitHub Pages la web vive en /citaly/ (lo pone el workflow). En local, en la raíz. */
  base: process.env.BASE_PATH || '/',
  build: {
    /* dist/.vite/manifest.json: dice qué archivos lleva cada página. Lo usa
       scripts/rutas-estaticas.mjs en el deploy y luego lo borra. */
    manifest: true,
    rolldownOptions: {
      output: {
        codeSplitting: {
          groups: [
            /* React + router en su propio archivo: cambian poco, así que tras
               un deploy de la app el navegador los sigue teniendo en caché.
               OJO: el test es solo para estos paquetes. Un "todo node_modules"
               metería en el arranque librerías que solo usan páginas que se
               cargan al entrar (gsap, qrcode, leaflet, jspdf…). */
            {
              name: 'react',
              test: /[\\/]node_modules[\\/](react|react-dom|react-router|react-router-dom|scheduler)[\\/]/,
            },
            /* Iconos y fechas: sin agrupar, cada icono o función de fecha
               salía en su propio archivo de 1 KB y una página pedía decenas.
               Juntos pesan poco y se cachean una vez para toda la app. */
            {
              name: 'iconos',
              test: /[\\/]node_modules[\\/]lucide-react[\\/]/,
            },
            {
              name: 'fechas',
              test: /[\\/]node_modules[\\/]date-fns[\\/]/,
            },
          ],
        },
      },
    },
  },
})
