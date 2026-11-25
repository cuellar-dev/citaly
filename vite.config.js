import process from 'node:process'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

/* En GitHub Pages la web vive en /citaly/ (lo pone el workflow). En local, en la raíz. */
const base = process.env.BASE_PATH || '/'

/* Dirección pública de la web, sin barra final: la usan index.html
   (%VITE_SITE_URL%: canónica, og:image…) y hooks/useMetaPagina.js. Las
   vistas previas al compartir necesitan URLs absolutas. Con dominio propio,
   cambiarla aquí o con la variable VITE_SITE_URL al hacer el build. */
process.env.VITE_SITE_URL ??= 'https://cuellar-dev.github.io/citaly'

/* Archivos que NO se guardan al instalar (el service worker los guarda la
   primera vez que se usan): pesan cientos de KB y casi nadie los necesita.
   Three.js (Sobre nosotros), jsPDF + html2canvas + canvg (PDF de Mi Negocio),
   DOMPurify (lo arrastra jsPDF) y Leaflet (mapa al crear un local). */
const PESADOS = [
  '**/EscenaTinta3D-*',
  '**/Nosotros-*',
  '**/jspdf*',
  '**/html2canvas*',
  '**/index.es-*',
  '**/purify*',
  '**/leaflet*',
  /* Pantallas de una sola vez (dar de alta el local, compartirlo con QR) y
     sus piezas: se usan poco y en Cuba los datos se pagan. */
  '**/NuevoLocal-*',
  '**/CompletarLocal-*',
  '**/CompartirNegocio-*',
  '**/Asistente-*',
  '**/MapaPin-*',
  '**/asistente-*',
  '**/index.esm-*',
  /* Los iconos del manifest ya los añade el plugin; icons.svg no se usa. */
  '**/*.png',
  '**/icons.svg',
]

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    /* PWA: la web se puede instalar y abre sin conexión. Guía completa en
       docs/pwa.md (qué se guarda, cómo se actualiza, cómo desactivarla). */
    VitePWA({
      /* 'prompt': una versión nueva NO se activa sola. Se enseña un aviso
         (AvisoActualizacion) y se aplica cuando la persona toca "Actualizar".
         Así nadie se queda a medias en una reserva por una recarga. */
      registerType: 'prompt',
      /* El registro lo hace la app (AvisoActualizacion), no un script suelto. */
      injectRegister: false,
      manifest: {
        id: base,
        name: 'Citaly',
        short_name: 'Citaly',
        description:
          'Descubre barberías, restaurantes, veterinarias y más cerca de ti y reserva tu turno o tu mesa.',
        lang: 'es',
        dir: 'ltr',
        start_url: base,
        scope: base,
        display: 'standalone',
        orientation: 'portrait',
        /* Mismos colores que el tema oscuro (por defecto) de index.css. */
        background_color: '#121413',
        theme_color: '#121413',
        categories: ['lifestyle', 'business'],
        icons: [
          { src: 'pwa-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: 'pwa-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          /* Con margen de seguridad: Android recorta el icono en círculo o en
             gota; sin esto se comería los bordes del dibujo. */
          { src: 'pwa-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        /* Lo que se guarda al instalar: la app entera menos lo pesado. */
        globPatterns: ['**/*.{js,css,html,svg,woff2,png}'],
        globIgnores: [...PESADOS, '**/404.html', '**/apple-touch-icon.png'],
        /* Sin conexión, cualquier ruta de la app abre index.html y React
           Router pinta la página que toque (también /local/:id). */
        navigateFallback: `${base}index.html`,
        /* Al actualizar, se borran las cachés de versiones viejas. */
        cleanupOutdatedCaches: true,
        runtimeCaching: [
          {
            /* Fotos de locales y perfiles. Hoy son de demo (Unsplash); mañana,
               nuestro CDN. Se piden con crossorigin, así que la respuesta es
               normal (status 200) y no "opaca": se puede guardar sin inflar
               la cuota. Las 60 últimas, 30 días. */
            urlPattern: ({ url }) =>
              /(^|\.)unsplash\.com$/.test(url.hostname) || /(^|\.)res\.cloudinary\.com$/.test(url.hostname),
            handler: 'CacheFirst',
            options: {
              cacheName: 'citaly-fotos',
              cacheableResponse: { statuses: [200] },
              expiration: { maxEntries: 60, maxAgeSeconds: 60 * 60 * 24 * 30, purgeOnQuotaError: true },
            },
          },
          {
            /* Lo pesado que no se guardó al instalar: se guarda al usarlo. Sus
               nombres llevan hash, así que no cambian sin cambiar de nombre. */
            urlPattern: ({ url, sameOrigin }) => sameOrigin && url.pathname.includes('/assets/'),
            handler: 'CacheFirst',
            options: {
              cacheName: 'citaly-trozos',
              cacheableResponse: { statuses: [200] },
              expiration: { maxEntries: 40, purgeOnQuotaError: true },
            },
          },
        ],
      },
      /* En `npm run dev` no hay service worker (se prueba con build + preview). */
      devOptions: { enabled: false },
    }),
  ],
  base,
  /* Solo las pruebas del front: backend-citaly-main tiene las suyas. */
  test: { include: ['src/**/*.test.{js,jsx}'] },
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
