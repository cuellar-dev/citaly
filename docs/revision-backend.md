# Revisión del backend: errores y cosas que no cuadran

Fecha: 18 nov 2026

Esto sale de leer todo el código del backend. **No se ejecutó contra una base de datos real**, así que algunos puntos están marcados como "verificar" porque dependen de cómo esté tu BD de verdad. El único que se reprodujo con una prueba aislada es el punto 1.

La idea no es criticar. La arquitectura es buena (capas claras, consultas parametrizadas, transacciones, snapshots de precio, Cloudinary firmado). Estos puntos son cosas que parecen despistes o que quizá tengan una razón que yo no veo. En cada uno hay una **Pregunta**: si hay un motivo detrás, cuéntalo y lo ajustamos.

Etiquetas: **[CRÍTICO]** rompe algo o abre un hueco de seguridad. **[IMPORTANTE]** falla en casos normales o es confuso. **[MENOR]** orden y limpieza.

## Resumen

| # | Nivel | Tema |
|---|-------|------|
| 1 | CRÍTICO | `verifyRole` se puede saltar con `?localId=` o `body.localId` |
| 2 | CRÍTICO | `DELETE` sin body da 500 en `verifyRole` |
| 3 | CRÍTICO | Rol `'onedueno'` en el esquema vs `'dueno'` en el código |
| 4 | CRÍTICO | La fila de `usuarios` solo se crea al crear un local |
| 5 | CRÍTICO | `GET /api/citas/local/:localId` está roto |
| 6 | CRÍTICO | `createCita` acepta cualquier campo del body |
| 7 | CRÍTICO | El dueño puede escribir `rating_cache` y `opiniones_count` |
| 8 | CRÍTICO | Registrar dos veces una imagen borra la buena en Cloudinary |
| 9 | IMPORTANTE | Los validadores lanzan `Error` plano y salen como 500 |
| 10 | IMPORTANTE | Los errores 500 no se registran en ningún sitio |
| 11 | IMPORTANTE | Paginación: servicios cortados a 10 y formatos distintos |
| 12 | IMPORTANTE | Citas: sin máquina de estados ni rechazo de fechas pasadas |
| 13 | IMPORTANTE | Reserva de mesas (`con-lugar`) no funciona |
| 14 | IMPORTANTE | Listados públicos incluyen servicios y profesionales inactivos |
| 15 | IMPORTANTE | Las fechas `DATE` salen como objeto `Date` |
| 16 | IMPORTANTE | Código que no se usa o está a medias |
| 17 | IMPORTANTE | Cosas del esquema sin uso (`bloqueos_agenda`, `preferencias`, `mesas`) |
| 18 | MENOR | Formatos de error y códigos mezclados |
| 19 | MENOR | Configuración fija en código (CORS, SSL, doble pool) |
| 20 | MENOR | Migraciones, lockfiles, `.env.example`, tests |
| 21 | MENOR | Nombres y docs desalineados |

---

## CRÍTICOS

### 1. `verifyRole` se puede saltar

**Dónde:** [Middlewares/authMiddleware.js:34](../backend-citaly-main/Middlewares/authMiddleware.js)

```js
const localId = req.params.localId || req.body.localId || req.query.localId || req.params.id;
```

**Qué pasa:** en las rutas de `/api/local/:id` el id real del local viaja en `params.id`, que es lo **último** que se mira. Un usuario que sea dueño de su local A puede llamar `PUT /api/local/LOCAL_B?localId=LOCAL_A`. El middleware comprueba la membresía en A (pasa), pero el controlador usa `params.id` = B y edita el local de otro.

Se reprodujo copiando la lógica en un Express 5 aislado:

```
PUT /api/local/LOCAL_AJENO                      -> 403 (correcto)
PUT /api/local/LOCAL_AJENO?localId=MI_LOCAL     -> 200  (se salta el permiso)
PUT /api/local/LOCAL_AJENO + body {localId:...} -> 200  (se salta el permiso)
```

Aplica a `PUT`, `DELETE` y a las rutas de amenidades de `LocalRouter`.

**Pregunta:** ¿el fallback a `body` y `query` tenía algún uso? Propongo usar solo `req.params` (`localId` o `id` según la ruta) y nunca datos del cliente.

### 2. `DELETE` sin body da 500

**Dónde:** el mismo [authMiddleware.js:34](../backend-citaly-main/Middlewares/authMiddleware.js)

**Qué pasa:** en Express 5 `req.body` es `undefined` cuando la petición no trae cuerpo. En las rutas donde no existe `params.localId` (las de `/api/local/:id`), `req.body.localId` lanza `TypeError` y el `catch` responde 500 "Error en la verificación de rol". Borrar un local o quitar una amenidad sin enviar body falla siempre.

**Pregunta:** ¿el front manda algún body en esos DELETE, y por eso no se había notado?

### 3. Rol `'onedueno'` en el esquema, `'dueno'` en el código

**Dónde:** [Database/Migrations/002CitalySchema.sql:260](../backend-citaly-main/Database/Migrations/002CitalySchema.sql) vs [Services/localServices.js:62](../backend-citaly-main/Services/localServices.js) y [Models/LocalMiembrosModel.js:5](../backend-citaly-main/Models/LocalMiembrosModel.js)

**Qué pasa:** el `CHECK` de `local_miembros.rol` acepta `'onedueno'`, `'encargado'`, `'staff'`. Todo el código usa `'dueno'`. Con ese esquema, crear un local falla al insertar el miembro (error 23514, que sale como 400 `INVALID_DATA`) y se revierte la transacción.

**Verificar:** ¿en tu base de Neon el `CHECK` dice `'dueno'`? Si el archivo está mal pero la BD está bien, hay que corregir el archivo. Si la BD también dice `'onedueno'`, crear locales no funciona hoy.

### 4. La fila de `usuarios` solo se crea al crear un local

**Dónde:** [Services/localServices.js:61](../backend-citaly-main/Services/localServices.js) es el único sitio que llama a `asegurarUsuario`. [Controller/UsuariosController.js](../backend-citaly-main/Controller/UsuariosController.js) existe pero no está registrado en [App.js](../backend-citaly-main/App.js).

**Qué pasa:** Better Auth crea el usuario en la tabla `"user"`, pero `citas`, `opiniones`, `favoritos` y `notificaciones` apuntan a `usuarios(id)`. Un cliente que se registra y reserva, opina o guarda un favorito choca con la clave foránea (23503), que sale como 409 `RELATED_RESOURCE_CONFLICT`. Tampoco hay ruta `/me`. El propio `FEEDBACK_FRONTEND.md` ya lo menciona.

**Pregunta:** ¿la idea era crear la fila al registrarse (hook de Better Auth) o en el primer login? Propongo el hook `databaseHooks.user.create.after`.

### 5. `GET /api/citas/local/:localId` está roto

**Dónde:** [Services/CitasService.js:138-156](../backend-citaly-main/Services/CitasService.js)

**Qué pasa:**
- Línea 143 usa `LocalModel`, que **no está importado**. Da `ReferenceError` y un 500 sin log.
- Línea 155 llama `CitasModel.getCitasByLocal(localId, userRequestedId)`, y el segundo parámetro es `page`. Le llega un id de usuario y `normalizarPagina` falla.
- La consulta de citas se ejecuta dos veces (líneas 148 y 155). La comprobación `if (!localCitas)` nunca se cumple porque un array vacío no es falsy.
- `validarUuid(localId)`: los `locales.id` son `TEXT` y `createLocal` acepta el id que mande el cliente. Si alguno no es UUID, este endpoint lo rechaza.

**Pregunta:** ¿se llegó a probar este endpoint? Parece que quedó a medias al refactorizar.

### 6. `createCita` acepta cualquier campo del body

**Dónde:** [Controller/CitasController.js:9-16](../backend-citaly-main/Controller/CitasController.js) y [Models/CitasModel.js:84-92](../backend-citaly-main/Models/CitasModel.js)

**Qué pasa:** `const { serviciosIds, ...datosCita } = req.body` y luego todo se pasa al modelo. Un cliente puede mandar `estado_reserva: 1` y crear la cita ya confirmada, o `cancelada_por`, `consumo_minimo`, etc. Solo `precio_total` y `demora_minutos` se sobrescriben después.

**Pregunta:** ¿se debería aceptar solo `local_id`, `profesional_id`, `fecha`, `horario`, `notas_cliente`, `personas` y `mesa_id`, y dejar el estado siempre en 0 al crear?

### 7. El dueño puede escribir `rating_cache` y `opiniones_count`

**Dónde:** [Models/LocalesModel.js:5-23](../backend-citaly-main/Models/LocalesModel.js)

**Qué pasa:** `camposLocalizables` incluye `rating_cache`, `opiniones_count` y `distancia_mock_m`. Cualquier dueño puede ponerse 5.0 con 300 opiniones al crear o editar su local. Además, **nada recalcula** esos campos cuando llega una opinión nueva. Pasa algo parecido con `rating` en profesionales.

**Pregunta:** ¿se pensaba recalcularlos en `createOpinion`/`deleteOpinion`? Propongo sacarlos del payload editable y actualizarlos desde el servicio de opiniones.

### 8. Registrar dos veces una imagen borra la buena en Cloudinary

**Dónde:** [Services/MediaService.js:154-176](../backend-citaly-main/Services/MediaService.js)

**Qué pasa:** si el `insert` falla (por ejemplo `public_id` duplicado al hacer doble clic o reintentar), el `catch` llama `eliminarAsset(publicId)`. Ese `publicId` es el de la imagen que **ya estaba registrada y en uso**, así que se destruye en Cloudinary y la BD queda apuntando a un archivo que no existe.

**Pregunta:** ¿te parece bien borrar solo cuando el error no sea de duplicado (23505)?

---

## IMPORTANTES

### 9. Los validadores lanzan `Error` plano y salen como 500

**Dónde:** [Utils/validaciones.js](../backend-citaly-main/Utils/validaciones.js): `normalizarPagina`, `validarFecha`, `validarHorario`, `validarEnteroNoNegativo`, `validarEnteroPositivo`, `validarCitaPayload`, y varios en los modelos.

**Qué pasa:** usan `throw new Error(...)` sin `statusCode`. `responderError` los trata como 500 y devuelve "Error interno del servidor". Un `?page=abc`, una fecha mal escrita o un `fecha` ausente en `/disponibilidad` dan 500 en vez de 400. En cambio `validarId` y `validarUuid` sí usan `crearError`.

**Pregunta:** ¿hay motivo para que unos usen `crearError` y otros no? Propongo que todos usen `crearError(..., 400)`.

### 10. Los errores 500 no se registran

**Dónde:** [Utils/respuestas.js:11](../backend-citaly-main/Utils/respuestas.js) y [Middlewares/error.middleware.js](../backend-citaly-main/Middlewares/error.middleware.js)

**Qué pasa:** `responderError` responde 500 pero no hace `console.error`. El `errorHandler` global sí lo hace, pero **nunca se ejecuta**, porque cada controlador atrapa todo con su propio `try/catch`. Solo los modelos loguean (vía `manejarError`). Un error en un servicio o controlador, como el `LocalModel is not defined` del punto 5, no deja ningún rastro.

**Pregunta:** ¿se prefiere el `try/catch` en cada controlador por algún motivo? Express 5 ya pasa los errores de funciones `async` al `errorHandler`, así que se podrían quitar casi todos.

### 11. Paginación: servicios cortados a 10 y formatos distintos

**Dónde:** [Services/ServiciosServices.js:6](../backend-citaly-main/Services/ServiciosServices.js), [Models/ServiciosModel.js:51-62](../backend-citaly-main/Models/ServiciosModel.js), [Services/localServices.js:29](../backend-citaly-main/Services/localServices.js), [Controller/CitasController.js:24-33](../backend-citaly-main/Controller/CitasController.js)

**Qué pasa:**
- El controlador de servicios lee `page`, pero el servicio solo recibe `localId` y lo ignora. El modelo siempre devuelve la página 1 con `LIMIT 10`.
- El detalle del local (`getlocalByIdWithDetails`) usa ese mismo método, así que **un local con más de 10 servicios solo muestra 10**.
- Citas por usuario y por local nunca reciben `page`, y solo se ven las 10 más recientes.
- `GET /api/local` responde `{ Data, Pagination: { Page, NextPage, ... } }` con mayúsculas. El resto devuelve un array sin metadatos. `responderExito` ya admite un parámetro `meta` que casi no se usa.

**Pregunta:** ¿se acordó algún formato de paginación con el front? Propongo uno solo: `{ data, meta: { page, total, totalPages } }`.

### 12. Citas: sin máquina de estados ni rechazo de fechas pasadas

**Dónde:** [Services/CitasService.js:158-222](../backend-citaly-main/Services/CitasService.js), [Services/DisponibilidadService.js](../backend-citaly-main/Services/DisponibilidadService.js)

**Qué pasa:**
- El local puede mover una cita a **cualquier** estado 0-3, incluso reactivar una cancelada. Eso puede chocar con el índice único de horario, y ese error no se traduce a 409 (el mapeo `mapearErrorDuplicadoCita` solo está en la creación).
- El cliente puede cancelar una cita ya completada.
- No se rechaza una cita con fecha u hora ya pasada.

Nota: el hecho de que la disponibilidad solo compare la hora de **inicio** (sin solape por duración) **no** es un bug. Está acordado en `FEEDBACK_FRONTEND.md` y coincide con el índice único.

**Pregunta:** ¿qué transiciones son válidas? Por ejemplo 0→1, 0→3, 1→2, 1→3.

### 13. La reserva de mesas (`con-lugar`) no funciona

**Dónde:** [Services/DisponibilidadService.js:47](../backend-citaly-main/Services/DisponibilidadService.js), [Utils/validaciones.js:162-173](../backend-citaly-main/Utils/validaciones.js)

**Qué pasa:** `validarDisponibilidadByServicios` exige siempre un `profesional_id` válido, y `validarCitaPayload` **prohíbe** `profesional_id` en citas `con-lugar`. Una cita con mesa no puede pasar por `POST /api/citas/servicios`. Además, ningún archivo JS consulta la tabla `mesas`: no se comprueba que la mesa pertenezca al local, ni su capacidad, y no existen endpoints de mesas.

**Pregunta:** ¿las mesas van por otro endpoint que aún no está hecho, o se planeaba reutilizar este?

### 14. Listados públicos incluyen inactivos

**Dónde:** [Models/ServiciosModel.js:51](../backend-citaly-main/Models/ServiciosModel.js), [Models/ProfesionalesModel.js:45](../backend-citaly-main/Models/ProfesionalesModel.js)

**Qué pasa:** `getServiciosByLocalId` y `getProfesionalesByLocal` no filtran por `activo`. Un profesional "eliminado" (`desactivarProfesional`) o un servicio desactivado siguen apareciendo para el cliente, que luego recibe un error al reservarlos. El panel del dueño sí los necesita, pero el público no.

**Pregunta:** ¿un parámetro `?incluirInactivos=true` solo para miembros del local?

### 15. Las fechas `DATE` salen como objeto `Date`

**Dónde:** toda la capa de modelos. No hay `setTypeParser` en el proyecto.

**Qué pasa:** `pg` convierte las columnas `DATE` a `Date` de JavaScript. Al serializar, `fecha` sale como `"2026-11-20T00:00:00.000Z"` (depende de la zona horaria del servidor) y el contrato dice `"2026-11-20"`. En [Services/NotificacionesServices.js:25](../backend-citaly-main/Services/NotificacionesServices.js) el texto de la notificación puede quedar como "Tue Nov 20 2026 00:00:00 GMT…".

**Pregunta:** ¿lo viste en las pruebas? Propongo devolver las `DATE` como string (`types.setTypeParser(1082, v => v)`) o con `to_char` en las consultas.

### 16. Código que no se usa o está a medias

- [Services/ServiciosServices.js:72-91](../backend-citaly-main/Services/ServiciosServices.js): `addImagenToServicio` usa `prefijoLocal`, `localId` y `cloudinary`, que no existen en ese archivo, y no devuelve nada. Nunca se llama (la lógica real está en `MediaService`).
- [Services/OpinionesService.js:58 y 68](../backend-citaly-main/Services/OpinionesService.js): `getRatingByLocal` está definido dos veces, idéntico.
- [Services/NotificacionesServices.js:136](../backend-citaly-main/Services/NotificacionesServices.js): `crearNotificacionConfirmacionLocal` no se usa.
- [Services/localServices.js:129-199](../backend-citaly-main/Services/localServices.js): `assignMiembroToLocal`, `updateMiembroRol` y `removeMiembroFromLocal` no tienen ruta. No hay forma de añadir un encargado o staff desde la API.
- [Models/CitasModel.js:148](../backend-citaly-main/Models/CitasModel.js) `deleteCita`, [Models/MediaModel.js](../backend-citaly-main/Models/MediaModel.js) (`deleteImagenById`, `updateImagenById`, `getImagenById`) y [Models/UsuarioModel.js](../backend-citaly-main/Models/UsuarioModel.js) `createUsuario`/`updateUsuario`/`deleteUsuario`: no tienen quien los llame.
- [Models/CategoriasModel.js](../backend-citaly-main/Models/CategoriasModel.js) y [Models/AmenidadesModel.js](../backend-citaly-main/Models/AmenidadesModel.js): no hay endpoint para listarlas. El front no puede mostrar ni elegir categorías o amenidades.
- [Models/LocalMiembrosModel.js:30](../backend-citaly-main/Models/LocalMiembrosModel.js): `ORDER BY lm.rol DESC` ordena alfabéticamente (`staff`, `encargado`, `dueno`), que no es un orden con sentido.

**Pregunta:** ¿esto es trabajo pendiente o se puede borrar?

### 17. Cosas del esquema que ninguna API usa

- `bloqueos_agenda`: ningún archivo la menciona, así que no hay forma de bloquear horas o días.
- `preferencias`: sin código.
- `mesas`: ver punto 13.
- `notificaciones.tipo = 'recordatorio'` y `programada_para`: existen, pero no hay tarea que genere recordatorios.
- `locales.distancia_mock_m` y `locales.yerro_menu_id`: parece dato de prueba metido en la tabla real. `GET /api/local` hace `SELECT *` y los devuelve al público.
- `usuarios.rol_base`: nunca se actualiza. Al crear un local el usuario sigue como `cliente`.

**Pregunta:** ¿cuáles son del plan y cuáles eran pruebas?

---

## MENORES

### 18. Formatos de error y códigos mezclados

- [Middlewares/authMiddleware.js](../backend-citaly-main/Middlewares/authMiddleware.js) responde `{ error: 'No autorizado' }` (texto). Todo lo demás responde `{ error: { code, message, details } }`. El front tendrá que leer los dos formatos.
- [Services/ProfesionalService.js](../backend-citaly-main/Services/ProfesionalService.js) usa como `code` frases en inglés: `'Local not found'`, `'Professional not found'`, `'Service is already assigned to the professional'`. El resto usa `RESOURCE_NOT_FOUND`, `FORBIDDEN`, etc.
- Hay códigos en español (`LOCAL_NO_ENCONTRADO`, `IMAGEN_MUY_GRANDE`) y en inglés (`LOCAL_NOT_AVAILABLE`) mezclados.
- Se devuelve 404 para "el servicio no pertenece al local" en `ServiciosServices` y 400 en `MediaService`.

### 19. Configuración fija en código

- CORS y `trustedOrigins` con `localhost` escrito a mano en [App.js:27](../backend-citaly-main/App.js) y [Config/auth.js:32](../backend-citaly-main/Config/auth.js). En producción hay que editar código.
- [Config/auth.js:17](../backend-citaly-main/Config/auth.js) fuerza `sslmode=verify-full`. Con una base local de Postgres no conecta.
- Dos pools de conexión: `@neondatabase/serverless` en `db.js` y `pg` en `auth.js`, hasta 10 conexiones sumando ambos.
- [Config/db.js:10-14](../backend-citaly-main/Config/db.js) tiene comentarios con emoji y repite `process.env.DATABASE_URL` en vez de `databaseUrl`.
- No hay `rate limit` propio ni límite explícito de tamaño en `express.json()`.

### 20. Migraciones, lockfiles, `.env.example` y tests

- No hay un runner de migraciones. `001` es un archivo vacío con un comentario.
- `003` y `005` agregan columnas que `002` ya incluye (`local_imagenes.public_id`, `notificaciones.programada_para`).
- `004` agrega `servicios.imagen_url`/`imagen_public_id` y `profesionales.foto_public_id`, que **`002` no tiene**, pero el código las usa. Con solo `002` el módulo de servicios falla. Hay que ejecutar las cinco en orden.
- Existen `package-lock.json` y `pnpm-lock.yaml` a la vez, y solo uno debería mandar.
- `package.json` dice `"main": "index.js"` (no existe), `"name": "backend"` y `"test": "node --test"` sin ningún test.
- [.env.example](../backend-citaly-main/.env.example) no incluye `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` ni `APP_ENV`. Sin las de Cloudinary el servidor **no arranca** (`Config/cloudinary.js` lanza error al importarse).

### 21. Nombres y docs desalineados

- Nombres de archivo con criterios distintos: `favoritoService.js`, `ServiciosServices.js`, `NotificacionesServices.js`, `localServices.js`, `Servicios-ProfesionalesModel.js`, `favoritosModel.js` y `LocalesModel.js`.
- [Doc/ESQUEMA_TABLAS_CITALY.md](../backend-citaly-main/Doc/ESQUEMA_TABLAS_CITALY.md) describe tablas `profiles`, `media_assets` y rutas `/api/v1/me/profile`, que no existen. El código real usa `usuarios`, `local_imagenes` y `/api/...`. Hay varios documentos de plan (`PLAN_*`, `MIGRACION_*`, `tablas-backend.md`) que se pisan entre sí.
- Los parámetros de rutas cambian: `:id` en locales, `:localId` en el resto, `:usuarioId` en favoritos. Eso es lo que provocó el punto 1.

---

## Lo que está bien (para no tocarlo)

- Arquitectura en capas y uso de `withTransaction` en crear local y crear cita.
- Todas las consultas van parametrizadas. Los campos dinámicos de los `UPDATE` salen de listas blancas, así que no vi inyección SQL.
- Snapshots de nombre y precio en `cita_servicios`.
- Índices únicos parciales contra doble reserva (misma hora de inicio).
- Comprobación de propiedad en citas del cliente, favoritos y notificaciones.
- Subida a Cloudinary firmada desde el servidor, con validación de prefijo, formato y tamaño.
- `api.http` y el contrato `CONTRATO_API_FRONTEND.md`.

## Orden que propongo

1. **Seguridad y arranque:** puntos 1, 2, 3, 6, 7 y 8, más completar `.env.example`.
2. **Que el flujo cliente funcione:** puntos 4, 5, 9, 10 y 15.
3. **Lo que el front necesita:** puntos 11, 12, 14, listados de categorías y amenidades y `/me`.
4. **Después:** mesas (13), recordatorios, moderación de opiniones, miembros y tests.
