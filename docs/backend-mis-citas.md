# Mis citas: lo que el backend tiene que dar

Fecha: 21 de noviembre de 2026. El front de **Mis citas** (`/citas`, la vista del cliente) ya está preparado para hablar con el backend. Este documento dice qué rutas usa, cuáles existen ya y cuáles faltan. **No se tocó `backend-citaly-main`**: solo el front.

Sin `VITE_API_URL` todo sigue con la demo en `localStorage`. Con ella, la pantalla pide los datos al backend.

## Cómo está montado en el front

| Archivo | Qué hace |
| --- | --- |
| `src/services/misCitasApi.js` | Las llamadas HTTP y `adaptarCita()` (fila del backend → cita del front). |
| `src/services/misCitas.js` | La frontera: `cargarMisCitas()` y las acciones (`guardarVoyPaAlla`, `guardarCancelar`, `guardarAsistencia`, `guardarOpinion`…). Decide demo o backend. |
| `src/hooks/useMisCitas.js` | Estado de la pantalla: carga, error, aviso, y cada acción pinta al instante y guarda después. |
| `src/utils/resumenCitas.js` | Todo lo de «Tu año en Citaly», «Tus sitios de siempre» y «Tus últimas citas» **se calcula en el front** a partir de la lista de citas. No hay endpoint de resumen. |

Para conectar basta con arreglar el backend según las tablas de abajo; el front no cambia.

## Rutas

| Acción en pantalla | Ruta | Estado |
| --- | --- | --- |
| Cargar mis citas | `GET /api/citas/usuario/me?page=N` | **Existe**, pero la respuesta es pobre (ver «Campos que faltan») |
| «Voy pa allá» | `PATCH /api/citas/:id/usuario/confirmar` con `{ nuevoEstado: 2 }` | **Existe** |
| Cancelar | `PATCH /api/citas/:id/usuario/cancelar` | **Existe** |
| «¿Fuiste?» Sí / No / Deshacer | `PATCH /api/citas/:id/usuario/asistencia` con `{ asistio: true \| false \| null }` | **Falta** |
| Publicar u opinar | `POST /api/opiniones/local/:localId` con `{ citaId, calificacion, comentario }` | Existe, **falta aceptar `citaId`** |
| Editar mi opinión | `PUT /api/opiniones/:opinionId` | **Falta** (hoy el front repite el `POST`; con `citaId` el servidor debería reemplazar, no duplicar) |

Mientras falte una ruta, el front **no se rompe**: la acción secundaria (asistencia, opinión) se pinta, se guarda en un cuaderno local (`citaly_citas_extra`) y se avisa de que «queda en este dispositivo». Cuando la ruta exista y la cita vuelva con el dato, el cuaderno se vacía solo.

Las acciones **críticas** (cancelar, «voy pa allá») son distintas: si el servidor las rechaza, el front **las deshace** y avisa. No queda como cancelada una cita que el local sigue viendo viva.

## Campos que faltan en `GET /api/citas/usuario/me`

Hoy devuelve solo las columnas de `citas`. Para que la tarjeta y el resumen se pinten hacen falta, **por cita**:

| Campo | Para qué | Nota |
| --- | --- | --- |
| `local_nombre` | Título de la tarjeta, «Tus sitios», «Tus últimas citas» | `locales.nombre` |
| `local_categoria` | «Tu peluquería / barbería / sitio de uñas» | Nombre de la categoría, no el id |
| `local_foto` | Foto de la tarjeta «Tu sitio» | Portada del local |
| `servicios[]` | Qué se hizo y «Lo de siempre» | `cita_servicios` (snapshot): `servicio_id`, `nombre`, `precio`, `duracion_minutos` |
| `mesa` | Código, capacidad y zona en citas de mesa | `{ codigo, capacidad, ubicacion }` |
| `asistio` | «¿Fuiste?» | `true`, `false` o `null` (sin responder) |
| `opinion` | La opinión que ya dejó | `{ calificacion, comentario, creado_en }` o `null` |

Sin `local_categoria` no sale «Tus sitios de siempre» para locales que el front no conoce (ver abajo).

## Reglas que el front da por hechas

- **Estados:** `0` pendiente, `1` por ti, `2` confirmada, `3` cancelada. `cancelada_por` también admite `'tiempo'`.
- **Plazo de 15 min:** el front pinta como cancelada una pendiente que lleva más de 15 minutos, pero **no lo guarda**. El que debe cancelarla de verdad es un job del servidor (`cancelada_por = 'tiempo'`).
- **Fechas y horas:** `fecha` como `AAAA-MM-DD` y `horario` como `HH:MM` (o `HH:MM:SS`, el front corta a 5). Ojo con el driver, que convierte `DATE` a `Date` y puede correr un día.
- **Una ida** (lo que cuenta en «Tu año» y en «sitios de siempre») = estado `2`, fecha ya pasada y `asistio` distinto de `false`.
- **Sitio fijo** = 2 idas o más al mismo local de las categorías de confianza (peluquería, barbería, uñas). Una nota de 1 a 3 en la última visita lo quita.
- **`repetidores_cache`** de Descubre (pendiente en `backend-descubre-cambios.md`) debería salir de las mismas idas: usar `asistio` y estado `2`.

## Lo que sigue siendo demo aunque conectes las citas

- **El catálogo del local** (`getLocalById`, `src/services/locales.js`) sale de `locales.json`. «Tus sitios de siempre» lo usa para saber si el local sigue ofreciendo lo de siempre y su precio actual. Si el local no está en la demo, se usan la categoría, la foto y los servicios que trae la propia cita (por eso los campos de arriba). Cuando exista `GET /locales/:id`, `getLocalById` se cambia y esto mejora solo.
- **Tarjeta de cita** (`propsDesdeCita`): WhatsApp, teléfono y mapa también salen de `getLocalById`.
- **Favoritos** («Te gustaron»): `src/services/favoritos.js` es síncrono y local. La ruta `/api/favoritos/me` ya existe; falta pasarlo a asíncrono.
- **Suscripciones** (gimnasio, cursos): `getSuscripciones()` en `storage.js`. No hay tabla ni ruta todavía.
- **Sesión:** `USUARIO_ACTUAL_ID` es fijo. Sin sesión real el backend responde 401 y Mis citas enseña «No pudimos cargar tus citas» con «Reintentar».

## Probarlo

1. `.env.development.local` con `VITE_API_URL=http://localhost:1234` y arrancar front y backend.
2. Entrar a `/citas`: debe verse el esqueleto y luego las citas del usuario de la sesión.
3. Cancelar una cita con el backend apagado: la tarjeta vuelve a su sitio y sale un aviso rojo.
4. Marcar «Sí, fui» antes de que exista la ruta de asistencia: se ve el cambio y un aviso amarillo; recargar lo conserva.
