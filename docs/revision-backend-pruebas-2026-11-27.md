# Revisión del backend: pruebas, fallos y plan por tandas

**Fecha:** 27-11-2026 · **Commit del backend revisado:** `2993ed8` (rama `main` de `erdwin123/backend-citaly`) · **Base:** Neon (compartida) · **Autor de las pruebas:** Claude (Sonnet 5.5), sin tocar código.

> **Para una IA que lea esto sin contexto:** este documento es autosuficiente. Explica el proyecto (sección 1), una decisión de producto que cambia el alcance (sección 2), cómo se probó (3), **todos** los fallos con su causa, el archivo donde tocar y soluciones viables (5), lo que ya funciona y no debe romperse (6), lo que no se pudo probar (7) y un plan por tandas ordenado por impacto, pensado para resolverlo por partes en nuevas conversaciones (8). Al final (apéndice) está la lista completa de las 345 pruebas.
>
> **Regla de trabajo:** no cambiar nada sin enseñar antes el plan; cada arreglo debe llevar su prueba automática (ver tanda 7). No tocar la base de Neon sin avisar: es compartida con el socio (Erdwin). Las migraciones **no** corren solas: se aplican a mano.

---

## 0. ESTADO AL 27-11-2026 (noche): arreglado, en `main` y en Neon

**Hecho y en producción de datos:** la rama `nosotros/arreglos-revision` se revisó en la PR [erdwin123/backend-citaly#2](https://github.com/erdwin123/backend-citaly/pull/2), Erdwin la aprobó y **está fusionada en `main`** (commit de fusión `4b81fa6`). La migración **013 está aplicada en Neon** (27-11, ver abajo). De los 30 hallazgos quedan **corregidos 22** (19 de hoy + F-27 a F-29 de antes); los pendientes están **reordenados por prioridad en la sección 8**.

| Commit | Qué trae | Hallazgos |
| --- | --- | --- |
| `dfdd196` | Fuera los profesionales: rutas, fotos, `/disponibilidad`, `citas.profesional_id`, tablas, `agrupar_por`. Migración `013QuitarProfesionales.sql`. Primeras pruebas de API (`Tests/`). | Tanda 0, F-08, F-19 (en parte) |
| `afb4d77` | Reglas de reserva: **una cita ocupa su turno (inicio + intervalo del local)**, sin solapes y con candado por local y día, sin horas fuera de turno, sin segundos, fin antes del cierre, máximo 90 días de antelación, notas de hasta 300, sin autoreserva, 2 pendientes por local y 5 en total. `horas-ocupadas` devuelve también `hasta`. | F-03, F-04, F-21 |
| `c999186` | Validación central: topes de locales, servicios y preferencias; horario que no se borra si llega mal; día repetido; categorías que no se crean; página ≤ 500; los mensajes de Postgres ya no salen al cliente. | F-06, F-07, F-09, F-10, F-11, F-15, F-17, F-18, F-26 |
| `50b4776` | Opiniones: solo con su cita (confirmada y pasada), una por cita; el dueño y los encargados no opinan de su local; sin HTML; comentario > 600 → 400. | F-02, F-16 |
| `966df2b` | Borrar la cuenta pide la contraseña (o una sesión de menos de 10 min si solo entra con Google). Detalle de servicio: 404 si es de otro local, está desactivado o el local no es público. | F-01, F-05 |
| `3379e9c` | Prueba de F-22: el código ya comprobaba que la cita es del local de la ruta. | F-22 |

**Decisión de producto aplicada (27-11):** la duración de los servicios **no** decide cuándo acaba una cita; solo orienta al cliente. El fin es inicio + `intervalo_minutos` del local. Está escrito en grande en `docs/pendientes-backend.md` (arriba del todo), con los pasos por si se cambia de idea.

### Qué se creó o cambió (todo)

**Backend (`backend-citaly-main`):**

| Archivo | Tipo | Qué |
| --- | --- | --- |
| `Routes/ProfesionalRouter.js`, `Controller/ProfesionalController.js`, `Services/ProfesionalService.js`, `Models/ProfesionalesModel.js`, `Models/Servicios-ProfesionalesModel.js` | **Borrados** | Módulo de profesionales. |
| `App.js` | Modificado | Sin `/api/profesionales`. |
| `Routes/MediaRouter.js`, `Controller/MediaController.js`, `Services/MediaService.js` | Modificado | Sin firma ni registro de fotos de profesionales. |
| `Routes/DisponibilidadRouter.js`, `Controller/DisponibilidadController.js` | Modificado | Se retira `GET /api/local/:id/disponibilidad` (el front no la usaba). Queda `horas-ocupadas`. |
| `Services/DisponibilidadService.js` | Reescrito | Sin profesionales. Bloque «REGLAS DE RESERVA»: turno = inicio + intervalo, `HORA_FUERA_DE_TURNO`, fin ≤ cierre, `pg_advisory_xact_lock` por local y día, solape por turno, `CITA_MUY_LEJANA` (90 días), `RESERVA_PROPIA` (403), `DEMASIADAS_PENDIENTES` (2 por local, 5 en total). `horas-ocupadas` con `hasta`. |
| `Services/CitasService.js` | Modificado | Hora solo `HH:MM`; `notas_cliente` ≤ 300; índice `citas_local_horario_activa_idx` mapeado a 409. |
| `Controller/CitasController.js`, `Models/CitasModel.js` | Modificado | Sin `profesional_id`; fuera `getCitasActivasByProfesionalAndFecha`. |
| `Utils/validaciones.js` | Modificado | `validarTextoLibre`, `validarUrlCloudinary`, `validarDatosLocal`, `LIMITES_LOCAL`, `LIMITES_SERVICIO`, `validarPrecioServicio`, `validarDuracionServicio`, `MAX_PAGINA` (500). `manejarError`: 22001/22003/22007/22008 → 400 y mensaje genérico en vez del de Postgres (el original queda en el registro y en `error.mensajePostgres`). Sin `profesional_id` en `validarCitaPayload`. |
| `Models/LocalesModel.js` | Modificado | `createLocal` y `updateLocal` pasan por `validarDatosLocal`. Sin `agrupar_por`. |
| `Models/ServiciosModel.js` | Modificado | `validarCamposServicio`: nombre ≤ 60, nota ≤ 200, precio ≤ 10 000 000, duración 5–480, sin HTML, foto solo de `res.cloudinary.com`. |
| `Models/PreferenciasModel.js` | Modificado | Antelación ≤ 10080 min (1 semana), radio ≤ 200 000 m. |
| `Services/localServices.js` | Modificado | `categoriaPorNombre` ya no crea categorías (el texto va a `ficha.categoria`); `validarHorariosSinRepetir`; `reescribirHorarios` valida días, al menos uno y abre < cierra **antes** de borrar; topes en `sincronizarServicios`. |
| `Services/OpinionesService.js`, `Models/OpinionesModel.js` | Modificado | `CITA_OBLIGATORIA` (400), `OPINION_PROPIA` (403), `MAX_COMENTARIO` = 600 con 400 en vez de recorte, sin HTML. |
| `Config/auth.js` | Modificado | `hooks.before` → `exigirConfirmacionAlBorrar` para `/delete-user` (`PASSWORD_REQUIRED` / `SESSION_EXPIRED`). `freshAge` sigue en 1 día **a propósito**: bajarlo rompía «Dispositivos» (`/list-sessions` también lo usa). |
| `Controller/ServiciosController.js`, `Services/ServiciosServices.js` | Modificado | `getServicioById(servicioId, localId)`: 404 si no es de ese local, está desactivado o el local no es público. |
| `Models/DescubreModel.js`, `Services/DescubreServices.js`, `Database/Scripts/seed-descubre.js`, `Database/Seeds/descubre-locales.json` | Modificado | Sin `agrupar_por` / `agruparPor`. |
| `Database/Migrations/013QuitarProfesionales.sql` | **Nuevo** | Ver abajo. |
| `package.json` | Modificado | `test`: `node --test --test-concurrency=1` (PGlite se cuelga con varios archivos a la vez). |
| `Tests/ayudas.js`, `Tests/LEEME.md` | **Nuevos** | Cliente HTTP con cookie, cuentas, local público, reservar; cómo correrlo. Se niega a correr contra Neon. |
| `Tests/profesionales.test.js` (6), `Tests/reservas.test.js` (13), `Tests/validacion.test.js` (10), `Tests/opiniones.test.js` (6), `Tests/cuenta.test.js` (6), `Utils/validaciones.test.js` (8) | **Nuevos** | 49 pruebas nuevas. Con las 5 de eventos de Descubre: **54, todas en verde** contra un backend y una base PGlite de pruebas. |
| `api.http`, `Doc/*.md` (10 archivos) | Modificado | Sin las secciones de profesionales; aviso arriba de cada doc de que en la V1 no hay profesionales. |

**Front (`Citaly`):**

| Archivo | Tipo | Qué |
| --- | --- | --- |
| `src/utils/reservaHorarios.js` | Modificado | `generarHorarios`: el último turno tiene que acabar como muy tarde al cierre (antes ofrecía, p. ej., las 17:00 en un local que cierra a las 17:30 con turnos de 60, y el backend ahora lo rechaza). Igual que `turnosDelDia` del panel. |
| `src/utils/reservaHorarios.test.js` | **Nuevo** | 3 pruebas de `generarHorarios`. |
| `docs/pendientes-backend.md` | Modificado | Decisión del turno, en grande y arriba. |
| este documento | Modificado | Esta sección y la columna «Tanda» del resumen. |

### La migración 013 en Neon — APLICADA (27-11-2026)

- **Antes de aplicarla**, Neon tenía 1 cita, 1 profesional («Profesional de Prueba») y 1 fila en `profesional_servicios`, todo de **prueba**: la cita era del local «Studio Citaly de Prueba», del 12-10, **cancelada por el cliente**, y usaba ese profesional. La guardia de la 013 se habría parado por ella, así que primero se le quitó el profesional (`UPDATE citas SET profesional_id = NULL`; la cita se conserva igual) y después se aplicó la 013. 6 categorías tenían `agrupar_por = 'profesional'` (la columna ya no existe).
- **Aplicada dos veces seguidas sin error.** Después: sin tablas ni columnas de profesionales, índices de `citas` = `citas_pkey`, `citas_usuario_fecha_idx`, `citas_local_fecha_idx`, `citas_mesa_horario_activa_idx`, `citas_local_horario_activa_idx`. Datos intactos: 34 locales, 15 categorías, 1 usuario, 1 cita.

### Prueba de `main` contra Neon de verdad (27-11-2026)

Backend de `main` en local (puerto 1236) apuntando a Neon, con un script que crea cuentas y un local `[PRUEBA] Neon QA` y **al final lo borra todo** (Neon quedó como estaba: 34 locales, 1 usuario, 1 cita, 0 opiniones, 15 categorías).

| Comprobación | Resultado |
| --- | --- |
| health, `/api/profesionales` → 404, Descubre (15 categorías sin `agruparPor`, 29 locales en el resumen), lista de locales, página 999999 → 400 | OK |
| Crear local (nace en revisión, 404 para el público), `lat: 999` → 400, ficha pública al aprobar, servicio por su local | OK |
| Reservar 10:00 (201, `demora_minutos` 120), misma hora otro cliente → 409 `SCHEDULE_NOT_AVAILABLE`, 10:15 → 400, 17:30 → 201, dueño en su local → 403, a 2 años → 400, `horas-ocupadas` con `hasta` | OK |
| El local acepta y el cliente confirma; opinión sin cita → 400, con su cita → 201, segunda → 409 | OK |
| Precio enorme → 400 sin texto de Postgres; borrar cuenta sin contraseña → 400; Dispositivos (`list-sessions`) → 200 | OK |
| 4 reservas a la vez de la misma hora | **Solo 1 entró** (bien: no se coló ninguna), 1 → 409, **2 → 500**: el 500 lo dio la **comprobación de la sesión**, que se cortó por la red («Connection terminated due to connection timeout») antes de llegar a la reserva. |

**Ojo con la red (F-30 sube de prioridad):** en estas pruebas, Neon tardaba de 1 a 4 s por consulta y cortaba conexiones de vez en cuando (en el equipo había Windscribe, Turbo VPN y simplewall activos). Dos pasadas enteras fallaron por eso, no por el código. Es justo el F-30: el backend no reintenta ni aguanta bien los cortes. Hay que repetir la prueba sin VPN y, sobre todo, arreglar F-30 antes de abrir.

### Qué falta de este documento

Todo lo pendiente, **ordenado por prioridad nueva**, está en la **sección 8**. Resumen: límite de ritmo y antibots (F-25/F-24), robustez con Neon (F-30), avisos al caducar y recordatorios al cancelar (F-12/F-23), «Proponer otra hora» en el backend, correo real, locales no públicos en `horas-ocupadas` y favoritos (F-13/F-14), el dueño abre una cita por id (F-20) y la convención 400/404 (resto de F-19).

---

## 1. Contexto del proyecto

**Citaly** es una web de reservas para negocios (peluquerías, barberías, restaurantes, etc.) en Cuba. Dos repos:

| Repo | Ruta local | Qué es |
|---|---|---|
| Front | `D:\diseñoWeb\proyectos mios\Citaly` (`cuellar-dev/citaly`) | React + Vite, PWA. Datos de demo si no hay `VITE_API_URL`. |
| Backend | `D:\diseñoWeb\proyectos mios\Citaly\backend-citaly-main` (`erdwin123/backend-citaly`) | Node + Express 5, ES modules, `pg`, Better Auth. **Este documento trata del backend.** |

**Arranque del backend:** `pnpm dev` (`node --watch Server.js`), puerto `1234`. Variables en `.env` (plantilla `.env.example`): `DATABASE_URL` (Neon), `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`, `FRONTEND_URL`, `CLOUDINARY_*`, `APP_ENV`. Sin `RESEND_API_KEY` los correos salen por consola. **Nota de red (Windows):** Neon se alcanza por TCP 5432; un cortafuegos por aplicación (simplewall) o una VPN que bloquee Postgres provocan `Connection terminated due to connection timeout` en Better Auth. Con Windscribe hay que excluir `node.exe` (split tunneling).

**Estructura (carpetas de `backend-citaly-main`):**

| Carpeta | Contenido |
|---|---|
| `Server.js`, `App.js` | Arranque y middlewares (`helmet`, `cors`, `compression`, `requestId`, `express.json({limit:'100kb'})`) y montaje de rutas. |
| `Routes/` | Un router por recurso (`CitasRouter.js`, `LocalRouter.js`, `OpinionesRouter.js`, `ServiciosRouter.js`, `ProfesionalRouter.js`, `DisponibilidadRouter.js`, `FavoritosRouter.js`, `NotificacionesRouter.js`, `PreferenciasRouter.js`, `UsuariosRouter.js`, `MediaRouter.js`, `DescubreRouter.js`, `health.routes.js`). |
| `Controller/` | Lee `req`, llama al servicio, responde con `responderExito` / `responderError` (`Utils/respuestas.js`). |
| `Services/` | Reglas de negocio (`CitasService.js`, `DisponibilidadService.js`, `localServices.js`, `OpinionesService.js`, `CuentaService.js`, `MediaService.js`, `ServiciosServices.js`, `favoritoService.js`, `NotificacionesServices.js`…). |
| `Models/` | SQL con `pg` (`LocalesModel.js`, `CitasModel.js`, `OpinionesModel.js`, `ServiciosModel.js`, `PreferenciasModel.js`, `HorariosModel.js`, `ProfesionalesModel.js`…). |
| `Middlewares/authMiddleware.js` | `requireAuth`, `optionalAuth`, `verifyRole(['dueno','encargado'])`, `verifyAdminRole('agente')`. |
| `Config/` | `db.js` (pool, `withTransaction`), `auth.js` (Better Auth), `entorno.js`. |
| `Jobs/index.js` | Ranking (diario), exposición (cada hora, apagados en `Server.js`) y **caducidad de citas pendientes (cada minuto, activo)**. |
| `Utils/validaciones.js` | `validarTexto`, `validarNumero`, `validarFecha`, `validarHorario`, `crearError`, `manejarError` (traduce códigos de Postgres: `23505`→409 `DUPLICATE_RESOURCE`, `23503`→409, `23514`/`22P02`→400, otros 5 chars→500). |
| `Database/Migrations/001…012*.sql` | Esquema. **Sin runner de migraciones.** |

**Convenciones de la API:** éxito `{ "data": … }`; error `{ "error": { "code", "message", "details" } }`. Rutas bajo `/api/…`. Sesión por cookie de Better Auth (prefijo `citaly`); toda petición `POST` necesita cabecera `Origin` permitida.

**Reglas de negocio importantes:**
- Un local nace `estado='revision'`, `completado=false`. Solo un administrador `agente` lo aprueba (`PATCH /api/local/:id/aprobar`); después el dueño lo completa (`PUT … { localData: { completado: true } }`). Público = `estado='aprobado' AND completado AND NOT oculto` (`FILTRO_PUBLICO`, `Models/LocalesModel.js:30`).
- Límites: 5 locales por cuenta y 2 en revisión a la vez (`Services/localServices.js`, `createLocalWithDetails`).
- Estados de cita (`citas.estado_reserva`): `0` pendiente, `1` aceptada por el local, `2` confirmada por el cliente, `3` cancelada. Una pendiente que el local no acepta en 15 min se cancela sola (`cancelada_por='tiempo'`, `Jobs/index.js:24-41`).
- Roles por local (`local_miembros.rol`): `dueno`, `encargado`. Rol global (`usuarios.admin_role`): `cliente`, `agente`.
- Tipos de cita: `sin-lugar` (servicios) y `con-lugar` (mesas). El front ya **no** envía profesional.

---

## 2. DECISIÓN DE PRODUCTO (27-11-2026): fuera todo lo de «profesionales» en la V1

**El dueño del proyecto decidió borrar y olvidar TODO lo relacionado con profesionales (datos, lógica y rutas) al menos para la V1.** Esto se hace **primero** (tanda 0), porque simplifica el resto y hace innecesarios varios arreglos (se marcan abajo como «desaparece con la tanda 0»).

**Qué hay que quitar (inventario de lo encontrado):**

| Capa | Qué | Dónde |
|---|---|---|
| Rutas | Router completo `/api/profesionales/*` (9 rutas: crear, listar, detalle, editar, desactivar, asignar/quitar servicio, servicios del profesional, profesionales del servicio) | `Routes/ProfesionalRouter.js`, montado en `App.js:53` |
| Rutas | `POST /api/media/locales/:id/profesionales/:pid/firma` y `…/imagen` | `Routes/MediaRouter.js`, `Controller/MediaController.js`, `Services/MediaService.js` (`firmarSubidaProfesional`, `registrarImagenProfesional`, `prefijoProfesional`) |
| Rutas | `GET /api/local/:id/disponibilidad` exige `profesionalId`: hay que **rediseñarla sin profesional** (ver F-08) o retirarla si el front solo usa `horas-ocupadas` | `Routes/DisponibilidadRouter.js`, `Controller/DisponibilidadController.js`, `Services/DisponibilidadService.js` |
| Controladores/servicios/modelos | `ProfesionalController`, `ProfesionalService`, `ProfesionalesModel`, `Servicios-ProfesionalesModel` | `Controller/`, `Services/`, `Models/` |
| Citas | Campo `profesional_id` en `createCitaWithServicios` y toda la rama «con profesional» de la validación; `getCitasActivasByProfesionalAndFecha`; `validarCitaPayload` | `Controller/CitasController.js:25`, `Services/CitasService.js`, `Services/DisponibilidadService.js:101-211`, `Models/CitasModel.js:20,118,131,219-233`, `Utils/validaciones.js:170-175` |
| Base de datos | Tablas `profesionales`, `profesional_servicios`; columna `citas.profesional_id` (FK `ON DELETE RESTRICT`); índice `citas_profesional_horario_activa_idx`; columna `bloqueos_agenda.profesional_id` y su `CHECK (mesa_id IS NOT NULL OR profesional_id IS NOT NULL)`; índice `profesionales_foto_public_id_idx`; CHECK de `citas` que mezcla `tipo`, `mesa_id` y `profesional_id` | `Database/Migrations/002CitalySchema.sql:150-211,272-277`, `004AddMediaPublicIds.sql`, `012PanelDueno.sql:35-39` |
| Descubre | `categorias.agrupar_por IN ('local','profesional')` y las categorías con `agrupar_por='profesional'` (p. ej. Tatuajes: el JSON de `/api/descubre/local/resumen` devuelve `"agruparPor":"profesional"`). Revisar con `grep -rn agrupar_por` dónde más se usa (servicios y modelos de Descubre, semillas) | `Database/Migrations/009DescubreRankingBase.sql:27` y los archivos de Descubre/Seeds que el `grep` encuentre |
| Docs / http | Menciones en `api.http`, `Doc/*.md` | repo backend |
| Front | Solo restos: `src/services/locales.js:9-13` ya ignora `profesionales` de fichas antiguas; `src/data/localesDemo.js` y `src/components/Legal/textoLegal.jsx` lo mencionan | repo front |

**Cómo hacerlo con seguridad (Neon es compartida):**
1. Crear una **rama de Neon** o copia de seguridad antes de cualquier `DROP`. Avisar a Erdwin.
2. Migración `013QuitarProfesionales.sql`, idempotente: `ALTER TABLE citas DROP CONSTRAINT <check de tipo>` y recrearlo sin `profesional_id`; `DROP INDEX IF EXISTS citas_profesional_horario_activa_idx`; `ALTER TABLE citas DROP COLUMN profesional_id`; `ALTER TABLE bloqueos_agenda DROP COLUMN profesional_id` y cambiar su CHECK (o dejar la tabla si nadie la usa: está sin usar en el código); `DROP TABLE profesional_servicios, profesionales`; cambiar el CHECK de `categorias.agrupar_por` a solo `'local'` y hacer `UPDATE categorias SET agrupar_por='local'`. Las migraciones se aplican a mano en Neon.
3. Comprobar antes que **ninguna cita real** use `profesional_id` (`SELECT count(*) FROM citas WHERE profesional_id IS NOT NULL`). El 27-11 la base tenía 1 cita; no se comprobó si usa profesional. Y comprobar `SELECT count(*) FROM profesionales` (los profesionales de las pruebas ya se borraron).
4. Quitar el código en el mismo orden (rutas → controladores → servicios → modelos), buscar con `grep -ri profesional` hasta que no quede nada, actualizar `Doc/` y `api.http`, y ejecutar la suite.
5. Efecto en el resto de este documento: **F-08** (500 en disponibilidad con día cerrado), **F-19** (códigos 400/404 en profesionales) y las pruebas de la sección «profesionales» del apéndice **desaparecen** al borrar el módulo. El resto de hallazgos de citas (F-03, F-04) hay que arreglarlos en la rama «sin profesional», que es la que queda.

---

## 3. Cómo se probó

- **Entorno:** backend local (`localhost:1234`) contra Neon real, con la migración 012 aplicada; red por Windscribe con `node.exe` excluido del túnel.
- **Método:** dos scripts Node temporales (`fetch` con jar de cookies por usuario) que registraban cuentas `qa.claude.<timestamp>.<rol>@citaly.test`, creaban locales `[PRUEBA] …`, y ejercitaban cada ruta con casos válidos, inválidos, de permisos y de concurrencia. Para lo que no se puede alcanzar por la API se usaron `UPDATE` puntuales **solo sobre filas de prueba** (pasar una cita al pasado, poner `admin_role='agente'` a una cuenta de prueba, aprobar un local, retrasar `creada_en` 20 min para provocar la caducidad). Ni los scripts ni la contraseña de prueba se conservaron.
- **Roles usados:** dueño, cliente, otro cliente, encargado (insertado en `local_miembros`), agente (admin), anónimo.
- **Rondas de prueba:** ronda 1 = 294 pruebas (ancha); ronda 2 = 51 pruebas (validaciones de creación que la ronda 1 no pudo cubrir porque agotó el cupo de locales en revisión, y casos dudosos). Total **345 pruebas**.
- **Criterio:** una prueba falla si el estado HTTP no está entre los esperados o es 5xx/sin respuesta. Algunas pruebas «pasan» pero describen un comportamiento débil (por ejemplo un 201 donde debería haber 400); esas están recogidas como hallazgos con su nota.
- **Limpieza:** al terminar, la base volvió a su estado inicial (34 locales, 1 usuario, 1 cita, 0 opiniones, 29 locales en el feed de Descubre). La prueba de borrado de cuenta crea el usuario fantasma `cuenta-eliminada` (comportamiento de `CuentaService.js`); se borró. Se crearon además dos categorías de prueba por F-18 (`NoExiste`, `Barberías`) y también se borraron.
- **Resultado:** 345 pruebas; 39 «FALLO» brutos (28 en la ronda 1, de los cuales 10 son «no concluyentes», y 11 en la ronda 2), más varias pruebas que «pasan» con un comportamiento débil. Todo se agrupa en **30 hallazgos** (F-01 … F-30, sección 5), de los que 3 ya están corregidos (F-27 a F-29). Las «no concluyentes» del apéndice son pruebas de la ronda 1 que chocaron con el límite de 2 locales en revisión; se repitieron en la ronda 2.

---

## 4. Resumen de hallazgos

### 4.1 Pendientes, por prioridad (actualizado 27-11 noche)

| Prioridad | ID | Sev. | Hallazgo | Por qué en este puesto |
|---|---|---|---|---|
| 1 | F-25 | Media | Límite de ritmo apagado fuera de producción y solo en memoria | Sin él, cualquiera puede llenar la agenda, crear cuentas o tirar el servidor. **Bloquea abrir al público.** |
| 1 | F-24 | Baja | Descubre: `eventos` sin límite claro por IP | Va con F-25 (el mismo límite lo cubre). |
| 2 | F-30 | Media (sube) | Servidor que se cuelga o da 500 si Neon corta la conexión | **Visto hoy con Neon real**: cortes y 500 en sesión y registro. Reintentos y manejo de errores del pool antes de abrir. |
| 3 | F-12 | Media | Caducidad: no avisa a nadie y deja el recordatorio vivo | El cliente no se entera de que su reserva caducó. Se nota en el uso diario. |
| 3 | F-23 | Baja | Recordatorio que sobrevive a la cancelación | Mismo arreglo que F-12 (borrar recordatorios futuros). |
| 4 | F-13 | Media | `horas-ocupadas` no mira si el local existe ni si es público | Fuga pequeña de datos de locales en revisión. Arreglo de pocas líneas. |
| 4 | F-14 | Media | Favoritos de un local no publicado | Igual que F-13. |
| 5 | F-20 | Baja | El dueño no puede abrir una cita por id (solo la lista) | Solo hace falta si el panel lo pide. |
| 6 | F-19 | Baja | UUID mal formado da 400 en vez de 404 (resto) | Es una convención, no un fallo. Decidir y ya. |

### 4.2 Corregidos (y cómo)

| ID | Sev. | Hallazgo | Cómo se corrigió | Commit |
|---|---|---|---|---|
| F-01 | Alta | Borrar cuenta sin contraseña | `hooks.before` en `Config/auth.js`: con contraseña en la cuenta hay que darla siempre; solo Google, sesión de menos de 10 min. `freshAge` sigue en 1 día porque también decide «Dispositivos». | `966df2b` |
| F-02 | Alta | Opiniones sin cita, sin límite y del dueño | `citaId` obligatorio (cita propia, confirmada y pasada), una por cita, dueño y encargados → 403. | `50b4776` |
| F-03 | Alta | Citas que se pisan | Turno = inicio + intervalo del local; solape por turno con candado por local y día (`pg_advisory_xact_lock`). | `afb4d77` |
| F-04 | Alta | Reservas fuera de reglas | Hora en su turno, `HH:MM`, fin ≤ cierre, 90 días máx., notas ≤ 300, sin autoreserva. | `afb4d77` |
| F-05 | Alta | Servicio de otro local por la ruta | 404 si no es de ese local, está desactivado o el local no es público. | `966df2b` |
| F-06 | Media | 500 por precio enorme | Precio ≤ 10 000 000 y `22003` → 400. | `c999186` |
| F-07 | Media | 500 por preferencias enormes | Antelación ≤ 1 semana, radio ≤ 200 km. | `c999186` |
| F-08 | Media | 500 en disponibilidad de día cerrado | Ruta retirada con los profesionales (el front usa `horas-ocupadas`). | `dfdd196` |
| F-09 | Media | Locales casi sin validación | `validarDatosLocal` al crear y al actualizar (nombre, textos, teléfono, coordenadas, turno). | `c999186` |
| F-10 | Media | Horario inválido cerraba la semana | Se valida todo **antes** de borrar el horario anterior. | `c999186` |
| F-11 | Media | Día repetido: 409 con nombre de índice | 400 «Hay un día repetido» y ningún mensaje de Postgres llega al cliente. | `c999186` |
| F-15 | Media | Sin topes de texto y rango | `validarTextoLibre`, topes de servicio, fotos solo de Cloudinary. | `c999186` |
| F-16 | Baja | HTML en comentarios | Etiquetas HTML → 400 (opiniones, locales, servicios). | `50b4776`, `c999186` |
| F-17 | Media | Cualquiera creaba categorías | Ya no se crean: el texto va a `ficha.categoria`. | `c999186` |
| F-18 | Media | Nombre de local vacío | El validador parcial exige nombre no vacío. | `c999186` |
| F-19 | Baja | (parte de profesionales) | Desaparece con el módulo. El resto sigue pendiente. | `dfdd196` |
| F-21 | Media | Pendientes sin límite | 2 por local y 5 en total. | `afb4d77` |
| F-22 | Media | Aceptar/cancelar y `localId` | **Ya estaba bien** (`LOCAL_ID_MISMATCH`); ahora con prueba. | `3379e9c` |
| F-26 | Baja | Paginación sin topes | Página ≤ 500. | `c999186` |
| F-27 | Baja | `PUT` con cuerpo vacío | Antes de hoy. | `2993ed8` |
| F-28 | Baja | Mensaje del índice en opinión duplicada | Antes de hoy. | `2993ed8` |
| F-29 | Baja | Opinión antes de la hora | Antes de hoy. | `2993ed8` |

## 5. Hallazgos en detalle

Formato: **Qué pasa** · **Cómo reproducir** · **Causa** (archivo:línea) · **Dónde tocar** · **Soluciones viables** · **Prueba de regresión**. Las rutas de archivo son relativas a `backend-citaly-main`. `A` = dueño, `B` = cliente, `AG` = agente.

### F-01 · Borrar la cuenta sin contraseña (Alta) — CONFIRMADO · ✅ **CORREGIDO** (`966df2b`, ver 4.2)

- **Qué pasa:** `POST /api/auth/delete-user` con cuerpo `{}` borra la cuenta y responde `200 {"success":true,"message":"User deleted"}`. Quien robe una cookie de sesión puede borrar la cuenta de alguien (las citas pasan a la cuenta «Cuenta eliminada»).
- **Reproducir:** registrar usuario, iniciar sesión, `POST /api/auth/delete-user` `{}` con la cookie.
- **Causa:** Better Auth permite borrar sin contraseña si la sesión es «fresca». `Config/auth.js:167-172` pone `session.freshAge: DIA` (24 h), así que casi cualquier sesión lo es. `Config/auth.js:195-199` activa `deleteUser` sin pedir verificación por correo.
- **Dónde tocar:** `Config/auth.js` (bloque `session` y `user.deleteUser`), front `src/services/auth.js` (la llamada de borrado), `Services/CuentaService.js` (no cambia).
- **Soluciones viables:** (a) bajar `freshAge` a 5–10 min para que la sesión normal no sea «fresca» y Better Auth exija `password`; el front pide la contraseña en la pantalla de borrar cuenta. (b) Añadir `sendDeleteAccountVerification` (correo con enlace de confirmación) — exige Resend configurado. (c) Ambas. Recomendado (a) ahora y (b) cuando el correo funcione.
- **Prueba:** sesión de más de `freshAge` o con `freshAge` bajo → `delete-user` sin contraseña da 400/401; con contraseña correcta 200.

### F-02 · Opiniones manipulables (Alta) — CONFIRMADO · ✅ **CORREGIDO** (`50b4776`, ver 4.2)

- **Qué pasa:** (1) cualquier usuario opina sobre cualquier local **sin haber ido** (201). (2) El mismo usuario puede opinar **infinitas veces** sin cita (201 repetido). (3) El dueño puede opinar sobre **su propio local** (201) e inflar la nota. La nota (`rating_cache`) y la frase destacada de Descubre salen de estas opiniones.
- **Reproducir:** `POST /api/opiniones/local/:id` `{calificacion:1, comentario:"x"}` con una cuenta que nunca reservó; repetir; repetir como dueño.
- **Causa:** `Services/OpinionesService.js:25-64` (`createOpinion`): `citaId` es opcional; solo cuando llega se valida (ser del usuario, local, estado 2 y hora pasada). El índice único `opiniones_cita_unica_idx` solo protege las opiniones **con** `cita_id`.
- **Dónde tocar:** `Services/OpinionesService.js`, `Models/OpinionesModel.js:15-25,72-87`, nueva migración si se añade índice, front `src/services/` de opiniones.
- **Soluciones viables:** (a) **Exigir `citaId`** en la V1 (solo opina quien tuvo cita confirmada y pasada). Es la más simple y la que ya prepara el front («opiniones por cita»). (b) Si se quiere permitir opinar sin cita: índice único parcial `UNIQUE (usuario_id, local_id) WHERE cita_id IS NULL` y no permitir a miembros del local (`LocalMiembrosModel.validarMembresia(localId, usuarioId)` → 403). En ambos casos prohibir que **dueño/encargado** opinen de su local.
- **Prueba:** sin `citaId` → 400/403; mismo usuario dos veces → 409; dueño → 403; con cita pasada y confirmada → 201 una sola vez.

### F-03 · Citas que se pisan en el tiempo (Alta) — CONFIRMADO · ✅ **CORREGIDO** (`afb4d77`, ver 4.2)

- **Qué pasa:** una cita a las 09:30 (30 min) y otra a las 09:45 del mismo día se aceptan ambas. Una cita de 60 min a las 10:00 no bloquea las 10:30.
- **Reproducir:** local sin profesional, dos reservas `horario:"09:30"` y `"09:45"` el mismo día.
- **Causa:** solo se comparan **horas de inicio exactas**: el índice único `citas_local_horario_sin_profesional_idx ON citas (local_id, fecha, horario) WHERE tipo='sin-lugar' AND profesional_id IS NULL AND estado_reserva <> 3` (`Database/Migrations/012PanelDueno.sql:37-39`) y la consulta `SELECT 1 FROM citas WHERE … horario = $3::time` en `Services/DisponibilidadService.js:90-98`. `horas-ocupadas` (`DisponibilidadService.js:213-229`) también lista solo horas de inicio.
- **Dónde tocar:** `Services/DisponibilidadService.js:46-100` (rama sin profesional, que será la única tras la tanda 0), `Services/CitasService.js:150-214`, `Models/CitasModel.js`, y `getHorasOcupadas`.
- **Soluciones viables:** (a) Comprobar solape por intervalo: `inicio_nuevo < fin_existente AND fin_nuevo > inicio_existente` con `fin = horario + demora_minutos * interval '1 minute'` (la cita ya guarda `demora_minutos`). (b) Para evitar la carrera entre dos reservas simultáneas, tomar un `pg_advisory_xact_lock(hashtext(local_id || fecha))` al inicio de la transacción (el índice único ya no basta porque solo cubre igualdad de inicio). (c) Alternativa más rígida: reservar por **casillas** del intervalo del local (`intervalo_minutos`) y ocupar tantas casillas como duración/intervalo, con una tabla `citas_casillas` de clave única; más cambios. Recomendado (a)+(b), manteniendo el índice como red de seguridad.
- **Prueba:** 09:30(30 min) y 09:45 → 409; 09:30(30 min) y 10:00 → 201; 6 reservas simultáneas de la misma hora → 1×201 y 5×409 (esta ya pasa hoy y debe seguir pasando).

### F-04 · Reservas fuera de reglas (Alta) — CONFIRMADO (varios casos) · ✅ **CORREGIDO** (`afb4d77`, ver 4.2)

| Caso probado | Resultado actual | Esperado |
|---|---|---|
| Hora fuera del intervalo del local (`10:15` con intervalo 30) | 201 | 400 |
| Hora con segundos (`10:00:30`) | 201 | 400 |
| Cita de 30 min a las 17:45 con cierre 18:00 | 201 (termina 18:15) | 409 |
| Dos servicios (60 min) a las 17:30 con cierre 18:00 | 201 | 409 |
| Cita a 2 años vista | 201 | 400 (tope de antelación) |
| Notas del cliente de 5000 caracteres | 201 | 400 |
| El dueño reserva en su propio local | 201 | 403 |
| Cita de 30 min a las 17:30 (termina justo al cierre, 18:00) | 201 | 201 (correcto) |
| Hora de cierre (18:00) | 409 | 409 (correcto) |
| Día cerrado (domingo) / 07:00 / 23:30 | 409 | 409 (correcto) |

- **Causa:** la rama sin profesional comprueba solo `abre <= inicio < cierre` (`Services/DisponibilidadService.js:83-86`) y **no** el fin ni el intervalo; `validarHorario` (`Utils/validaciones.js:120-129`) acepta `HH:MM:SS`. No hay tope de antelación ni comprobación de membresía. `notas_cliente` no tiene límite (`Controller/CitasController.js:17-28` lo pasa tal cual).
- **Dónde tocar:** `Services/DisponibilidadService.js:46-100`, `Utils/validaciones.js:120`, `Services/CitasService.js:150`, `Controller/CitasController.js:7-34`.
- **Soluciones viables:** calcular `fin = inicio + sum(duracion_minutos)` y exigir `fin <= cierre`; exigir `(inicio - abre) % intervalo_minutos == 0`; normalizar a `HH:MM` y rechazar segundos; constante `MAX_DIAS_ANTELACION` (p. ej. 60–90); rechazar si `LocalMiembrosModel.validarMembresia(local_id, usuario_id)` devuelve algo; `notas_cliente` ≤ 300 caracteres (recortar o 400).
- **Prueba:** una por fila de la tabla.

### F-05 · Servicio de otro local por la ruta de detalle (Alta) — CONFIRMADO · ✅ **CORREGIDO** (`966df2b`, ver 4.2)

- **Qué pasa:** `GET /api/servicios/<localA>/<servicioDeLocalB>` devuelve 200 con el servicio de B. Es una fuga de datos y rompe el contrato de la ruta (el servicio debe pertenecer al local de la URL; `PUT` y `DELETE` sí lo comprueban).
- **Causa:** `Controller/ServiciosController.js:16-19` llama `ServiciosServices.getServicioById(servicioId)` sin pasar `localId`; `Services/ServiciosServices.js:18-26` no compara `servicio.local_id`.
- **Dónde tocar:** `Controller/ServiciosController.js:16`, `Services/ServiciosServices.js:18`.
- **Solución:** pasar `localId`; si `servicio.local_id !== localId` → 404 `RESOURCE_NOT_FOUND`. Aplicar la misma regla de «solo servicios activos y local público» en lectura anónima.
- **Prueba:** servicio de otro local → 404; el propio → 200.

### F-06 · 500 por precio enorme (Media) — CONFIRMADO · ✅ **CORREGIDO** (`c999186`, ver 4.2)

- **Qué pasa:** `POST /api/servicios/:localId` con `precio: 1e15` → 500 «Error al crear el servicio». `1e9` pasa (201).
- **Causa:** `Database/Migrations/002CitalySchema.sql:142,170` define `precio INTEGER`; `Models/ServiciosModel.js:31` valida `validarNumero(precio, {minimo:0, entero:true})` **sin máximo**, y Postgres lanza `22003` (fuera de rango), que `manejarError` convierte en 500. Lo mismo en `sincronizarServicios` (`Services/localServices.js`, comprueba `Number.isInteger(precio) && precio >= 0` sin tope).
- **Dónde tocar:** `Models/ServiciosModel.js:31` y `Services/localServices.js` (`sincronizarServicios`). Opcional: mapear `22003` → 400 en `Utils/validaciones.js:manejarError`.
- **Solución:** `maximo: 10_000_000` (o el que decida negocio; el INTEGER llega a 2 147 483 647), y `22003`→400 como red general.
- **Prueba:** `precio: 1e15` → 400.

### F-07 · 500 por preferencias enormes (Media) — CONFIRMADO · ✅ **CORREGIDO** (`c999186`, ver 4.2)

- **Qué pasa:** `POST/PUT /api/preferencias/me` con `radio_descubre_m: 99999999999` o `antelacion_recordatorio_minutos: 99999999999` → 500.
- **Causa:** `Models/PreferenciasModel.js:34-46` valida solo `minimo: 1, entero: true`; las columnas son `INTEGER` (`002CitalySchema.sql:236-239`).
- **Dónde tocar:** `Models/PreferenciasModel.js:34-46`.
- **Solución:** `maximo` razonable (`antelacion` ≤ 7 días = 10080; `radio_descubre_m` ≤ 200000) y `22003`→400.
- **Prueba:** valores enormes → 400.

### F-08 · 500 en disponibilidad de un día cerrado (Media) — CONFIRMADO · desaparece con la tanda 0 · ✅ **CORREGIDO** (`dfdd196`, ver 4.2)

- **Qué pasa:** `GET /api/local/:id/disponibilidad?serviciosIds=…&fecha=<domingo>&profesionalId=…` → 500 «Error al validar la disponibilidad por servicios».
- **Causa:** `Services/DisponibilidadService.js:235-301`: `HorariosModel.getHorarioByDay` devuelve la fila del día cerrado (`cerrado=true`, `abre`/`cierra` nulos) y el código llama `convertirHoraAMinutos(horarioDelDia.abre)` con `null` (`:300-301`) → `TypeError`.
- **Qué hacer:** al quitar profesionales, esta ruta debe **rediseñarse sin profesional**: devolver las casillas libres del día considerando duración total de los servicios, citas ya reservadas (solape), hora actual si es hoy y cierre. Guardia obligatoria: `if (!horarioDelDia || horarioDelDia.cerrado || !horarioDelDia.abre) return [];`. Si el front solo usa `horas-ocupadas`, se puede retirar esta ruta.
- **Prueba:** día cerrado → 200 `[]`.

### F-09 · Locales casi sin validación (Media) — CONFIRMADO · ✅ **CORREGIDO** (`c999186`, ver 4.2)

| Campo | Entrada probada | Resultado | Causa |
|---|---|---|---|
| `nombre` | 5000 caracteres (crear y actualizar) | 201 / 200 | columna `TEXT`, sin límite |
| `nombre` | `'   '` al **actualizar** | 200, queda `''` | ver F-18 |
| `lat` | `999` al crear, `500` al actualizar | 201 / 200 | columna `NUMERIC(9,6)` admite hasta 999.999999; sin rango |
| `lng` | sin rango | — | idem |
| `telefono` | `'abc'` al crear | 201 | sin formato (columna `VARCHAR(30)`: >30 caracteres daría 500, **sin probar**) |
| `intervalo_minutos` | `7` y `5000` | 201 | solo `CHECK (>0)` en `002CitalySchema.sql:92` |
| `descripcion` | 50 000 caracteres | 201 | sin límite |
| `intervalo_minutos` | `0` y `-30` | 400 | bien (lo frena el CHECK) |
| `nombre` | vacío al **crear** | 400 | bien (`LocalesModel.createLocal` valida nombre) |
| `categoria_id` | UUID inexistente | 400 | bien |
| servicio | precio negativo / sin nombre | 400 | bien |

- **Causa:** `Models/LocalesModel.js:135-140` (`createLocal`) solo valida `nombre`; `Models/LocalesModel.js:166-170` (`updateLocal`) llama a `validarLocal`, que solo comprueba que sea un objeto (`:32-34`). No hay validador central de los campos de `camposLocalizables` (`:5-23`).
- **Dónde tocar:** `Models/LocalesModel.js`, `Utils/validaciones.js` (nuevo `validarDatosLocal(local, { parcial })`), llamado desde `createLocal`, `updateLocal` y `LocalServices.createLocalWithDetails/updateLocalWithDetails`.
- **Solución:** un único validador con: `nombre` 2–80 y no vacío; `descripcion` ≤ 1000; `direccion` ≤ 160; `lat` −90…90 y `lng` −180…180 (o `null`); `telefono`/`whatsapp` ≤ 30 y solo dígitos, `+`, espacios, guiones; `intervalo_minutos` entre 5 y 240 y múltiplo de 5; `provincia` de una lista; `tipo` ya validado. Mapear `22001` (valor demasiado largo) y `22003` a 400.
- **Prueba:** una por fila.

### F-10 · `PUT horario` con día inválido deja el local cerrado toda la semana (Media) — CONFIRMADO · ✅ **CORREGIDO** (`c999186`, ver 4.2)

- **Qué pasa:** `PUT /api/local/:id` con `{ horario: { dias: ['q'], abre:'09:00', cierra:'18:00' } }` devuelve 200 y el local queda **cerrado los 7 días**. `abre > cierra` y horas con formato inválido sí dan 400.
- **Causa:** `Services/localServices.js:69-88` (`reescribirHorarios`): valida solo que `dias` sea array y el formato `HH:MM`; luego borra todos los horarios y recorre `DIAS` fijo (`dias.includes(dia)`), así que un valor desconocido simplemente no abre ningún día. El caso `abre > cierra` sí devolvió 400 en las pruebas (lo frena `HorariosModel.createHorario` al insertar, ya con los horarios previos borrados dentro de la transacción, que se revierte); conviene validarlo antes de borrar.
- **Dónde tocar:** `Services/localServices.js:69-88`.
- **Solución:** validar que `dias` ⊆ `DIAS` y no esté vacío, `abre < cierra`, antes de borrar; hacerlo dentro de la misma transacción (ya lo está).
- **Prueba:** día `'q'` → 400 y el horario previo no cambia.

### F-11 · Horario duplicado al crear: 409 con el nombre del índice (Media) — CONFIRMADO · ✅ **CORREGIDO** (`c999186`, ver 4.2)

- **Qué pasa:** crear un local con `horariosData` con dos filas del mismo `dia_semana` → 409 «duplicate key value violates unique constraint "local_horarios_local_id_dia_semana_key"».
- **Causa:** `Services/localServices.js` (`createLocalWithDetails`, bucle `HorariosModel.createHorario`) no comprueba duplicados; el error de Postgres sube tal cual (`manejarError` pone el mensaje original).
- **Solución:** validar duplicados antes de insertar (400 «Hay un día repetido en el horario»). Además, en `manejarError` (`Utils/validaciones.js:75-100`) **no devolver nunca `error.message` de Postgres al cliente**: usar un mensaje genérico por código (`23505` → «Ese dato ya existe»). Esto cierra también F-28 de forma general.
- **Prueba:** día repetido → 400 con mensaje claro.

### F-12 · Caducidad de citas: sin aviso y con recordatorio vivo (Media) — CONFIRMADO

- **Qué pasa:** la pendiente de más de 15 min se cancela sola (bien: `estado_reserva=3`, `cancelada_por='tiempo'`; aceptar después da 409 `CITA_CADUCADA`), pero **nadie recibe aviso**. Las notificaciones de esa cita eran `reserva_nueva` y `recordatorio`; el recordatorio programado sigue ahí aunque la cita esté cancelada.
- **Causa:** `Jobs/index.js:28-41` hace solo un `UPDATE` sin `RETURNING` ni notificaciones.
- **Dónde tocar:** `Jobs/index.js:28-41`, `Services/NotificacionesServices.js` (nuevo tipo `cita_caducada`; ya existen `crearNotificacionCancelacion` y `…Local`).
- **Solución:** en una transacción, `UPDATE … RETURNING id, usuario_id, local_id, fecha, horario`, crear notificación al cliente («El local no contestó a tiempo») y al local si procede, y borrar recordatorios futuros (`DELETE FROM notificaciones WHERE cita_id = ANY($1) AND tipo = 'recordatorio' AND programada_para > now()`). Añadir `tipo` nuevo al `adaptarNoti()` del front.
- **Prueba:** forzar `creada_en` 20 min atrás → tras ≤ 60 s hay aviso al cliente y no quedan recordatorios.

### F-13 · `horas-ocupadas` no mira el local (Media) — CONFIRMADO

- **Qué pasa:** `GET /api/local/:id/horas-ocupadas?desde&hasta` responde 200 (`[]`) para un id inexistente y también para un local en revisión.
- **Causa:** `Services/DisponibilidadService.js:213-229` no consulta el local.
- **Solución:** `getLocalById` y aplicar la regla pública (404 si no existe o no es público salvo para miembros).
- **Prueba:** inexistente/no publicado → 404.

### F-14 · Favoritos de un local no publicado (Media) — CONFIRMADO

- **Qué pasa:** `POST /api/favoritos/me/locales/:id` con un local en revisión de otro dueño → 201.
- **Causa:** `Services/favoritoService.js:22` usa `LocalesModel.getLocalById` (cualquier estado).
- **Solución:** aplicar `FILTRO_PUBLICO` (o permitir al dueño). Revisar también el listado: un favorito de un local luego ocultado debería filtrarse.
- **Prueba:** local en revisión → 404.

### F-15 · Sin topes de texto y rango en varios campos (Media) — CONFIRMADO · ✅ **CORREGIDO** (`c999186`, ver 4.2)

| Dónde | Entrada | Resultado hoy | Propuesta |
|---|---|---|---|
| `notas_cliente` (cita) | 5000 car. | 201 | ≤ 300 |
| servicio `nombre` (`POST /api/servicios`) | 5000 car. | 201 | ≤ 60 (ya se corta a 60 en `sincronizarServicios`, no en `createServicio`) |
| servicio `duracion_minutos` | 99 999 | 201 | 5–480 |
| servicio `imagen_url` | `http://evil.example/x.png` | 201 | solo el host de Cloudinary o `null` |
| servicio `precio` | `1e9` | 201 | tope del F-06 |
| opinión `comentario` | 20 000 car. | 201 (se **recorta en silencio a 600** en `Models/OpinionesModel.js:82`) | 400 si > 600 |
| `descripcion` de local | 50 000 car. | 201 | ≤ 1000 |

- **Causa:** `Models/ServiciosModel.js:20-48` valida tipo pero no longitud/host; el único tope global es `express.json({limit:'100kb'})` (`App.js:46`).
- **Solución:** helpers `validarLongitud(valor, max, campo)` y `validarUrlCloudinary`, usados por los modelos.

### F-16 · HTML en comentarios (Baja) — CONFIRMADO · ✅ **CORREGIDO** (`50b4776`, ver 4.2)

- `POST /api/opiniones/local/:id` con `<script>alert(1)</script>` → 201 y se guarda tal cual. React escapa por defecto, pero hay otros consumidores (correos, push, panel de admin futuro).
- **Dónde:** `Models/OpinionesModel.js:72-87`. **Solución:** quitar etiquetas (`replace(/<[^>]*>/g, '')`) o rechazar con 400. Hacerlo también para `nombre` de local/servicio.

### F-17 · Cualquiera crea categorías sin límite (Media) — CONFIRMADO · ✅ **CORREGIDO** (`c999186`, ver 4.2)

- **Qué pasa:** crear un local con `categoria: 'NoExiste'` (por nombre) **crea una categoría nueva** (`en_feed=false`) y responde 201. Cada usuario puede llenar la tabla `categorias` de basura.
- **Causa:** `Services/localServices.js:48-66` (`categoriaPorNombre`) hace `INSERT INTO categorias` si no existe el nombre. Comentario del código: «se crea fuera del feed hasta que alguien del equipo la revise».
- **Solución:** (a) no crear: mapear a una categoría «Otra» fija y guardar el texto en `ficha`; (b) o limitar a 1 categoría nueva por usuario/día y solo con el local aprobado; (c) aprobación manual por un agente.
- **Prueba:** nombre inexistente → local con categoría «Otra», sin filas nuevas en `categorias`.

### F-18 · Nombre de local vacío al actualizar (Media) — CONFIRMADO · ✅ **CORREGIDO** (`c999186`, ver 4.2)

- `PUT /api/local/:id` con `{ localData: { nombre: '   ' } }` → 200; el local queda con nombre `''` (visible en la prueba: la limpieza por nombre dejó de encontrarlo). Es consecuencia de F-09 (`updateLocal` sin validar). Mismo arreglo; añadir `nombre` ≠ vacío en el validador parcial.

### F-19 · Códigos de error imprecisos (Baja) — CONFIRMADO · parte desaparece con la tanda 0

- UUID mal formado en la ruta devuelve **400** (`El cita_id debe ser un UUID válido`) en vez de **404**: `GET /api/citas/xx`, `GET /api/profesionales/xx`, `DELETE /api/opiniones/xx`.
- Asignar dos veces un servicio a un profesional → 400 (en vez de 200 idempotente o 409); quitar de nuevo → 400 (en vez de 404). Igual con amenidades al quitar de nuevo (`La amenidad no está asignada al local`, 400).
- Es una decisión de convenciones: o se mantiene (400 = formato inválido) o se pasa a 404. No urgente. Lo de profesionales desaparece con la tanda 0.

### F-20 · El dueño no puede abrir una cita por id (Baja) — CONFIRMADO

- `GET /api/citas/:citaId` como dueño/encargado del local de la cita → 403; solo la ve el cliente. El dueño solo la ve en la lista `GET /api/citas/local/:localId`. Si el front necesita detalle de una cita en el panel, falta permitirlo a miembros del local (`validarPermisoCita` en `Services/CitasService.js`).

### F-21 · Sin límite de citas pendientes por cliente (Media) — SOSPECHA con evidencia · ✅ **CORREGIDO** (`afb4d77`, ver 4.2)

- Un mismo cliente creó varias citas distintas en el mismo local en minutos (201 cada una; no se probó un tope porque no existe ninguna regla). Un cliente malicioso puede bloquear toda la agenda de un local con reservas pendientes que el local no podrá contestar a tiempo (caducan a los 15 min, pero se pueden repetir sin límite).
- **Solución:** máximo de pendientes por usuario y local (p. ej. 2) y por usuario en total (p. ej. 5); más el límite de ritmo del punto F-25.

### F-22 · Aceptar/cancelar y el `localId` de la ruta (Media) — POR REVISAR · ✅ **CORREGIDO** (`3379e9c`, ver 4.2)

- Las rutas `PATCH /api/citas/:citaId/local/:localId/confirmar|cancelar` usan `verifyRole` con el `localId` de la URL (membresía en **ese** local) pero el servicio tiene que comprobar además que `cita.local_id === localId`. Se probó el camino feliz y los permisos del rol, **no** el cruce «miembro del local A actúa sobre una cita del local B pasando `localId=A`». Hay que verificarlo en `Services/CitasService.js` (`confirmarCita`, `cancelarCita`) y escribir la prueba.

### F-23 · Recordatorios que sobreviven a la cancelación (Baja) — SOSPECHA

- Los recordatorios (`NotificacionesService.crearNotificacionRecordatorioByUsuario/ByLocal`, creados al reservar en `Services/CitasService.js:201-203`) tienen `programada_para`. Se confirmó que sobreviven a la caducidad (F-12); no se midió si la cancelación manual los elimina (`cancelarCita`, `Services/CitasService.js:282+`). Verificar y cubrir con una prueba.

### F-24 · Eventos de Descubre (Baja) — POR MEDIR

- `POST /api/descubre/eventos` acepta anónimos (`optionalAuth`). Las pruebas de payload basura (no lista, 5000 eventos) no devolvieron 5xx, pero **no se midió** el coste ni si se puede inflar `impresiones`/ranking sin límite desde una IP. Va unido a F-25.

### F-25 · Límite de ritmo (Media) — CONFIRMADO como ausencia

- `Config/auth.js:205-218`: `rateLimit.enabled` solo en producción (o `AUTH_RATE_LIMIT=true`), en memoria, solo rutas de Better Auth. El resto de endpoints no tiene límite (no hay `express-rate-limit`). Por eso **no se pudo probar** el límite de intentos de login/registro (apartado 7).
- **Solución:** `express-rate-limit` global y por usuario en escrituras (`POST /api/citas/servicios`, opiniones, locales, eventos), contador de Better Auth en `database` si hay más de un servidor, y Cloudflare Turnstile en registro y recuperar contraseña (`docs/pendientes-backend.md`, sección «Protección contra bots»).

### F-26 · Paginación sin topes (Baja) — POR MEDIR · ✅ **CORREGIDO** (`c999186`, ver 4.2)

- `GET /api/local?page=-3`, `page=0`, `page=abc`, `page=999999999999` respondieron 200 (se normalizan con `normalizarPagina`). Revisar que `OFFSET` enorme no cueste (límite de página máxima) y que el tamaño de página no lo elija el cliente.

### F-27 · `PUT /api/local/:id` con cuerpo vacío — YA CORREGIDO (commit `2993ed8`)

- Antes devolvía 200 sin cambios; ahora 400 «No hay datos para actualizar del local.». `Services/localServices.js` (`updateLocalWithDetails`).

### F-28 · Mensaje del índice en la opinión duplicada — YA CORREGIDO (commit `2993ed8`)

- Ahora `409 OPINION_DUPLICADA` «Ya dejaste tu opinión de esta cita.» (`Services/OpinionesService.js`). Sigue vigente la solución general de F-11 (no filtrar mensajes de Postgres).

### F-29 · Opinión antes de la hora de la cita — YA CORREGIDO (commit `2993ed8`)

- Ahora `409 CITA_FUTURA` hasta que llega la hora (`instanteDeHoraLocal`, `Utils/horaLocal.js`).

### F-30 · Servidor colgado si Neon corta la conexión (Baja) — CONFIRMADO en el entorno de pruebas

- Con la red mal configurada, `Config/auth.js` (pool `pg` propio, `connectionTimeoutMillis: 10000`, sin reintentos) y `Config/db.js` (5000 ms) devuelven 500 o se quedan sin responder; se recuperó al reiniciar. En producción conviene: `pool.on('error')` para no tumbar el proceso, `statement_timeout`, reintento con retroceso en el primer arranque, y `/health` que compruebe la base (`health.routes.js`).

---

## 6. Lo que funciona (no romper)

Pruebas que cumplieron lo esperado y que **deben seguir pasando** al tocar el código:

- **Seguridad y permisos:** no se puede escalar privilegios con `PATCH /api/usuarios/me` (`admin_role` no cambia); un cliente no puede aprobar locales (403) ni el dueño aprobarse a sí mismo; un cliente que intenta cambiar el `admin_role` de otro usuario recibe 403/404; rutas protegidas devuelven 401 sin sesión; `encargado` puede editar el local, ver citas y aceptarlas pero **no** borrar el local (403); un no miembro no edita ni borra (403); `update-user` no acepta `image` arbitraria; `change-password` con la actual incorrecta → 400; CORS no refleja orígenes ajenos; `helmet` activo y sin `X-Powered-By`; JSON roto → 400; cuerpo > 100 kb → 413; ruta inexistente → 404 JSON.
- **Auth:** registro con email inválido / contraseña corta / sin nombre / email repetido (también con mayúsculas) → 400/422; login incorrecto 401/400; `sign-out` invalida la sesión; borrar cuenta anonimiza las citas en `cuenta-eliminada` y borra sesiones/cuentas.
- **Locales:** nace en revisión; anónimo y otro usuario ven 404 hasta aprobar y completar; oculto no sale en Descubre; límites de 5 locales y 2 en revisión (409 `LIMITE_REVISION` / `LIMITE_LOCALES`); campos de sistema (`estado`, `id`, `usuario_id`, `rating_cache`, `completado`) **no** se pueden forzar al crear ni al actualizar; ficha con base64 → 400, ficha > 60 KB → 413; `tipo` inválido → 400; `PUT` vacío → 400.
- **Citas:** doble reserva de la misma hora → 409; **6 reservas simultáneas de la misma hora → 1×201 y 5×409**; fecha pasada → 400; día cerrado/07:00/23:30/hora de cierre → 409; servicio de otro local → 400; servicios repetidos → 400; local en revisión → 409 `LOCAL_NOT_BOOKABLE`; transiciones 0→1→2 y 3 con 409 en las ilegales; confirmar un estado equivocado → 400; asistencia (valor no booleano 400, cita futura 409 `CITA_FUTURA`, pasada 200 true/false/null, ajena 403); cancelar libera la hora; **caducidad a los 15 min** (`cancelada_por='tiempo'`) y `CITA_CADUCADA` al aceptar después.
- **Opiniones:** estrellas 0 y 6 → 400; decimales → 400; cita ajena → 403; cita no confirmada → 409; una por cita; al borrar, `opiniones_count` y `rating_cache` se recalculan; borrar ajena 403; borrar permite volver a opinar de la cita.
- **Servicios/otros:** crear/editar/borrar con permisos; precio negativo/texto/sin nombre/duración 0 → 400; precio con decimales → 400; `media` firmas solo para miembros; `registrar imagen` con `publicId` ajeno → 400; notificaciones: marcar/borrar solo las propias; favoritos: añadir/listar/quitar; preferencias: tema inválido, valores negativos → 400; `horas-ocupadas` con rangos inválidos o > 62 días → 400.
- **Descubre:** `resumen` (29 locales en el feed con la base de pruebas), `categorias`, `promociones`; inyección en `provincia` y `name` no rompe; eventos basura no dan 5xx.

---

## 7. Lo que NO se pudo probar

- **Límite de intentos de login/registro/recuperar contraseña** (solo activo en producción o con `AUTH_RATE_LIMIT=true`; no se tocó el `.env`).
- **Envío real de correos** (Resend sin clave: salen por consola), verificación de correo obligatoria (`AUTH_REQUIRE_EMAIL_VERIFICATION`), recuperar contraseña de extremo a extremo.
- **Inicio de sesión con Google** (OAuth).
- **Subidas reales a Cloudinary** (solo firmas y rechazos); borrado de fotos de perfil al borrar la cuenta.
- **Locales de tipo `mesa`:** no hay ruta para crear mesas, ni reservas `con-lugar` desde la API (solo existe `sin-lugar`); la única prueba (reservar servicios en un local de mesas) dio 409.
- **Jobs de ranking (diario) y exposición (cada hora):** están **apagados** en `Server.js`; solo corre la caducidad de citas.
- **Plano de sala, «Avísame cuando abra», feed paginado de Descubre y «Proponer otra hora»:** el backend no los tiene aún (`docs/pendientes-backend.md`).
- **Producción:** cookies `Secure`, `trust proxy`, CORS con el dominio real, `NODE_ENV=production`.
- **Carga y rendimiento** (solo 6 peticiones simultáneas).
- **Columnas sin prueba de desbordamiento:** `telefono VARCHAR(30)` con más de 30 caracteres, `lat/lng ≥ 1000` (probable 500, ver F-09).

---

## 8. Plan por prioridad (reordenado el 27-11 por la noche)

**Reglas de cada paso:** enseñar el plan antes de tocar; cada arreglo con su prueba en `Tests/` (ver `Tests/LEEME.md` del backend); **una rama por tema** desde `main` y su PR para Erdwin; migraciones primero en una rama de Neon o con copia; actualizar este documento.

### Ya hecho (27-11)
- ~~Tanda 0 — Quitar profesionales~~ (`dfdd196` + 013 en Neon)
- ~~Tanda 1 — Validación central~~ (`c999186`)
- ~~Tanda 2 — Reglas de reserva~~ (`afb4d77`), con la decisión **turno = inicio + intervalo**
- ~~Tanda 3 — Opiniones~~ (`50b4776`)
- ~~F-01 y F-05~~ (`966df2b`), ~~F-22~~ comprobado (`3379e9c`)
- ~~Tanda 7, primera parte~~: hay suite (`Tests/`, 54 pruebas). Falta llevarla a CI.

### Pendiente, en este orden

| # | Qué | Incluye | Por qué ahora |
|---|---|---|---|
| 1 | **Límite de ritmo y antibots** | F-25, F-24: `express-rate-limit` global y por usuario en escrituras (citas, opiniones, locales, eventos); contador de Better Auth en base de datos; Cloudflare Turnstile en registro y recuperar contraseña. | Sin esto no se puede abrir al público. |
| 2 | **Robustez con Neon** | F-30: `pool.on('error')`, reintento con espera en las consultas que fallan por corte, `statement_timeout`, `/health` que mire la base, revisar los tiempos de conexión (5 s se queda corto con una red lenta). | Visto hoy: cortes y 500 con Neon real. |
| 3 | **«Proponer otra hora» en el backend** | Estado 4, rutas `proponer-hora` y `aceptar-hora`, caducidad y avisos (detalle en `docs/pendientes-backend.md`). | El front ya lo usa y el servidor no lo tiene. |
| 4 | **Avisos de citas** | F-12 (aviso al caducar y borrar recordatorios), F-23 (recordatorios al cancelar). | El cliente no se entera de que su reserva cayó. |
| 5 | **Correo real** | Resend con dominio, `AUTH_REQUIRE_EMAIL_VERIFICATION=true`, recuperar contraseña probada. | Sin correo no hay recuperación de cuenta. |
| 6 | **Fugas pequeñas** | F-13 (`horas-ocupadas` solo de locales públicos o para miembros), F-14 (favoritos). | Rápido, pocas líneas. |
| 7 | **Panel del agente** | Locales en revisión, aprobar o rechazar con motivo, moderar opiniones y categorías (hoy hay textos de categoría en `ficha.categoria` por revisar). | Hoy solo existe la ruta de aprobar. |
| 8 | **Operación** | Runner de migraciones (`schema_migrations`), suite en GitHub Actions, variables de producción (`NODE_ENV`, `trust proxy`, cookies, CORS), decidir si se encienden los jobs de ranking y exposición. | Necesario para desplegar sin sustos. |
| 9 | **Detalles** | F-20 (el dueño abre una cita por id, si el panel lo necesita), resto de F-19 (decidir 400 o 404). | Bajo impacto. |

### Backlog de producto (después de lo anterior)

| # | Punto | Qué incluye |
|---|---|---|
| 1 | **Mesas y plano de sala** | `PUT/GET` del plano, reservas `con-lugar`, `mesas-ocupadas`, no borrar mesa con reservas futuras. Es la parte más grande que queda. |
| 2 | **Descubre: feed paginado y jobs** | `GET /descubre?cursor=&limite=`, quitar `locales.json` del JS inicial, encender ranking y exposición. |
| 3 | **«Avísame cuando abra»** | Tabla `avisos_apertura`, rutas, tarea por minuto, aviso `abre_local`. |
| 4 | **Fotos con Cloudinary de principio a fin** | Firmar, registrar, borrar, límites; fuera Unsplash. |
| 5 | **Suscripciones** | Hoy solo en el navegador. |
| 6 | **Observabilidad** | Logs con `requestId`, alertas de 5xx, métricas de reservas. |

---

## Apéndice: las 345 pruebas

Lectura de las columnas: **HTTP** = estado devuelto; **Esperado** = estados que se consideran correctos (separados por `/`); **Resultado** = `OK` si cumple; en `FALLO` se copia el mensaje que devolvió el servidor. Las notas tras `·` en filas `OK` indican comportamientos débiles que se explican en la sección 5. «NO CONCLUYENTE» = la prueba no llegó a ejecutar su caso por el límite de 2 locales en revisión (se repitió en la ronda 2).

### Ronda 1 (ancha, 294 pruebas)

294 pruebas · 266 cumplen lo esperado · 28 no.

**general**

| Prueba | HTTP | Esperado | Resultado |
|---|---|---|---|
| health | 200 | 200 | OK |
| ruta inexistente -> 404 JSON | 404 | 404 | OK |
| JSON roto en POST -> 400 | 400 | 400/422 | OK |
| JSON roto en ruta propia -> 400 | 400 | 400 | OK |
| cuerpo > 100kb -> 413 | 413 | 413 | OK |
| id con caracteres raros en ruta | 404 | 400/404 | OK |
| id uuid mal formado en citas | 400 | 400/404 | OK |
| sin cabecera X-Powered-By | 200 | 200 | OK · X-Powered-By presente |
| cabecera de seguridad (helmet) | 200 | 200 | OK |
| CORS: origen ajeno no recibe allow-origin | 200 | 200 | OK |
| POST sin Origin a auth | 403 | 200/403 | OK |

**auth**

| Prueba | HTTP | Esperado | Resultado |
|---|---|---|---|
| registro con email inválido | 400 | 400/422 | OK |
| registro con contraseña corta | 400 | 400/422 | OK |
| registro sin nombre | 400 | 400/422 | OK |
| registro con email repetido | 422 | 400/409/422 | OK |
| registro con mayúsculas del mismo email | 422 | 400/409/422 | OK · email duplicado cambiando mayúsculas |
| login contraseña incorrecta | 401 | 401/400 | OK |
| login usuario inexistente | 401 | 401/400 | OK |
| login sin cuerpo | 400 | 400/401/422 | OK |
| get-session con sesión | 200 | 200 | OK |
| list-sessions | 200 | 200 | OK |
| cambiar contraseña con la actual mal | 400 | 400/401 | OK |
| update-user nombre | 200 | 200 | OK |
| update-user con image arbitraria (debe rechazarse) | 400 | 400/403/422 | OK · la foto va por /usuarios/me/foto |
| olvidé contraseña, email inexistente (sin filtrar) | 200 | 200/400 | OK |
| sign-out | 200 | 200 | OK |
| tras sign-out no hay sesión | 401 | 401 | OK |
| revoke-session sin token | 400 | 400/200 | OK |
| delete-user sin contraseña | 200 | 400/401/200 | OK |

**usuarios**

| Prueba | HTTP | Esperado | Resultado |
|---|---|---|---|
| GET me | 200 | 200 | OK |
| PATCH me teléfono válido | 200 | 200 | OK |
| PATCH me teléfono con letras | 400 | 400 | OK |
| PATCH me sin cuerpo | 400 | 400 | OK |
| PATCH me intenta rol_base/admin_role | 400 | 400/200 | OK · comprobar abajo que no cambió |
| no se pudo escalar privilegios | 200 | 200 | OK · admin_role=cliente |
| cliente no puede cambiar admin_role de otro | 403 | 403/404 | OK |
| foto firma | 200 | 200/201 | OK |
| poner foto con publicId ajeno | 403 | 400/403/404/409 | OK |
| quitar foto sin foto | 200 | 200/204/404/409 | OK |

**preferencias**

| Prueba | HTTP | Esperado | Resultado |
|---|---|---|---|
| GET sin crear | 404 | 200/404 | OK |
| POST crear | 201 | 200/201 | OK |
| POST repetido | 409 | 409/400 | OK |
| PUT tema inválido | 400 | 400 | OK |
| PUT antelación negativa | 400 | 400 | OK |
| PUT radio absurdo | 500 | 400 | FALLO — No se pudieron actualizar las preferencias. |
| PUT válido | 200 | 200 | OK |
| PUT sin cuerpo | 400 | 400 | OK |
| sin sesión | 401 | 401 | OK |

**locales**

| Prueba | HTTP | Esperado | Resultado |
|---|---|---|---|
| crear local L1 | 201 | 201 | OK |
| crear sin sesión | 401 | 401 | OK |
| crear con categoría inexistente | 201 | 400/201 | OK · si crea, queda sin categoría |
| crear con categoria_id inválido | 409 | 400 | NO CONCLUYENTE (cupo agotado; repetida en la tanda 2) |
| crear con nombre vacío | 409 | 400 | NO CONCLUYENTE (cupo agotado; repetida en la tanda 2) |
| crear con nombre de 5000 chars | 409 | 400 | NO CONCLUYENTE (cupo agotado; repetida en la tanda 2) |
| crear con intervalo 0 | 409 | 400 | NO CONCLUYENTE (cupo agotado; repetida en la tanda 2) |
| crear con intervalo negativo | 409 | 400 | NO CONCLUYENTE (cupo agotado; repetida en la tanda 2) |
| crear con lat fuera de rango | 409 | 400 | NO CONCLUYENTE (cupo agotado; repetida en la tanda 2) |
| crear con tipo inválido | 400 | 400 | OK |
| crear con servicio de precio negativo | 409 | 400 | NO CONCLUYENTE (cupo agotado; repetida en la tanda 2) |
| crear con horario inválido (abre>cierra) | 409 | 400 | NO CONCLUYENTE (cupo agotado; repetida en la tanda 2) |
| crear con campos de sistema (estado/oculto/id) | 409 | 201/400 | NO CONCLUYENTE (cupo agotado; repetida en la tanda 2) |
| mios (dueño) | 200 | 200 | OK |
| mios de otro no ve mis locales | 200 | 200 | OK |
| GET en revisión: dueño | 200 | 200 | OK |
| GET en revisión: anónimo | 404 | 404 | OK |
| GET en revisión: otro usuario | 404 | 404 | OK |
| GET local inexistente | 404 | 404 | OK |
| aprobar: cliente (403) | 403 | 403 | OK |
| aprobar: dueño no puede aprobarse | 403 | 403 | OK |
| aprobar: agente | 200 | 200 | OK |
| aprobar de nuevo (ya aprobado) | 404 | 404 | OK |
| aprobar inexistente | 404 | 404 | OK |
| GET aprobado pero sin completar: anónimo | 404 | 404 | OK · regla: aprobado y completado |
| completar local (dueño) | 200 | 200 | OK |
| GET público ya visible | 200 | 200 | OK |
| GET lista incluye el local | 200 | 200 | OK · búsqueda por nombre |
| lista page=0 | 400 | 200/400 | OK |
| lista page=-3 | 400 | 200/400 | OK |
| lista page=abc | 400 | 200/400 | OK |
| lista page enorme | 200 | 200/400 | OK |
| lista categoryId inválido | 400 | 200/400 | OK |
| lista name con inyección | 200 | 200 | OK |
| lista name con comodín % | 200 | 200 | OK |
| update: cliente no miembro | 403 | 403 | OK |
| update sin sesión | 401 | 401 | OK |
| update con tipo inválido | 400 | 400 | OK |
| update con foto base64 en ficha | 400 | 400 | OK |
| update con ficha de 70 KB | 413 | 400 | FALLO — La ficha del local es demasiado grande. |
| update horario válido | 200 | 200 | OK |
| update horario inválido | 200 | 400 | FALLO |
| restaurar horario completo | 200 | 200 | OK |
| update lat/lng fuera de rango | 200 | 400 | FALLO |
| update nombre vacío | 200 | 400 | FALLO |
| update oculto true | 200 | 200 | OK |
| oculto: anónimo ya no lo ve | 404 | 404 | OK |
| oculto: no sale en Descubre | 200 | 200 | OK |
| volver a mostrar | 200 | 200 | OK |
| amenidades de local | 200 | 200 | OK |
| borrar: no dueño | 403 | 403 | OK |
| borrar sin sesión | 401 | 401 | OK |
| borrar local (dueño) L5 | 204 | 200/204 | OK |
| tras borrar, ya no existe | 404 | 404 | OK |

**amenidades**

| Prueba | HTTP | Esperado | Resultado |
|---|---|---|---|
| asignar válida | 201 | 200/201 | OK |
| asignar repetida | 400 | 409/400 | OK |
| asignar como cliente | 403 | 403 | OK |
| quitar | 200 | 200/204 | OK |
| quitar de nuevo | 400 | 404/200/204 | FALLO — La amenidad no está asignada al local. |
| asignar sin cuerpo | 400 | 400 | OK |
| asignar inexistente | 404 | 404/400 | OK |

**limites**

| Prueba | HTTP | Esperado | Resultado |
|---|---|---|---|
| L2 en revisión | 201 | 201 | OK |
| L3 en revisión | 409 | 201 | NO CONCLUYENTE (cupo agotado; repetida en la tanda 2) |
| cuarto en revisión (sys cuenta) -> 409 | 409 | 409 | NO CONCLUYENTE (cupo agotado; repetida en la tanda 2) |
| L4 tras aprobar | 201 | 201 | OK |
| L5 | 409 | 201/409 | NO CONCLUYENTE (cupo agotado; repetida en la tanda 2) |
| más de 5 locales -> 409 | 409 | 409 | NO CONCLUYENTE (cupo agotado; repetida en la tanda 2) · tiene 4 |

**servicios**

| Prueba | HTTP | Esperado | Resultado |
|---|---|---|---|
| listar | 200 | 200 | OK |
| listar page=-1 | 200 | 200/400 | OK |
| detalle | 200 | 200 | OK |
| detalle en otro local | 200 | 404 | FALLO |
| detalle uuid inválido | 400 | 400 | OK |
| crear como cliente | 403 | 403 | OK |
| crear sin sesión | 401 | 401 | OK |
| crear precio negativo | 400 | 400 | OK |
| crear precio texto | 400 | 400 | OK |
| crear nombre vacío | 400 | 400 | OK |
| crear duración 0 | 400 | 400 | OK |
| crear duración enorme | 201 | 400/201 | OK · si crea, no hay tope de duración |
| crear con imagen_url ajena | 201 | 400/201 | OK · si crea, acepta URLs externas |
| crear precio enorme | 500 | 400/201 | FALLO — Error al crear el servicio |
| crear válido | 201 | 201 | OK |
| editar válido | 200 | 200 | OK |
| editar sin cuerpo | 400 | 400 | OK |
| editar como cliente | 403 | 403 | OK |
| borrar como cliente | 403 | 403 | OK |
| borrar | 204 | 200/204 | OK |
| borrar de nuevo | 404 | 404 | OK |

**profesionales**

| Prueba | HTTP | Esperado | Resultado |
|---|---|---|---|
| crear como cliente | 403 | 403 | OK |
| crear sin nombre | 400 | 400 | OK |
| crear rating 99 | 400 | 400 | OK |
| crear rating negativo | 400 | 400 | OK |
| crear | 201 | 201 | OK |
| crear segundo | 201 | 201 | OK |
| listar por local | 200 | 200 | OK |
| detalle | 200 | 200 | OK |
| detalle inexistente | 400 | 404 | FALLO — El profesional_id debe ser un UUID válido. |
| editar | 200 | 200 | OK |
| editar profesional de otro local | 400 | 404/400/403 | OK |
| asignar servicio | 200 | 200/201 | OK |
| asignar servicio repetido | 400 | 409/200 | FALLO — El servicio ya está asignado al profesional |
| asignar servicio de otro local | 400 | 400/404/409 | OK |
| servicios del profesional | 200 | 200 | OK |
| profesionales del servicio | 200 | 200 | OK |
| asignar S2 a P1 | 200 | 200/201 | OK |
| asignar S1 a P2 | 200 | 200/201 | OK |
| desasignar | 200 | 200/204 | OK |
| desasignar de nuevo | 400 | 404/200/204 | FALLO — El servicio no está asignado al profesional |

**disponibilidad**

| Prueba | HTTP | Esperado | Resultado |
|---|---|---|---|
| sin profesional (lunes) | 400 | 200/400 | OK · profesionalId es obligatorio en el código |
| con profesional | 200 | 200 | OK |
| domingo cerrado | 500 | 200/400/409 | FALLO — Error al validar la disponibilidad por servicios |
| fecha inválida | 400 | 400 | OK |
| fecha pasada | 200 | 200/400 | OK |
| sin servicios | 400 | 400 | OK |
| servicio duplicado | 400 | 400 | OK |
| servicio de otro local | 400 | 400/404/409 | OK |

**horas-ocupadas**

| Prueba | HTTP | Esperado | Resultado |
|---|---|---|---|
| rango válido | 200 | 200 | OK |
| rango de 63 días | 400 | 400 | OK |
| desde > hasta | 400 | 400 | OK |
| sin parámetros | 400 | 400 | OK |
| fecha basura | 400 | 400 | OK |
| local inexistente | 200 | 200/404 | OK · devuelve vacío en vez de 404 si da 200 |
| local en revisión es público | 200 | 200/404 | OK · filtra datos de un local no publicado si da 200 |

**citas**

| Prueba | HTTP | Esperado | Resultado |
|---|---|---|---|
| crear sin profesional | 201 | 201 | OK |
| misma hora -> 409 | 409 | 409 | OK |
| hora distinta del intervalo (10:15) | 201 | 400/409/201 | OK · si 201, no valida intervalo |
| fuera de horario (07:00) | 409 | 400/409/201 | OK · si 201, no valida apertura |
| fuera de horario (23:30) | 409 | 400/409/201 | OK |
| cierra a las 18:00, cita 17:45 de 30 min | 201 | 400/409/201 | OK · si 201, la cita termina pasada la hora de cierre |
| domingo cerrado | 409 | 400/409/201 | OK · si 201, reserva en día cerrado |
| fecha muy lejana (2 años) | 409 | 400/201 | FALLO — El local no abre a esa hora. |
| fecha inválida | 400 | 400 | OK |
| horario inválido | 400 | 400 | OK |
| servicio de otro local | 400 | 400/404/409 | OK |
| servicios repetidos | 400 | 400 | OK |
| personas negativas | 400 | 400/201 | OK |
| notas de 5000 chars | 201 | 400/201 | OK · si 201, no hay tope en notas |
| local en revisión | 409 | 400/404/409 | OK |
| local inexistente | 404 | 404 | OK |
| sin sesión | 401 | 401 | OK |
| dueño reserva en su propio local | 201 | 201/400/403/409 | OK · permite autoreservas si 201 |
| con profesional P1 | 201 | 201/400 | OK |
| mismo profesional misma hora | 409 | 409/400 | OK |
| otro profesional misma hora | 409 | 201/400/409 | OK · P2 ya no hace S1 |
| profesional que no hace el servicio | 409 | 400/409 | OK |
| profesional de otro local | 400 | 400/404/409 | OK |
| ver cita propia | 200 | 200 | OK |
| ver cita ajena (cliente) | 403 | 403 | OK |
| ver cita (dueño del local) | 403 | 200/403 | OK |
| ver cita inexistente | 400 | 404 | FALLO — El cita_id debe ser un UUID válido. |
| mis citas | 200 | 200 | OK |
| mis citas page=-1 | 400 | 200/400 | OK |
| citas del local (dueño) | 200 | 200 | OK |
| citas del local (cliente) | 403 | 403 | OK |
| citas de local ajeno (otro dueño) | 403 | 403 | OK |
| local acepta como cliente | 403 | 403 | OK |
| local acepta con estado 2 (debe rechazar) | 400 | 400 | OK |
| cliente confirma pendiente -> 409 | 409 | 409 | OK |
| otro cliente confirma cita ajena | 409 | 403/404/409 | OK |
| local acepta | 200 | 200 | OK |
| local acepta de nuevo | 409 | 409/400 | OK |
| cliente confirma | 200 | 200 | OK |
| asistencia: otro usuario | 403 | 403/404 | OK |
| asistencia: valor texto | 400 | 400 | OK |
| asistencia en cita futura | 409 | 409 | OK |
| asistencia true (pasada) | 200 | 200 | OK |
| asistencia false | 200 | 200 | OK |
| asistencia null | 200 | 200 | OK |
| cancelar cita ya pasada y confirmada | 409 | 200/409/400 | OK · permite cancelar una cita pasada si 200 |
| cancelar como otro usuario | 403 | 403/404 | OK |
| cancelar el local | 200 | 200 | OK |
| cancelar ya cancelada | 409 | 409/400 | OK |
| aceptar cancelada | 409 | 409/400 | OK |
| hora liberada tras cancelar | 201 | 201 | OK |
| concurrencia: 1 sola reserva gana | 200 | 200 | OK · 201=1 409=5 otros= |
| caducidad: pendiente > 15 min se cancela sola | 200 | 200 | OK · {"estado_reserva":3,"cancelada_por":"tiempo"} |
| caducada: aceptar -> CITA_CADUCADA | 409 | 409 | OK |
| aviso de caducidad al cliente | 500 | 200 | FALLO |

**opiniones**

| Prueba | HTTP | Esperado | Resultado |
|---|---|---|---|
| sin sesión | 401 | 401 | OK |
| calificación 0 | 400 | 400 | OK |
| calificación 6 | 400 | 400 | OK |
| calificación decimal | 400 | 400/201 | OK · si 201, admite decimales |
| comentario de 20000 chars | 201 | 400/413/201 | OK |
| cita de otro usuario | 403 | 403 | OK |
| cita no uuid | 400 | 400 | OK |
| cita futura | 409 | 409 | OK |
| opinión ligada (pasada) | 201 | 201 | OK |
| repetida | 409 | 409 | OK |
| rating_cache se actualiza | 200 | 200 | OK · {"rating_cache":"4.5","opiniones_count":2} |
| opinión sin cita (cualquiera puede opinar) | 201 | 201/403/409 | OK · si 201, se puede opinar sin haber ido |
| opinión sin cita repetida (spam) | 201 | 201/409 | OK · si 201, un usuario puede opinar infinitas veces sin cita |
| dueño opina de su propio local | 201 | 403/409/201 | OK · si 201, el dueño puede inflar su nota |
| local inexistente | 404 | 404 | OK |
| visibles (público) | 200 | 200 | OK |
| visibles page=-1 | 400 | 200/400 | OK |
| todas: dueño | 200 | 200 | OK |
| todas: cliente | 403 | 403 | OK |
| borrar ajena | 403 | 403 | OK |
| borrar propia | 200 | 200/204 | OK |
| borrar inexistente | 400 | 404 | FALLO — El opinion_id debe ser un UUID válido. |
| al borrar, el contador baja | 500 | 200 | FALLO |

**notificaciones**

| Prueba | HTTP | Esperado | Resultado |
|---|---|---|---|
| listar | 200 | 200 | OK |
| listar page=-1 | 400 | 200/400 | OK |
| marcar leída ajena | 403 | 403/404 | OK |
| marcar leída | 200 | 200 | OK |
| borrar ajena | 403 | 403/404 | OK |
| borrar | 200 | 200/204 | OK |
| id inválido | 400 | 400/404 | OK |
| sin sesión | 401 | 401 | OK |

**favoritos**

| Prueba | HTTP | Esperado | Resultado |
|---|---|---|---|
| añadir | 201 | 200/201 | OK |
| añadir repetido | 201 | 200/409 | FALLO |
| añadir inexistente | 404 | 404/400 | OK |
| añadir local en revisión de otro | 201 | 404/400/201 | OK · si 201, se puede guardar un local no publicado |
| listar | 200 | 200 | OK |
| quitar | 200 | 200/204 | OK |
| quitar de nuevo | 404 | 404/200/204 | OK |
| sin sesión | 401 | 401 | OK |

**descubre**

| Prueba | HTTP | Esperado | Resultado |
|---|---|---|---|
| resumen | 200 | 200 | OK |
| resumen provincia inexistente | 200 | 200 | OK |
| resumen provincia con inyección | 200 | 200 | OK |
| categorías | 200 | 200 | OK |
| promociones | 200 | 200 | OK |
| promociones fecha inválida | 400 | 400/200 | OK |
| eventos sin cuerpo | 400 | 400/200/204 | OK |
| eventos no lista | 400 | 400/200/204 | OK |
| eventos lote enorme | 400 | 400/413/200 | OK |
| eventos válido (local de prueba) | 202 | 200/202/204/400 | OK |
| uso-filtros sin sesión | 401 | 401 | OK |
| uso-filtros con sesión | 201 | 200/201/204/400 | OK |

**media**

| Prueba | HTTP | Esperado | Resultado |
|---|---|---|---|
| listar imágenes | 200 | 200 | OK |
| firma como dueño | 200 | 200/201 | OK |
| firma como cliente | 403 | 403 | OK |
| firma sin sesión | 401 | 401 | OK |
| registrar imagen publicId ajeno | 400 | 400/403/404/409 | OK |
| registrar imagen sin cuerpo | 400 | 400 | OK |
| firma servicio | 200 | 200/201 | OK |
| firma servicio de otro local | 400 | 400/404 | OK |
| firma profesional | 200 | 200/201 | OK |

**roles**

| Prueba | HTTP | Esperado | Resultado |
|---|---|---|---|
| encargado ve citas del local | 200 | 200 | OK |
| encargado edita local | 200 | 200 | OK |
| encargado NO puede borrar el local | 403 | 403 | OK |
| encargado crea servicio | 201 | 201 | OK |
| encargado ve el local en mios | 200 | 200 | OK |
| encargado acepta cita | 200 | 200 | OK |

**mesa**

| Prueba | HTTP | Esperado | Resultado |
|---|---|---|---|
| crear local tipo mesa | 200 | 200 | OK |
| reservar servicios en local de mesa | 409 | 400/409/201 | OK · si 201, mezcla reservas de servicio con local de mesas |

### Ronda 2 (validaciones de creación y casos dudosos, 51 pruebas)

51 pruebas · 40 cumplen lo esperado · 11 no.

**crear-local**

| Prueba | HTTP | Esperado | Resultado |
|---|---|---|---|
| categoria_id inexistente | 400 | 400/201 | OK · si 201, lo acepta |
| nombre vacío | 400 | 400/201 | OK · si 201, lo acepta |
| nombre de 5000 chars | 201 | 400/201 | OK · si 201, lo acepta |
| intervalo 0 | 400 | 400/201 | OK · si 201, lo acepta |
| intervalo negativo | 400 | 400/201 | OK · si 201, lo acepta |
| intervalo 7 minutos | 201 | 400/201 | OK · si 201, lo acepta |
| intervalo 5000 minutos | 201 | 400/201 | OK · si 201, lo acepta |
| lat fuera de rango | 201 | 400/201 | OK · si 201, lo acepta |
| teléfono con letras | 201 | 400/201 | OK · si 201, lo acepta |
| servicio con precio negativo | 400 | 400/201 | OK · si 201, lo acepta |
| servicio sin nombre | 400 | 400/201 | OK · si 201, lo acepta |
| horario abre>cierra | 400 | 400/201 | OK · si 201, lo acepta |
| horario día inválido | 400 | 400/201 | OK · si 201, lo acepta |
| horario duplicado mismo día | 409 | 400/201 | FALLO — duplicate key value violates unique constraint "local_horarios_local_id_dia_semana_key" |
| descripción de 50000 chars | 201 | 400/201 | OK · si 201, lo acepta |
| campos de sistema forzados | 201 | 400/201 | OK · si 201, lo acepta |

**update-local**

| Prueba | HTTP | Esperado | Resultado |
|---|---|---|---|
| nombre vacío | 200 | 400 | FALLO |
| lat 500 | 200 | 400 | FALLO |
| horario día inválido | 200 | 400 | FALLO |
| horario abre>cierra | 400 | 400 | OK |
| horario hora inválida | 400 | 400 | OK |
| intervalo 0 | 400 | 400 | OK |
| nombre 5000 | 200 | 400 | FALLO |
| rating_cache forzado | 400 | 400/200 | OK · comprobar abajo |
| estado forzado | 400 | 400/200 | OK · comprobar abajo |

**servicios**

| Prueba | HTTP | Esperado | Resultado |
|---|---|---|---|
| detalle de servicio de OTRO local | 200 | 404 | FALLO |
| precio 1e15 | 500 | 400/201 | FALLO — Error al crear el servicio |
| precio 1e9 | 201 | 400/201 | OK |
| precio con 5 decimales | 400 | 400/201 | OK |
| nombre de 5000 | 201 | 400/201 | OK |

**preferencias**

| Prueba | HTTP | Esperado | Resultado |
|---|---|---|---|
| radio absurdo al crear | 500 | 400/201 | FALLO — No se pudieron crear las preferencias. |
| radio negativo | 400 | 400 | OK |
| antelación absurda | 500 | 400 | FALLO — No se pudieron actualizar las preferencias. |

**disponibilidad**

| Prueba | HTTP | Esperado | Resultado |
|---|---|---|---|
| domingo cerrado con profesional | 500 | 200/400/409 | FALLO — Error al validar la disponibilidad por servicios |
| lunes con profesional | 200 | 200 | OK |
| domingo cerrado SIN profesional | 400 | 200/400/409 | OK |

**citas**

| Prueba | HTTP | Esperado | Resultado |
|---|---|---|---|
| lunes dentro de 2 años | 201 | 400/201 | OK · si 201, sin tope de antelación |
| hora con segundos 10:00:30 | 201 | 400/201 | OK |
| hora 9:00 sin cero | 400 | 400/201 | OK |
| a las 18:00 justo (cierre) | 409 | 400/409/201 | OK |
| a las 17:30 (30 min, termina 18:00) | 201 | 201 | OK |
| dos servicios (60 min) a las 17:30 | 201 | 400/409/201 | OK · si 201, 60 min exceden el cierre |
| cita a las 09:30 | 201 | 201 | OK |
| solape: otra a las 09:45 el mismo día | 201 | 409/400/201 | OK · si 201, dos citas se pisan en el tiempo |
| caducidad avisa al cliente | 500 | 200 | FALLO |
| las citas del usuario borrado siguen en el local | 200 | 200 | OK |

**opiniones**

| Prueba | HTTP | Esperado | Resultado |
|---|---|---|---|
| al borrar, el contador baja | 200 | 200 | OK · antes={"rating_cache":"5.0","opiniones_count":1} después={"rating_cache":"0.0","opiniones_count":0} |
| tras borrar, se puede opinar de nuevo de la misma cita | 201 | 201/409 | OK · si 409, borrar no libera la cita |
| comentario con HTML/script | 201 | 201/400 | OK · guarda HTML tal cual |

**auth**

| Prueba | HTTP | Esperado | Resultado |
|---|---|---|---|
| delete-user sin contraseña | 200 | 400/401/403/200 | OK · borra la cuenta sin pedir contraseña si 200 |
| tras delete-user, la sesión ya no vale | 401 | 401 | OK |

