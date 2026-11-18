# Citaly como PWA (instalable y sin conexión)

Qué hay montado, cómo se comporta y qué hacer si algo sale mal. Fase 1 hecha en noviembre de 2026; la Fase 2 depende del backend.

## Qué es

- **Manifest** (`manifest.webmanifest`, lo genera el build desde `vite.config.js`): nombre, iconos y colores. Con él, Android ofrece "Instalar Citaly" y la web se abre a pantalla completa con su icono. En iPhone se instala con Compartir → "Añadir a pantalla de inicio" (metas `apple-mobile-web-app-*` en `index.html`).
- **Service worker** (`sw.js`, generado por `vite-plugin-pwa` con Workbox): se pone entre la web y la red, guarda archivos en el teléfono y los sirve desde ahí. Gracias a él la app abre sin conexión y las visitas siguientes son casi instantáneas.

## Qué se guarda

| Qué | Cuándo | Dónde se decide |
|---|---|---|
| La app: JS, CSS, HTML, fuentes, SVG de Taly, iconos | Al instalar (unos 540 KB; buena parte ya bajó en la primera visita) | `workbox.globPatterns` |
| Lo pesado o poco usado: Three.js, jsPDF, Leaflet, alta de local, QR | La primera vez que se usa | `PESADOS` en `vite.config.js` + caché `citaly-trozos` |
| Fotos de locales y perfiles | Al verlas; las 60 últimas, 30 días | caché `citaly-fotos` |
| Datos (citas, favoritos…) | Hoy viven en `localStorage`: ya funcionan sin red | — |

Sin conexión, cualquier ruta (también `/local/:id`) abre `index.html` desde la caché y React Router pinta la página.

## Cómo se actualiza

`registerType: 'prompt'`: tras un deploy, el service worker nuevo se descarga en segundo plano pero **no se activa solo**. `src/components/AvisosApp/AvisosApp.jsx` enseña "Hay una versión nueva de Citaly · Actualizar":

- **Actualizar**: activa la versión nueva y recarga.
- **X (luego)**: sigue con la versión actual. La nueva entra la próxima vez que se abra la app con todas las pestañas cerradas.

Con la app abierta, se pregunta al servidor una vez por hora. Nunca se recarga sin avisar: alguien puede estar a mitad de una reserva. Las cachés de versiones viejas se borran solas (`cleanupOutdatedCaches`).

## Aviso de sin conexión

`AvisosApp` + `src/hooks/useEnLinea.js`: al perder la red sale "Sin conexión · lo que ya viste sigue aquí"; al volver, "Conexión recuperada" un par de segundos. Usa `navigator.onLine`, que solo sabe si hay red, no si hay internet (ver Fase 2).

## Cómo probarlo

El service worker **no existe en `npm run dev`**. Hay que usar el build:

```bash
npm run build
```
```bash
npm run preview
```

En Chrome, DevTools → Application:
- **Manifest**: iconos y datos.
- **Service workers**: debe estar "activated".
- Network → **Offline**: navegar entre pestañas y recargar una ruta.

En el móvil: instalarla, abrirla en modo avión y navegar.

> El navegador integrado del escritorio de Claude no permite service workers. Para probar, usar Chrome.

## Si algo sale mal (desactivar la PWA)

Si un deploy deja a la gente atascada en una versión rota, **no basta con borrar el plugin**: los teléfonos que ya lo tienen seguirían usando el service worker viejo. Hay que publicar uno que se desinstale solo:

1. En `vite.config.js`, dentro de `VitePWA({ ... })`, añadir `selfDestroying: true`.
2. Hacer deploy. Cada teléfono, al abrir la web, borra sus cachés y se desregistra.
3. Cuando esté arreglado, quitar `selfDestroying` y volver a desplegar.

## Fase 2 (con backend)

- **Datos de la API**: `NetworkFirst` con 3–4 s de espera para los GET. Si la red no responde, se muestra lo último guardado con un "Mostrando datos de hace X". Los POST nunca se cachean.
- **Conexión real**: combinar `navigator.onLine` con un ping a `/health` (ya existe en el backend), porque con conexiones malas el navegador dice "conectado" sin internet.
- **Acciones sin conexión** (reservar, cancelar, confirmar): cola en IndexedDB y envío al volver (Background Sync donde exista; si no, al recuperar la red). El backend tiene que aceptar una **clave de idempotencia** por acción para no duplicar reservas si se reintenta.
- **Qué no se puede hacer sin red**: el aviso de `AvisosApp` debería decirlo, por ejemplo deshabilitando "Reservar" con un texto claro.
- **Fotos del CDN**: ya están contempladas en la regla `citaly-fotos` (`res.cloudinary.com`). Si el CDN es otro, añadir su host ahí y en `src/utils/fotos.js`.
- **Hosting**: `sw.js` y `index.html` deben servirse con `Cache-Control: no-cache`; si no, las actualizaciones tardan en llegar.
