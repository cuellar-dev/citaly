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
10. [Mover la hora de una cita (el local propone otra hora)](#mover-la-hora-de-una-cita-el-local-propone-otra-hora)

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
| Citas del cliente (Mis citas) | `src/services/misCitas.js`, `misCitasApi.js`, `hooks/useMisCitas.js` | Ya listo: con `VITE_API_URL` lee del backend. Faltan rutas y campos: `docs/backend-mis-citas.md`. |
| Locales (`locales.json`, `localesDemo.js`) | `src/services/locales.js` | Pasar a `GET /locales/:id` y al feed paginado (punto 2). |
| Usuario fijo `u-laura-mendez` | `src/services/sesion.js` | Perfil, entrar y registrarse ya usan la sesión real con `VITE_API_URL` (`docs/backend-auth-cambios.md`). Siguen con Laura Mi negocio, opiniones y socios. |
| Auth | `src/services/auth.js` | Ya conectada a Better Auth. Lo que falta configurar en el servidor: `docs/backend-auth-cambios.md`, sección «Guía para el backend». |

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

**Hoy.** La Fase 1 está hecha: la app se instala, abre sin conexión, guarda las fotos que se ven y avisa de versiones nuevas y de la falta de red. Todo está en `docs/pwa.md`.

**Hay que hacer** con backend: la "Fase 2" de `docs/pwa.md`:
- caché de la API;
- ping a `/health`;
- cola de acciones sin conexión, con clave de idempotencia en el backend;
- cabeceras `no-cache` para `sw.js` e `index.html`.

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

## Plano de la sala (editor de mesas)

Hoy el plano se guarda en el navegador (ficha del local). Para el backend:

- `PUT /api/local/:id/plano` y `GET` dentro del local: guardar el JSON del plano tal cual (`version`, `tamano`, `forma`, `pisos`, `piezas`, `juntas`). Validar en el servidor con las mismas reglas que `src/plano/modelo.js` (`validarPlano`): lista blanca de tipos, enteros acotados, textos limpios, límites (3 pisos, 150 piezas, 80 mesas, 40 juntas).
- Tabla `mesas`: añadir `cap_min`, `cap_normal`, `cap_max` (nullable), `online`, `rasgos`, `piso`. Los ids de mesa no cambian (m-1…m-7 en los locales viejos).
- Juntas: `{id, mesas: [ids], cap}`. Cuentan como una sola reserva para el precio.
- Reservas: guardar `mesaIds` (una o varias mesas).
- `GET /api/local/:id/mesas-ocupadas?fecha&hora`: ids ocupados, para pintar el mapa y marcar horas completas.
- No borrar una mesa con reservas futuras (el front ya lo bloquea; el servidor también debería).

## «Avísame cuando abra» (ficha del local)

**Hoy (24-11-2026).** En la ficha de un local cerrado hay un botón «Avísame cuando abra» junto al chip de Cerrado (`src/components/DetalleLocal/BotonAvisoApertura.jsx`). Solo funciona en el front: `src/services/avisosApertura.js` guarda en `localStorage` (`citaly_avisos_apertura`) el local y la próxima hora de apertura (`proximaAperturaFecha()` en `src/utils/descubre.js`). Cuando llega esa hora, `notisApertura()` mete un aviso de tipo `abre` en `getNotificaciones()` (Notificaciones y campana). Solo en ese navegador, y no llega como push.

**Con backend:**

- Tabla `avisos_apertura`: `usuario_id`, `local_id`, `abre_en` (timestamptz, la próxima apertura calculada en el servidor con el horario del local), `creado_en`, `enviado_en` (nullable). Único por (`usuario_id`, `local_id`) mientras no se haya enviado. Requiere sesión.
- `POST /api/locales/:id/aviso-apertura` (apuntarse), `DELETE` (quitarse) y `GET` (¿estoy apuntado?), o devolver `avisoApertura: true` dentro de la ficha.
- Una tarea cada minuto (o la misma que manda los recordatorios) que coja las filas con `abre_en <= now()` y `enviado_en IS NULL`, cree una notificación normal (`tipo = 'abre_local'`, enlace al local) y marque `enviado_en`. Si el dueño cambia el horario antes, recalcular `abre_en`.
- En el front: `adaptarNoti()` de `src/services/notificaciones.js` traduce `abre_local` → `abre`, y el cuerpo de `avisosApertura.js` pasa a llamar a la API (la pantalla no cambia). Quitar `notisApertura()` de `getNotificaciones()` cuando venga del servidor.

## Protección contra bots (captcha y límites de ritmo)

**Hoy (24-11-2026).** El registro ya tiene honeypot en el front (ver «Honeypot ya puesto en el registro» más abajo). No hay captcha. El servidor tiene el límite de intentos de Better Auth, que solo cubre las rutas de auth y está activo solo en producción (o con `AUTH_RATE_LIMIT=true`). Se guarda en memoria, así que vale con un solo servidor. El resto de endpoints no tiene límite propio (ver `docs/revision-backend.md` y `docs/backend-descubre-cambios.md`). Reservar cita ya exige sesión, lo que filtra a la mayoría de bots.

**Qué se quiere evitar:** registros falsos que llenan la base de datos, abuso de los emails (recuperar contraseña y verificación hacia correos ajenos, que dañan la reputación del dominio), fuerza bruta con contraseñas filtradas y spam en opiniones.

**Con backend, por orden de prioridad:**

1. **Límite de ritmo en todos los endpoints de escritura** (`express-rate-limit`, que no está instalado): por IP y, cuando haya sesión, por usuario. Incluye `POST /eventos` de Descubre, opiniones, avisos de apertura y crear cita. Con más de un servidor, o si el hosting reinicia a menudo, mover el contador de Better Auth a `rateLimit.storage: 'database'` o a Redis.
2. **Cloudflare Turnstile** en tres sitios: registro, recuperar contraseña y, si aparece spam, opiniones. No ponerlo en login (lo cubre el límite de intentos) ni en reservar cita (ya exige sesión y estorbaría a gente real).
   - **Servidor:** Better Auth trae el plugin `captcha` con proveedor `cloudflare-turnstile`. Se configura con la clave secreta (`TURNSTILE_SECRET_KEY`) y la lista de rutas protegidas (`/sign-up/email`, `/request-password-reset`, y el reenvío de verificación si se expone). El plugin lee el token de la cabecera `x-captcha-response` y lo comprueba contra Cloudflare. Para las rutas que no son de Better Auth (opiniones), verificar el token a mano con `POST https://challenges.cloudflare.com/turnstile/v0/siteverify`.
   - **Claves:** la clave del sitio (pública) va en el front como `VITE_TURNSTILE_SITE_KEY`; la secreta, solo en el servidor. Cloudflare da claves de prueba que siempre aprueban o siempre fallan, para usarlas en local.
   - **Modo del widget:** elegir «Managed». Todos los usuarios cargan el script y pasan una comprobación silenciosa en segundo plano. La casilla solo se muestra a quien parece sospechoso. La mayoría no ve nada.
3. **Honeypot** en los formularios (campo oculto que un humano no rellena; si llega con valor, el servidor responde con éxito falso y no hace nada). Es invisible y no cuesta nada.

**Pendiente en el front (esta parte sí es de este repo):** montar el widget en `Registro` y `Recuperar contraseña`, guardar el token y mandarlo en la cabecera `x-captcha-response` desde `src/services/auth.js`. Un token solo vale una vez: renovarlo si el servidor rechaza el envío. Si el script de Cloudflare no carga (sin red, bloqueador), enseñar un mensaje claro en vez de dejar el botón muerto.

**A medir antes de lanzar (público en Cuba):** el script de Turnstile se pide a `challenges.cloudflare.com`. Hay que comprobar que carga bien con las conexiones y las VPN que usa la gente allí, y que quien entra por una IP compartida o un VPN no se queda atascado en el reto. Si da problemas, dejar solo el límite de ritmo y el honeypot, y retirar el captcha.

**Honeypot ya puesto en el registro (24-11-2026) — para el backend: vigilarlo.**

*Qué hay.* En `src/pages/Auth.jsx` (modo `registro`) hay un campo invisible `sitio_web`, con estilos en `.auth-miel` de `src/pages/auth.css`. Si llega con algo escrito, el front **no llama al servidor**: espera 0,9 s, enseña la pantalla «Revisa tu correo» como si todo hubiera ido bien y no ofrece «Mandar el enlace otra vez» (para que un bot no pueda disparar correos desde ahí).

*Cuidados que lleva:* fuera de pantalla con `position:absolute; left:-9999px` (no `display:none`), `tabindex="-1"`, `aria-hidden="true"`, `autocomplete="off"`, y éxito falso para que el bot no sepa que lo pillamos.

*Qué NO cubre (importante):* solo frena a bots que rellenan el formulario de la web. Un bot que llame directo a `POST /api/auth/sign-up/email` ni ve el formulario. Para eso siguen haciendo falta el límite de ritmo y el captcha de arriba. **El servidor no se entera de nada**: cuando la trampa salta, la petición no llega.

*Qué vigilar:*

1. **Falsos positivos.** Si un gestor de contraseñas o el autorrelleno del navegador rellena el campo, una persona real se queda con un «Revisa tu correo» que nunca llega y sin cuenta. Señales: quejas de «me registré y no me llegó el correo», o que los registros caigan de golpe tras un cambio. Probar a mano el registro con el autorrelleno de Chrome, Safari y Firefox y con un gestor (Bitwarden, 1Password) antes de lanzar. Si algún navegador lo rellena, cambiar el `name` de `sitio_web` por otro que no suene a dato personal.
2. **No hay rastro.** Cuando salta, no queda ni un log. Si se quiere medir cuántos bots caen, el front tendría que avisar al servidor (un contador anónimo en un endpoint, con límite de ritmo). Hoy no está hecho.
3. **Los bots aprenden.** Si un día los registros falsos vuelven a subir con la trampa puesta, es que ya saben saltársela: pasar al captcha (Turnstile).
4. **No se ha puesto** en recuperar contraseña, opiniones ni login. Si se amplía, copiar el mismo patrón y repetir los puntos de arriba.

## Mover la hora de una cita (el local propone otra hora)

**Hoy (25-11-2026).** En Mi Negocio, cada cita **pendiente** tiene tres botones: ✕ rechazar, ✓ aceptar y uno de reloj, «Proponer otra hora». El reloj abre dentro de la fila las horas libres de ese día (y «Otro día» para los próximos 7 días abiertos). El dueño elige una hora y pulsa «Proponer». La cita pasa a un estado nuevo, **4 = hora propuesta**, y espera la respuesta del cliente. Mientras espera, el dueño puede avisarle por WhatsApp con un mensaje ya escrito o **retirar la propuesta**: la cita vuelve a pendiente y el dueño tiene de nuevo sus 15 minutos para contestar.

El cliente ve en Mis citas la hora vieja tachada, la nueva y tres botones:

- **Me vale**: la cita pasa directamente a **confirmada (2)** a la hora nueva. No hace falta el paso de «Voy pa allá», porque los dos ya han dicho que sí. Se guarda la hora anterior y la tarjeta dice «Confirmaste la hora nueva (antes 3:00 PM)».
- **Busco otra hora**: se cancela esta cita (`cancelada_por = 'cliente'`) y se abre la reserva del mismo local en el día propuesto, con los mismos servicios marcados (`?fecha=yyyy-MM-dd&servicio=…`). Al dueño le llega como una reserva pendiente nueva. **Se decidió no dejar que el cliente contraproponga una hora**, para evitar idas y vueltas con dos horas bloqueadas a la vez.
- **Cancelar**: como siempre.

**Plazo del cliente:** hasta **1 hora antes de la hora nueva**. Si la hora nueva está muy cerca, al menos 30 minutos desde que se propuso, sin pasarse nunca de la propia hora nueva. Si no contesta, la cita se cancela sola con `cancelada_por = 'sinRespuesta'` («No contestaste a la hora nueva»). La regla está en `venceLaPropuesta()` de `src/utils/estadosCita.js`, con pruebas en `estadosCita.test.js`.

**Notificación nueva** (`tipo: 'nuevaHora'`, mostaza): «Sara cambió la hora de tu cita. De las 3:00 PM a las 4:30 PM. ¿Te sirve?», con la cuenta atrás hasta que vence y el botón «Ver la nueva hora». Al dueño le llega `aceptoHora` (verde) cuando el cliente acepta.

**Solo en la demo (sin backend):** la agenda del dueño y las citas del cliente son datos distintos. `src/services/propuestasDemo.js` copia la cita propuesta a las citas de este navegador (`citaly_citas`, con id `neg-<local>-<cita>`) para poder probar el camino entero, y `notisPropuestas()` saca de ahí el aviso. **Con backend no se usa:** la cita es la misma fila para los dos y el aviso lo crea el servidor. El estado de la agenda del dueño en la demo vive solo en memoria y se pierde al recargar, igual que aceptar y rechazar.

### Lo que tiene que hacer el backend

1. **Tabla `citas`**, columnas nuevas (todas nullable):
   - `propuesta_fecha` (date), `propuesta_horario` (time), `propuesta_en` (timestamptz), `propuesta_vence` (timestamptz, calculada en el servidor con la regla de arriba).
   - `hora_anterior_fecha`, `hora_anterior_horario`: se rellenan al aceptar, para el historial y para explicarlo en la tarjeta.
   - `pendiente_desde` (timestamptz): cuándo vuelve a correr el reloj de 15 minutos del dueño después de retirar una propuesta. Sin esta columna, la cita caducaría nada más retirarla si se creó hace más de 15 minutos.
   - `estado_reserva` admite **4**. Si hay un `CHECK (estado_reserva BETWEEN 0 AND 3)`, ampliarlo a 4.
   - `cancelada_por` admite `'sinRespuesta'`.
2. **Rutas** (el front ya las llama: `src/services/citasNegocio.js` y `src/services/misCitasApi.js`):
   - `PATCH /api/citas/:id/local/:localId/proponer-hora` con `{ fecha, horario }`. Solo el dueño del local y solo si la cita está en **0 (pendiente)**. Comprobar que el local abre ese día, que la hora está dentro del turno y en el intervalo del local, que es futura y que **está libre** (ver punto 4). Pone `estado_reserva = 4`, `propuesta_*`, y crea la notificación `hora_propuesta` para el cliente.
   - `DELETE /api/citas/:id/local/:localId/proponer-hora`. Retirar: solo si sigue en 4. Vuelve a 0, borra `propuesta_*` y pone `pendiente_desde = now()`.
   - `PATCH /api/citas/:id/usuario/aceptar-hora`. Solo el cliente de la cita, solo en 4 y antes de `propuesta_vence`. En una transacción: comprobar otra vez que la hora sigue libre, mover `fecha/horario` a la propuesta, guardar `hora_anterior_*`, `estado_reserva = 2`, `confirmada_en = now()`, limpiar `propuesta_*` y crear la notificación `propuesta_aceptada` para el dueño.
   - Cancelar (`/usuario/cancelar`) tiene que aceptar también el estado 4 y avisar al dueño (`propuesta_cancelada`, o la `cancelada` de siempre).
3. **Caducidad:** la misma tarea que cancela las pendientes a los 15 minutos tiene que cancelar las de estado 4 con `propuesta_vence <= now()` (`cancelada_por = 'sinRespuesta'`) y avisar a los dos. El front ya lo pinta así aunque el servidor tarde, pero no lo guarda.
4. **Hueco reservado:** mientras la cita está en 4, la **hora propuesta cuenta como ocupada**. Hay que tenerlo en cuenta en `horas-ocupadas` (la reserva de otros clientes) y en la validación al crear una cita. Si no, otro cliente puede quedarse esa hora y el «Me vale» fallaría. La hora original también sigue ocupada hasta que el cliente conteste. Se libera al aceptar (queda solo la nueva), al cancelar o al caducar. En locales de mesas, «ocupada» significa que no queda mesa para ese grupo, igual que hoy.
5. **Carrera entre dos clientes:** proteger con una restricción única parcial o con `SELECT … FOR UPDATE` sobre (local, fecha, horario). Si al aceptar la hora ya no está libre, devolver **409** con un mensaje claro. El front deshace el cambio y muestra el error.
6. **Notificaciones**, tipos nuevos en la tabla, que `adaptarNoti()` ya traduce:
   - `hora_propuesta` (cliente): incluir `cita_estado` y `propuesta_vence` en la fila para pintar la cuenta atrás. Título sugerido: «‹Local› cambió la hora de tu cita»; cuerpo: «De las 3:00 PM a las 4:30 PM. ¿Te sirve?».
   - `propuesta_aceptada` (dueño, ámbito negocio): «‹Cliente› aceptó la hora nueva».
   - `propuesta_cancelada` (dueño): cuando el cliente cancela o pulsa «Busco otra hora» sobre una propuesta.
   - Si hay push, `hora_propuesta` es la que más lo merece: tiene plazo.
7. **Lista de citas:** `GET /api/citas/local/:localId` y `GET /api/citas/usuario/me` tienen que devolver `propuesta_fecha`, `propuesta_horario`, `propuesta_en`, `propuesta_vence`, `hora_anterior_fecha` y `hora_anterior_horario`. `camposDeHoraMovida()` (`src/services/citasNegocio.js`) ya los lee.

### Lo que sugiero añadir después

- **Un motivo corto** al proponer («se me fue la luz», «estoy con otro cliente»), que viaje en la notificación. Ayuda a que el cliente no lo vea como un capricho.
- **Límite de propuestas por cita.** Si el dueño retira y vuelve a proponer varias veces, el cliente recibe varios avisos. Se podría limitar a 2 por cita o guardar las propuestas en una tabla `citas_propuestas` para tener historial.
- **Mover también citas ya aceptadas** (estado 1 o 2), por ejemplo cuando el local cierra de golpe. El aviso `cierre` de la demo ya habla de una cita «movida al viernes». Usaría el mismo estado 4, pero si el cliente no contesta habría que decidir si se cancela o se queda en la hora vieja. Hoy solo se mueven las pendientes.
- **Métrica para el dueño:** cuántas propuestas se aceptan y cuántas no. Si casi nunca se aceptan, que el local revise su horario publicado.
- **La hora propuesta visible en la agenda del dueño**, como una fila fantasma en la hora nueva. Hoy solo aparece en la fila original («Propuesta: 4:30 PM») y como hora ocupada en el selector.
