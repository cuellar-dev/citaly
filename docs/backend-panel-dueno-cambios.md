# Backend: panel del dueño (rama `nosotros/panel-dueno`)

Cambios del backend (`backend-citaly-main`, repo `erdwin123/backend-citaly`) que necesita el front para Mi Negocio, crear y completar un local, reservar cita, citas del dueño, «¿Fuiste?» y opiniones por cita. Son 3 commits sobre `main` (`f33ce2c`), sin conflictos:

| Commit | Qué trae |
| --- | --- |
| `50bbb56` | Panel del dueño: locales con estado y ficha, citas sin profesional, asistencia, opiniones por cita, caducidad de pendientes |
| `b1fbf92` | Revisión: estados de cita en orden, sin fechas pasadas, validaciones como 400, servicios completos, recordatorios en hora de Cuba, fotos duplicadas |
| `bcb1f96` | 400 sin cuerpo, consultas en paralelo con Neon, una sola conexión con PGlite |

## Antes de fusionar: la migración 012 en Neon

**El código de esta rama necesita `Database/Migrations/012PanelDueno.sql` en la base.** Sin ella, `GET /api/local/mios`, crear y completar local, opiniones por cita y **también Descubre** (su consulta ya filtra por `estado`, `completado` y `oculto`) dan error 500.

El backend **no migra solo**: hay que aplicarla a mano en Neon **antes** de desplegar o arrancar esta rama contra Neon. Avisar antes de aplicarla, porque cambia la base compartida.

### Qué hace (todo con `IF NOT EXISTS` / `DROP … IF EXISTS`, se puede aplicar dos veces)
- `locales`: añade `estado` (por defecto `'aprobado'`), `tipo`, `completado` (por defecto `TRUE`), `oculto` (por defecto `FALSE`), `aprobado_en` y `ficha JSONB`.
- `citas`: añade `asistio`; el CHECK de `cancelada_por` admite `'tiempo'`; índice único `citas_local_horario_sin_profesional_idx` (una cita activa por local, día y hora si no hay profesional).
- `opiniones`: añade `cita_id` (FK a `citas`) con índice único (una opinión por cita).
- Los locales que ya existen **quedan aprobados, completos y visibles** gracias a los valores por defecto: Descubre no pierde ninguno.

### Comprobado antes de aplicar (solo lectura sobre Neon, 24/11/2026)
- 34 locales, 1 usuario, 1 cita (`cancelada_por = 'cliente'`), 0 opiniones.
- Ninguna fila rompe el CHECK nuevo ni el índice único (cero duplicados).
- La 012 se aplicó dos veces seguidas sobre la base local sin errores (idempotente).

### Cómo aplicarla
Con `psql` o el SQL Editor de Neon, sobre la base de producción (idealmente en una rama de Neon primero):

```sql
\i Database/Migrations/012PanelDueno.sql
```

### Comprobar después
```sql
SELECT column_name FROM information_schema.columns
 WHERE table_name = 'locales' AND column_name IN ('estado','tipo','completado','oculto','aprobado_en','ficha');   -- 6 filas
SELECT column_name FROM information_schema.columns WHERE table_name = 'citas' AND column_name = 'asistio';       -- 1 fila
SELECT column_name FROM information_schema.columns WHERE table_name = 'opiniones' AND column_name = 'cita_id';   -- 1 fila
SELECT estado, completado, oculto, count(*) FROM locales GROUP BY 1,2,3;   -- todos: aprobado, true, false
```
Y `GET /api/descubre/local/resumen` debe seguir devolviendo los mismos locales de antes (29 en feed).

### Deshacerla (solo si hiciera falta; borra lo guardado en esas columnas)
```sql
ALTER TABLE locales DROP COLUMN IF EXISTS estado, DROP COLUMN IF EXISTS tipo, DROP COLUMN IF EXISTS completado,
  DROP COLUMN IF EXISTS oculto, DROP COLUMN IF EXISTS aprobado_en, DROP COLUMN IF EXISTS ficha;
ALTER TABLE citas DROP COLUMN IF EXISTS asistio;
DROP INDEX IF EXISTS citas_local_horario_sin_profesional_idx;
DROP INDEX IF EXISTS opiniones_cita_unica_idx;
ALTER TABLE opiniones DROP COLUMN IF EXISTS cita_id;
```
(y volver a poner el CHECK de `cancelada_por` en `('cliente','local')`).

## Rutas nuevas o cambiadas
- `GET /api/local/mios` (sesión): locales de la cuenta con servicios, horarios, amenidades y ficha.
- `PATCH /api/local/:id/aprobar` (administrador `agente`): saca un local de revisión.
- `PUT /api/local/:id` acepta `servicios`, `horario`, `amenidades` y `localData.ficha` (se mezcla).
- `GET /api/local/:id` muestra un local en revisión, sin completar u oculto solo a su dueño y encargados; para el resto es 404.
- `GET /api/local/:id/horas-ocupadas?desde=&hasta=` (hasta 62 días).
- `PATCH /api/citas/:id/usuario/asistencia` (`{ asistio: true | false | null }`).
- `POST /api/opiniones/local/:id` acepta `citaId` (opinión ligada a una cita confirmada del propio usuario, una por cita).
- Las citas pendientes que el local no acepta en 15 minutos se cancelan solas (`cancelada_por = 'tiempo'`, job cada minuto).
- Reglas de creación de locales: máximo 5 por cuenta y 2 en revisión a la vez; ficha de hasta 60 KB y sin fotos en base64.

## Cómo se probó
- Base local de pruebas (PGlite) con cuentas de prueba: 81 comprobaciones de API sobre locales, citas, opiniones y permisos, y 23 sobre caducidad de 15 min, asistencia, cancelaciones, entradas sin cuerpo y dos reservas simultáneas de la misma hora (una 201 y otra 409).
- Lint del front limpio, build correcto y 5 tests del backend.
- Front probado en navegador: Mi Negocio, Perfil, Mis citas y ficha con datos reales de la rama.

## Notas
- **No probado contra Neon**: la rama no ha corrido sobre Neon porque falta la 012. Los tiempos con Neon (consultas en paralelo) no se han medido.
- **Better Auth y la red**: `Config/auth.js` abre su propia conexión con el driver `pg` por TCP (puerto 5432). En redes que lo bloquean, la sesión falla con Neon aunque el resto del backend (que usa el driver por WebSocket) funcione. No lo toca esta rama.
- **Autoaprobación de desarrollo**: `LOCALES_AUTOAPROBAR_SEG` aprueba solos los locales en revisión, pero solo si `NODE_ENV` no es `production`. Hay que dejarla sin definir en producción; entonces solo aprueba `PATCH /api/local/:id/aprobar`.
- **Una sola conexión con PGlite**: con `DATABASE_SSL=false` el backend usa una conexión (no cambia nada con Neon). Si alguien apunta `DATABASE_SSL=false` a un Postgres real, funcionará pero sin concurrencia.
