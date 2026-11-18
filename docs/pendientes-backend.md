# Pendientes para cuando llegue el backend

Este documento recoge cambios de **rendimiento y buenas prácticas** que ya están pensados pero que **no se pueden terminar hoy** sin dejar la web sin datos. La web funciona con datos de demo (JSON + `localStorage`) y fotos de Unsplash, y tiene que seguir funcionando así hasta que el backend esté conectado.

Cada punto dice **qué hay hoy**, **qué hay que hacer** y **dónde se toca**. Está escrito para quien lo retome sin haber estado en la conversación.

Contexto: noviembre 2026, tras la ronda de mejoras de Lighthouse (rutas cargadas por demanda, fotos con tamaño justo, esqueletos, scroll infinito en Descubre, fuentes en WOFF2).

---

## Índice

1. [Fotos: pasar de Unsplash a nuestro CDN](#1-fotos-pasar-de-unsplash-a-nuestro-cdn)
2. [Descubre: feed paginado](#2-descubre-feed-paginado)
3. [Datos de demo que se van](#3-datos-de-demo-que-se-van)
4. [Hosting: salir de GitHub Pages (o configurarlo bien)](#4-hosting-salir-de-github-pages-o-configurarlo-bien)
5. [SEO con dominio propio](#5-seo-con-dominio-propio)
6. [Carga sin conexión (PWA / service worker)](#6-carga-sin-conexión-pwa--service-worker)
7. [Esqueletos y estados de carga con datos reales](#7-esqueletos-y-estados-de-carga-con-datos-reales)
8. [Precarga de páginas y ahorro de datos](#8-precarga-de-páginas-y-ahorro-de-datos)
9. [Cosas que se quedaron fuera a propósito](#9-cosas-que-se-quedaron-fuera-a-propósito)

---

## 1. Fotos: pasar de Unsplash a nuestro CDN

**Hoy.** Todas las fotos de locales y perfiles de la demo son URLs de Unsplash. Toda foto pasa por un solo sitio:

- `src/utils/fotos.js`: `fotoUrl()` y `fotoSrcSet()` saben pedirle a Unsplash otro tamaño (`?w=&h=&q=&auto=format`).
- `src/components/Foto/Foto.jsx`: el `<img>` de la app. Pone `srcset`/`sizes`, `loading`, `fetchpriority`, `crossorigin` y el esqueleto mientras carga.

**Hay que hacer** (cuando el backend sirva las fotos, por ejemplo desde Cloudinary):

1. En `src/utils/fotos.js`, dentro de `fotoUrl()`, añadir la rama del CDN. En Cloudinary los tamaños van en la ruta, no en la query: `.../image/upload/f_auto,q_auto,w_640,h_800,c_fill,g_auto/...`. `f_auto` da AVIF/WebP según el navegador; `g_auto` (o `g_face` para avatares) hace el recorte inteligente.
2. En `admiteTamanos()`, devolver `true` también para el host del CDN.
3. Comprobar que el CDN responde con `Access-Control-Allow-Origin: *` (Cloudinary lo hace por defecto). El host ya está en `HOSTS_CON_CORS`. **Si se usa otro CDN sin CORS, NO añadirlo a esa lista**: con `crossorigin` y sin CORS la foto no carga.
4. En `index.html`, cambiar el `<link rel="preconnect" href="https://images.unsplash.com" crossorigin>` por el origen del CDN.
5. Las fotos que sube el dueño hoy se guardan como `data:` en `localStorage` (`src/utils/imagenes.js` las comprime a 1280 px). Con backend se suben al servidor (que las firma hacia Cloudinary) y se guarda solo la URL. `comprimirFoto()` puede quedarse para no subir fotos de 4 MB.
6. Cuando ya no haya fotos de Unsplash, quitar `UNSPLASH` de `fotos.js`.

**Por qué importa.** Con Unsplash, Lighthouse marcaba "cookies de terceros" (−19 % en Buenas prácticas). Se arregló pidiendo las fotos con `crossorigin="anonymous"`, que hace que el navegador no mande ni guarde cookies. Con nuestro CDN el problema no debería existir, pero conviene medir.

**Tamaños usados** (para que el backend genere o cachee esas variantes si hace falta):

| Dónde | Componente | Anchos | Forma |
|---|---|---|---|
| Héroe de Descubre | `Descubre/HeroeLocal.jsx` | 420, 640 | 4:5 |
| Tarjeta de lugar | `TarjetaLocal/TarjetaLocal.jsx` | 400, 640 | 16:11 |
| Tarjeta compacta (rails) | `Descubre/TarjetaLocalCompacta.jsx` | 160, 320, 480 | 1:1 |
| Ficha del local (galería) | `DetalleLocal/HeroLocal.jsx` | 480, 720, 960 | 1:1 |
| Portada Mi Negocio | `Negocio/CabeceraNegocio.jsx` | 480, 720 | libre |
| Fondo cabecera Perfil | `Perfil/CabeceraPerfil.jsx` | 480 | 1:1, caras |
| Avatares | varios | 96–320 | 1:1, caras |

---

## 2. Descubre: feed paginado

**Hoy.** `construirDescubre()` (`src/utils/descubre.js`) arma TODO el feed en el navegador con todos los locales en memoria (`locales.json`, ~100 KB que van en el JS inicial). `src/pages/Descubre.jsx` solo **dosifica lo que pinta**: el héroe, el rail de abiertos y el primer bloque; el resto entra de dos en dos con `useScrollInfinito` (`src/hooks/useScrollInfinito.js`) cuando el centinela se acerca a la pantalla. El pie (la hoguera) solo se descarga cuando se acaba el feed.

**Hay que hacer.**

1. **Endpoint de feed paginado** (ver también `docs/descubre-implementacion.md`, sección 16): por ejemplo `GET /descubre?cursor=…&limite=…`, que devuelve `{ bloques: [...], siguiente: cursor | null }`. El orden y las estantas los decide el servidor (es donde está el ranking).
2. En `Descubre.jsx`: cambiar `bloques.slice(0, cuantosBloques)` por una lista que crece con cada respuesta. `mostrarMas` pasa a ser async (pide la página siguiente y la añade); `hayMas = siguiente !== null`.
3. Pasar `cargando` a `useScrollInfinito({ hayMas, cargando, alLlegar, clave })` mientras la petición está en vuelo, para no pedir dos veces la misma página. El hook ya lo soporta.
4. El centinela ya enseña `<ListaEsqueleto>` (tarjetas grises): con backend es lo que se verá mientras llega la página. No hace falta tocarlo.
5. Error de red al pedir más: enseñar un botón "Reintentar" en el sitio del centinela (hoy no existe porque no hay red de por medio).
6. Quitar `locales.json` del JS inicial. Hoy `getAllLocales()` es **síncrono**; con API será asíncrono. Las pantallas que lo llaman (Descubre, Búsqueda, Perfil, Favoritos…) tendrán que cargar con estado de "cargando". Es el cambio más grande de este documento.

---

## 3. Datos de demo que se van

| Qué | Dónde | Qué hacer |
|---|---|---|
| Siembra de citas y suscripciones de ejemplo | `src/main.jsx` (`seedCitasIfEmpty`, `sembrarDemoExtra`) | Borrar al conectar `/me/citas`. |
| Locales (`locales.json`, `localesDemo.js`) | `src/services/locales.js` | Pasar a `GET /locales/:id` y al feed paginado (punto 2). |
| Usuario fijo `u-laura-mendez` | `src/services/sesion.js` | Sale de la sesión real (`/me`). |
| Auth falsa | `src/services/auth.js` | Hay `TODO` con el sitio exacto. |

Los servicios de `src/services/` son la frontera: las pantallas no tocan `localStorage` directamente (con alguna excepción menor). Cambiando el cuerpo de esas funciones por llamadas a la API, la UI no debería enterarse, salvo por lo síncrono → asíncrono del punto 2.

---

## 4. Hosting: salir de GitHub Pages (o configurarlo bien)

**Hoy.** La web vive en GitHub Pages (`/citaly/`). Limitaciones medidas con Lighthouse:

- **No hay "SPA fallback".** Una ruta como `/citaly/citas` no existe como archivo; Pages sirve `404.html` (que es la app) pero con **estado 404**. Se parcheó en el deploy con `scripts/rutas-estaticas.mjs`, que escribe `citas.html`, `perfil.html`, etc. con estado 200 y, de paso, precarga los archivos de esa página. **Las rutas con `:id` (`/local/:id`, `/negocio/completar/:id`) siguen respondiendo 404** al entrar directo.
- **Caché de 10 minutos para todo**, incluidos los archivos con hash de `assets/`, que podrían cachearse un año.
- **Sin brotli** (solo gzip).
- El tiempo de respuesta del servidor variaba entre 0.3 y 1.4 s desde Cuba.

**Hay que hacer**, al pasar al servidor definitivo (el del backend, Cloudflare Pages, Netlify…):

1. Regla de SPA: cualquier ruta que no sea un archivo → `index.html` **con 200**.
2. Cabeceras:
   - `assets/*` → `Cache-Control: public, max-age=31536000, immutable` (llevan hash).
   - `index.html` y `*.html` → `Cache-Control: no-cache` (para que un deploy se vea al momento).
   - `fonts/*` → caché larga (el nombre lleva versión: `quicksand-v1.woff2`).
3. Compresión brotli.
4. Con SPA fallback, `scripts/rutas-estaticas.mjs` ya no hace falta para el estado 200. Su otra mitad (precargar los archivos de cada página en su HTML) se puede mantener si el servidor permite servir un HTML distinto por ruta; si no, se puede quitar.
5. `base` en `vite.config.js` vuelve a `/` si la web pasa a la raíz de un dominio (hoy lo pone el workflow con `BASE_PATH`).

---

## 5. SEO con dominio propio

**Hoy.** Hay `<meta name="description">`, `lang="es"` y `theme-color` en `index.html`, y un `public/robots.txt` (en Pages queda en `/citaly/robots.txt`, que los buscadores no miran: buscan `robots.txt` en la raíz del dominio).

**Hay que hacer** con dominio propio:

1. `robots.txt` en la raíz con `Sitemap: https://dominio/sitemap.xml`.
2. `sitemap.xml` generado por el backend con las fichas de locales (`/local/:id`): son las páginas que interesa que Google indexe.
3. Título y descripción por página. Hoy solo la ficha del local cambia `document.title`. Para que Google vea el nombre del local sin ejecutar JS haría falta **prerender** o SSR de `/local/:id` (por ejemplo, que el backend devuelva el HTML con `<title>` y `<meta>` ya rellenos y la app encima). Es opcional y solo merece la pena si el SEO de las fichas importa.
4. Etiquetas Open Graph (`og:title`, `og:image`…) para que los enlaces compartidos por WhatsApp salgan con foto. Necesitan URL absoluta de imagen, así que dependen del dominio y del CDN.

---

## 6. Carga sin conexión (PWA / service worker)

**Hoy.** No hay service worker ni manifest. Estaba en el plan ("punto 3") pero **no se ha hecho todavía**. El plan acordado:

- `vite-plugin-pwa` (≥ 2.0, compatible con Vite 8) en modo `generateSW`.
- Precachear el esqueleto de la app y los trozos de página. **No** precachear Three.js, jsPDF, html2canvas ni Leaflet (cientos de KB que la mayoría no usa); esos se cachean al usarse.
- Fotos: gracias a `crossorigin="anonymous"` (punto 1) las respuestas ya no son "opacas" y se pueden cachear sin disparar la cuota de almacenamiento. Límite de unas 60 fotos.
- Actualizaciones con aviso ("Hay una versión nueva · Actualizar"), no en silencio, para no recargar a nadie a mitad de una reserva.
- Aviso de "sin conexión". `navigator.onLine` miente con conexiones malas, así que con backend se combina con un ping a `/health` (ya existe en el backend).

**Lo que depende del backend:**
- Estrategia de caché de la API: `NetworkFirst` con timeout de 3–4 s para los GET; los POST nunca se cachean.
- Cola de acciones sin conexión (por ejemplo, una reserva hecha sin red que se envía al volver). Necesita que la API acepte reintentos sin duplicar: una clave de idempotencia por reserva.

---

## 7. Esqueletos y estados de carga con datos reales

**Hoy.** Hay esqueletos en tres sitios:

- `src/components/Foto/foto.css`: `.foto-marco` hace brillar el hueco de una foto mientras carga. Si la foto falla (sin red, 404), queda un tono plano en vez de un icono roto.
- `src/components/Esqueletos/Esqueletos.jsx`:
  - `TarjetaEsqueleto` y `ListaEsqueleto`, en el scroll infinito de Descubre.
  - `PaginaEsqueleto`, mientras baja el JS de una página (fallback del `Suspense` del layout).

**Hay que hacer** con backend:

1. Cada pantalla que pase a pedir datos (Mis citas, Mi negocio, Perfil, ficha del local) necesita su propio esqueleto **con la forma de su contenido** (mismas cajas y alturas, para que no salte nada al llegar). Usar la clase `.esqueleto` de `foto.css` para los bloques.
2. Un único mensaje de "Cargando…" para lectores de pantalla por zona (`role="status"`), como hace `ListaEsqueleto`.
3. Si se cambian las medidas de `TarjetaLocal`, actualizar `esqueletos.css` (hay un comentario avisándolo).

---

## 8. Precarga de páginas y ahorro de datos

**Hoy.** `src/paginas.js` centraliza la carga por demanda de cada página. Hay dos tipos de precarga:

- **Al apuntar o empezar a tocar** un enlace de la barra (`NavBar.jsx`): siempre.
- **En reposo**, tras cargar la página: la ficha del local y las tres pestañas. **Solo con buena conexión**: se salta si el navegador pide ahorro de datos o la conexión es 2G/3G. En Cuba los datos se pagan.

**Con backend:** se puede precargar también el **dato** más probable, por ejemplo la ficha de un local al apuntar su tarjeta. Si se hace, respetar la misma regla de ahorro de datos (`conexionHolgada()` en `paginas.js`).

---

## 9. Cosas que se quedaron fuera a propósito

- **`locales.json` en el JS inicial** (~100 KB sin comprimir). No se hizo asíncrono porque el backend lo reemplaza (punto 2); hacerlo ahora sería trabajo que se tira.
- **GSAP en el arranque** (~27 KB comprimido). Lo usan la barra de navegación y la cabecera, que se ven siempre. Quitarlo obligaría a rehacer esas animaciones en CSS; no merece el riesgo por ahora.
- **Textos de 10–11 px** (etiquetas de la barra, "abre a las…", comodidades en las tarjetas). Lighthouse los marca en Buenas prácticas ("font-size", poco peso: la nota queda en 96). Subirlos es una decisión de diseño, no de código.
- **Enlaces de tarjeta con `aria-label`** ("Ver Al Medio"): Lighthouse avisa de que el nombre accesible no incluye todo el texto visible (`label-content-name-mismatch`, peso 0 en la nota). La solución buena es el patrón "enlace estirado" (el enlace solo en el título y un `::after` que cubre la tarjeta). Afecta a `TarjetaLocal`, `TarjetaLocalCompacta`, `HeroeLocal` y `TarjetaFavorito`, con sus estilos de hover; queda para una ronda de accesibilidad.
- **Contraste en el tema claro.** Los arreglos de contraste se comprobaron en el tema oscuro (el que mide Lighthouse por defecto). El tema claro necesita su propia revisión: algunos grises con transparencia sobre el crema no llegan a 4.5:1.
- **Merchant Copy** (fuente de "Sobre nosotros"): su licencia es solo para uso personal y no comercial, y prohíbe modificarla. No se convirtió a WOFF2. Antes de lanzar: pedir licencia al autor o cambiarla por una monoespaciada libre (Courier Prime, Space Mono, IBM Plex Mono).
