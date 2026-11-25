# Análisis del frontend de Citaly — 25-11-2026 (revisado)

Segunda versión. La primera mezclaba cosas medidas con puntos copiados de `docs/pendientes-backend.md` sin comprobar, y leía mal el rendimiento. Esta vez cada punto está comprobado en el código (búsquedas en `src/`, `eslint`, `vitest`); lo que no se pudo comprobar lo dice.

**Fuera de este análisis:** la conexión con el backend (ya se sabe que está floja) y los apartados nuevos de la ficha (al final, sin cambios).

---

## Resumen (sin contar el backend)

| Aspecto | Hoy |
|---|---|
| Pantallas y flujos | **93 %** |
| Diseño y marca | **92 %** |
| Estados de carga y error | **85 %** |
| Accesibilidad | **88 %** |
| Rendimiento | **~80 %** (sin medir bien todavía) |
| Código y pruebas | **68 %** (era 60) |
| SEO y enlaces compartidos | **95 %** (era 55) |
| Seguridad del front | **75 %** |
| Legal y licencias | **80 %** |
| Listo para producción | **60 %** (era 55) |

**Total sin backend: ~84 %** (era 79).

### Avance

| Fecha | Hecho | Total |
|---|---|---|
| 25-11 | 1.1–1.4: fechas de apertura, lint, Vitest solo en `src/`, fuera `anime`. Lint limpio, 38/38 tests. | 79 → 80 % |
| 25-11 | 1.7: lo pendiente, en 5 commits por tema. | 80 % |
| 25-11 | 3.1 + 3.2: metadatos completos (Open Graph, X, canónica, robots, JSON-LD), imagen para compartir, título por ruta, ficha con sus datos de negocio, sitemap y robots.txt en el deploy. `package-lock.json` al día (el deploy con `npm ci` iba a fallar). | 80 → 84 % |

**Siguiente:** 4.2 + 4.1 (enlace estirado en tarjetas y textos de 10 px).

 Las pantallas y el diseño están prácticamente terminados. Lo que queda son arreglos puntuales y la parte de «producto serio»: pruebas, enlaces que se ven bien en WhatsApp y saber cuándo algo falla.

---

## Lo que ya está resuelto (la primera versión lo daba como pendiente)

- **Respuesta del dueño y reportar opiniones**: existen en `components/Negocio/modales/ContenidoFichaLocal.jsx` (responder, pastilla «Dueño», botón reportar).
- **Esqueletos por pantalla**: Descubre, ficha, Mi Negocio, Mis citas, Perfil, reservar cita, completar local y compartir los usan.
- **«Reintentar»**: está en Mis citas, `ErrorPagina` y `RequiereSesion`.
- **Plano accesible**: `src/plano/` tiene ~94 atributos `aria`/`role`.
- **Nada de `dangerouslySetInnerHTML`** en todo `src/`: los textos de usuarios no pueden inyectar HTML.
- **Rendimiento real de la app**: TBT 50 ms y CLS 0 en Lighthouse. El JS no está bloqueando.

---

## Lo que hay que corregir, punto por punto

### 1. Código y pruebas — 66 %

✅ 1.1–1.4 hechos el 25-11 (las dos funciones de `descubre.js` usaban `startOfToday`: `proximaAperturaFecha` y `estadoApertura`).

| # | Problema (comprobado) | Arreglo |
|---|---|---|
| 1.1 | 2 tests fallan en `src/utils/horarios.test.js`. Es un fallo real: `proximaAperturaFecha()` usa `startOfToday()` en vez del día de `ahora` (`src/utils/descubre.js:42`). | `const hoy = startOfDay(ahora)` (importar `startOfDay` de date-fns). |
| 1.2 | Error de lint: `process` no definido en `src/utils/ranking/descubreReal.test.js:11`. | `/* global process */` arriba, o leer la variable con `import.meta.env`. |
| 1.3 | `vitest` ejecuta también las pruebas de `backend-citaly-main/` (una falla al importar). No hay bloque `test` en `vite.config.js`. | Añadir `test: { include: ['src/**/*.test.js'] }`. |
| 1.4 | El paquete `anime` (0.1.2) está instalado y no se importa en ningún sitio. | `pnpm remove anime`. |
| 1.5 | Solo 4 archivos de prueba. Las reglas que más duelen si fallan no tienen test: estados de cita y vencimiento de 15 min, ocupación por hora de inicio, mesas por capacidad, juntas, `validarPlano`. | Un archivo de test por regla; son funciones puras, se prueban rápido. |
| 1.6 | Archivos de +800 líneas: `CompletarLocal.jsx` 989, `ContenidoSocios.jsx` 957, `MiNegocio.jsx` 937, `ContenidoModalNegocio.jsx` 914, `EditorPlano.jsx` 890, `NuevoLocal.jsx` 822. | Partir por pasos o secciones cuando toque tocarlos, no de golpe. |
| 1.7 | ✅ Hecho: 5 commits por tema. | Commits pequeños por tema antes de seguir. |
| 1.8 | Sin integración continua. | Una GitHub Action con `lint` + `test` + `build` en cada push (ya existe `pages.yml`, se puede añadir el paso). |

1.1–1.4 son media hora y dejan todo en verde.

### 2. Rendimiento — ~80 % (sin medir bien)

El 56–61 de Lighthouse **no vale**: el despliegue medido tenía `VITE_API_URL` sin backend detrás, y Descubre espera hasta 10 s (`ESPERA_MS` en `src/services/api.js:18`) antes de caer a la demo (`src/pages/Descubre.jsx:76-87`).

Aun así hay una mejora real que sirve también con backend:

| # | Problema | Arreglo |
|---|---|---|
| 2.1 | Mientras el backend responde, Descubre solo enseña esqueletos. En Cuba, con el servidor lento, la portada tarda lo que tarde la red. | Guardar el último feed recibido y pintarlo al instante; pedir el nuevo detrás y cambiarlo al llegar (patrón «lo viejo primero, lo nuevo después»). La primera visita sigue con esqueletos; las siguientes son inmediatas. |
| 2.2 | 10 s es mucho para la portada. | Espera más corta solo para el feed (unos 4 s) antes de usar la copia guardada o la demo. |
| 2.3 | No hay medida fiable. | Volver a pasar Lighthouse con un build **sin** `VITE_API_URL` (demo pura) para tener la cifra del front solo, y otra con backend real cuando esté desplegado. |

### 3. SEO y enlaces compartidos — 95 %

✅ 3.1 y 3.2 hechos el 25-11. Lo que queda (5 %) no es del front: que el servidor devuelva `/local/:id` con su título y su foto ya en el HTML (WhatsApp no ejecuta JS, así que hoy una ficha compartida sale con la imagen de Citaly), y un dominio propio para que `robots.txt` y el sitemap estén en la raíz.

| # | Problema (comprobado) | Arreglo |
|---|---|---|
| 3.1 | `index.html` no tiene ninguna etiqueta Open Graph. Un enlace de Citaly en WhatsApp sale sin foto ni título bonito. | Mínimo ya: `og:title`, `og:description`, `og:image` (una imagen de marca 1200×630) y `twitter:card` en `index.html`. Por local (foto y nombre del local) hace falta que el servidor rellene el HTML de `/local/:id`; eso va con el backend. |
| 3.2 | Solo `DetalleLocal` y `Legal` cambian `document.title`. Las pestañas del navegador y el historial dicen siempre lo mismo. | Hook `useTituloPagina('Mis citas · Citaly')` y llamarlo en cada página. |

### 4. Accesibilidad — 88 %

| # | Problema (comprobado) | Arreglo |
|---|---|---|
| 4.1 | 79 reglas con `font-size` de 10 u 11 px (26 de 10 px, 53 de 11 px). | Pasar las de 10 px a 11–12 px. Las de 11 px que se leen (no las decorativas), a 12 px. Revisar las 26 primero. |
| 4.2 | Las tarjetas llevan `aria-label="Ver {nombre}"` en el enlace que tapa toda la tarjeta: `TarjetaLocal`, `TarjetaLocalCompacta`, `HeroeLocal`, `CarruselHeroe`, `TarjetaFavorito`. El lector solo dice «Ver X» y se salta el resto. | Enlace estirado: el `<Link>` solo en el nombre, con `::after { inset: 0 }` cubriendo la tarjeta. Mismo aspecto, se lee todo. |
| 4.3 | **No comprobado:** contraste del tema claro (`[data-tema='claro']` en `src/index.css`). | Una pasada con el selector de color de DevTools en el tema claro, pantalla por pantalla. |
| 4.4 | **No comprobado:** lector de pantalla real. | Una tarde con TalkBack: Descubre → ficha → reservar → Mis citas. |

### 5. Seguridad del front — 75 %

| # | Problema (comprobado) | Arreglo |
|---|---|---|
| 5.1 | Honeypot solo en el registro (`src/pages/Auth.jsx`). | Copiar el mismo patrón en opiniones y en `FormContacto` de Ayuda. |
| 5.2 | No hay Turnstile en ningún sitio. | Montarlo en registro y recuperar contraseña cuando el backend tenga el plugin (`pendientes-backend.md` explica cómo). Probar antes con VPN desde Cuba. |

### 6. Legal y licencias — 80 %

| # | Problema (comprobado) | Arreglo |
|---|---|---|
| 6.1 | La fuente Merchant Copy se sigue cargando como TTF (`src/index.css:28-29`) y se usa en Nosotros. Su licencia es solo para uso personal. Si ya tenéis permiso del autor, tachad este punto. | Pedir la licencia, o cambiarla por Courier Prime / Space Mono / IBM Plex Mono (libres, y de paso en WOFF2). |

### 7. Listo para producción — 60 %

✅ `package-lock.json` sincronizado: tenía `anime` y le faltaba `vitest`, y el workflow usa `npm ci`, que falla si el lock no coincide. Ojo: hay dos locks (`pnpm-lock.yaml` y `package-lock.json`). Elegir uno y que el workflow use el mismo gestor.

| # | Problema (comprobado) | Arreglo |
|---|---|---|
| 7.1 | No hay captura de errores: si algo explota en el móvil de un cliente, no os enteráis. | Desde `ErrorPagina` y `window.addEventListener('error' / 'unhandledrejection')`, mandar el error a Sentry (plan gratis) o a un `POST /api/errores` propio. |
| 7.2 | `vite.config.js` ya tiene `navigateFallback` para el service worker, pero la primera visita a `/local/:id` en GitHub Pages depende del hosting. | Al pasar al hosting definitivo: regla de SPA con 200, caché larga en `assets/`, brotli (`pendientes-backend.md` §4). |

### 8. Pantallas y flujos — 93 %

| # | Lo que falta | Comentario |
|---|---|---|
| 8.1 | Carta / menú para locales de mesas. | Comprobado: no existe. Es lo más visible que le falta a un restaurante. Ver apartados abajo. |
| 8.2 | Reprogramar una cita. | No existe; solo se menciona en Ayuda. Si fue decisión (cancelar y reservar otra), está bien para V1. |
| 8.3 | `docs/paginas.txt` está parado desde el 31-08. | Actualizarlo o borrarlo para que no despiste a nadie (a mí incluido). |

### 9. Diseño y marca — 92 %

Sin problemas comprobados más allá de 4.1 (tamaños) y 4.3 (contraste del claro, sin comprobar).

---

## Orden sugerido

1. ~~**Hoy, media hora:** 1.1, 1.2, 1.3, 1.4. Todo en verde.~~ Hecho.
2. **Commits** de lo pendiente (1.7).
3. **Rápidos y visibles:** ~~3.1, 3.2~~ hechos; 4.2 (enlace estirado), 4.1 (las 26 de 10 px).
4. **Portada instantánea:** 2.1 y 2.2, y medir de nuevo (2.3).
5. **Antes de lanzar:** 6.1, 7.1, 5.1, 4.3, 4.4, 1.5, 1.8.
6. **Producto:** 8.1 (carta) y los apartados de abajo.

---

## Sobre borrar opiniones

Ya tenéis responder y reportar, que es justo lo que hace Google Maps (el dueño no borra). Para cerrar el tema:
- Una opinión por usuario y local; si vuelve a opinar, edita la suya.
- Solo opina quien tuvo una cita confirmada (estado 2) que ya pasó. Corta casi todas las falsas.
- Lo reportado lo revisa una persona de Citaly; mientras tanto sigue visible.

---

## Apartados para la ficha según el tipo de local

Arquitectura: **bloques de ficha** que el dueño activa en Mi Negocio y ordena. En el backend, una tabla `local_secciones (local_id, tipo, orden, visible, datos JSONB)`. Un apartado nuevo = un componente de vista + uno de edición, sin tocar el esquema.

### Para todos
- **Aviso del día**: una línea arriba de la ficha que caduca a las 24 h («Hoy cerramos a las 4», «Se acabó el pollo»).
- **Corriente y planta**: «Tenemos planta eléctrica» y, opcional, si hoy hay corriente. Con los apagones decide si alguien va.
- **Formas de pago**: CUP, USD, MLC, Transfermóvil, EnZona, Zelle, efectivo.
- **Cómo llegar**: referencias en texto («frente al parque, puerta verde»).
- **Preguntas frecuentes** y **promociones con fecha de fin**.

### Mesas — restaurantes, paladares, cafeterías, bares, terrazas
1. **Carta**: categorías, plato con foto, precio, marcas (vegetariano, picante) e interruptor **«Se acabó hoy»**. El QR del póster puede abrirla directamente.
2. **Plato del día.**
3. **Encargos y para llevar** (cakes, cajitas).
4. **Celebraciones**: capacidad, si se decora, consumo mínimo. Engancha con juntar mesas del plano.
5. **Eventos**: karaoke, música en vivo, fútbol en pantalla.
6. **Hora de cierre de cocina.**

### Citas — peluquerías, barberías, uñas, spa, tatuajes
1. **Portafolio** con antes y después, cada foto enlazada a su servicio.
2. **Combos** (corte + barba) con precio cerrado.
3. **Productos a la venta.**
4. **Antes de venir** («ven con el pelo lavado»).
5. **Tatuajes**: diseños flash, consulta previa como cita aparte, cuidados enviados después.
6. **Tarjeta de fidelidad** (el 10.º gratis), contada con las citas confirmadas.
7. **Política de cancelación** visible antes de reservar.

### Mensual — gimnasios, academias, baile, idiomas
1. **Horario de clases semanal** con profesor, nivel y cupo.
2. **Clase de prueba gratis.**
3. **Profesores**, **instalaciones**, **niveles y programa**.
4. **Tablón para socios** («mañana no hay clase por apagón»).
5. **Muestras y exámenes** abiertos al público.

**Prioridad:** Carta, Portafolio y Horario de clases (uno por tipo); después Aviso del día, Formas de pago y Corriente/planta.
