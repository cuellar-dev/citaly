# Feedback de alineación — frontend → backend

Documento para el equipo de backend. Lo escribió el lado de frontend (Citaly web) después de revisar este repo. El objetivo es alinear contratos, señalar bugs concretos y dejar claro qué **no** hay que rehacer.

No es una lista de quejas. El camino del backend es bueno. Esto es para no implementar dos productos distintos.

Fecha: 29 oct 2026.

---

## 1. Resumen rápido

|                                  |                                                                                                                                     |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| Dirección general                | Buena. Seguir este repo.                                                                                                            |
| ¿Se puede enchufar el front hoy? | No. Faltan piezas y hay desajustes de contrato.                                                                                     |
| Prioridad                        | Arreglar bugs de citas → alinear estados / `esLugar` / abierto → reserva de mesa → opiniones → `/me` → importar los 3 locales demo. |

El front ya no es un mock suelto: cerró reglas de negocio (estados, tipo de cita, duraciones, abierto/cerrado, opiniones, mesas por capacidad). El backend tiene varias de esas ideas, pero con **nombres y números distintos**.

---

## 2. Qué está bien (no tocar la idea)

Estas piezas están bien pensadas. No hace falta rediseñarlas. Si hay que cambiar algo, es detalle, no arquitectura.

- **Express como frontera de negocio.** Precios, estados, disponibilidad y snapshots se deciden aquí, no en React. Correcto.
- **Better Auth + Neon.** Identidad en `user` / `session`; perfil de Citaly en `usuarios`; permisos de local en `local_miembros`. No mezclar contraseñas en nuestras tablas.
- `verifyRole` **mira membresía**, no un rol que mande el cliente en el body.
- **Capas** ruta → controlador → servicio → modelo. Transacciones con `withTransaction`.
- **Índices únicos de turno** (`citas_profesional_horario_activa_idx` y el de mesa). Ocupado = mismo profesional/mesa + misma fecha + misma hora de **inicio**, y `estado_reserva <> 3`. Eso coincide con la regla del front: no inventar solape por duración.
- **Snapshots en** `cita_servicios`**.** El comprobante no se rompe si después cambia el precio del catálogo.
- **Cloudinary firma en el servidor.** El navegador no ve el secret.
- **Helmet, CORS hacia Vite, errores** `{ error: { code, message } }`, `/health`.
- **Roles** `dueno` **/** `encargado` **/** `staff`**.** Encajan con Mi Negocio.
- **Tabla** `mesas` **con capacidad, posición, consumo mínimo.** El dato está listo aunque la API de mesas aún no.

Si el tiempo aprieta, **no reescriban auth, el esquema de citas ni Cloudinary**. Ajusten contratos y completen huecos.

---

## 3. Lo que cambió en el frontend (hay que tomarlo en cuenta)

Estas decisiones ya están en la web. Si el backend guarda otra cosa, al conectar se van a pelear.

### 3.1 Estados de una cita (importante)

Cuatro números. Español. Un solo significado para cliente y dueño.

| Valor | Texto en UI | Cuándo                                                            |
| ----- | ----------- | ----------------------------------------------------------------- |
| `0`   | Pendiente   | La cita acaba de crearse. Falta que el **local** acepte.          |
| `1`   | Por ti      | El local ya aceptó. Falta que el **cliente** pulse “Voy pa allá”. |
| `2`   | Confirmada  | Los dos confirmaron.                                              |
| `3`   | Cancelada   | La canceló el cliente, el local, o se venció el plazo.            |

Flujo:

1. `POST` reserva → siempre `0`.
2. El dueño acepta una pendiente → pasa a `1` (Por ti), **no** a confirmada.
3. El dueño rechaza → `3` con `cancelada_por: 'local'`.
4. El cliente, solo si está en `1`, confirma asistencia → `2` (`voyPaAlla`).
5. El cliente puede cancelar en `0` o `1` → `3` con `cancelada_por: 'cliente'`.
6. Si una cita en `0` lleva **15 minutos** sin que el dueño acepte → `3` con `cancelada_por: 'tiempo'`.

Hoy el backend:

- Acepta cualquier `0–3` desde el local, sin esta máquina.
- Pone `confirmada_en` cuando el estado es `1`. En el front, `1` todavía no está confirmada; confirmada es `2`.
- El `CHECK` de `cancelada_por` solo permite `'cliente' | 'local'`. Falta `'tiempo'`.

### 3.2 Tipo de cita: solo `esLugar`

El front **eliminó** `tipo: 'con-lugar' | 'sin-lugar' | 'mesa' | 'servicio'`.

- `esLugar: true` → reserva de mesa (`/local/:id/reservar`).
- `esLugar: false` → servicios + profesional (`/local/:id/reservar-cita`).

Si la URL no coincide con el tipo del local, el front redirige solo. El backend debería guardar un boolean (`tiene_lugar` en `locales` ya existe; en `citas` hoy está `tipo` texto). Conviene un campo `es_lugar` o reutilizar `tiene_lugar` del local, y no tres nombres.

### 3.3 Duraciones: número en minutos

Todo lo que dura (servicio, demora de la cita) se guarda como **entero en minutos**. `45`, `120`. En pantalla se formatea a “45 min” / “2 h”.

El esquema `duracion_minutos` ya va así. Bien. No aceptar strings `"45 min"` / `"2h"` en la API.

**Regla de ocupación (acordada con producto):** ocupado = mismo profesional (o mesa) + misma fecha + misma hora de inicio. La duración **no** bloquea el siguiente turno ni el último hueco del día. El barbero abre un turno a las 10 aunque “cierre” a las 10:30; el sistema no expulsa al cliente a mitad de corte.

Hoy `DisponibilidadService` exige que `inicio + duración` quepa hasta `cierra`. Eso **no** es la regla del producto. El índice único por hora de inicio sí lo es. Priorizar el índice; soltar el candado de duración vs cierre.

### 3.4 Abierto / cerrado: reloj + horario, nunca candado de reserva

Se quitó `close` del JSON. No es un interruptor para prohibir reservar.

- La pastilla Abierto/Cerrado se calcula con **día de la semana +** `horarioApertura` **/** `horarioCierre` **+ reloj ahora** (incluye cierre de madrugada, tipo 18:00 → 01:00).
- **Reservar sigue permitido** aunque el badge diga Cerrado. El cliente reserva para otro día o para cuando abra.

Hoy el backend tiene `locales.abierto BOOLEAN` y tira `409 LOCAL_CLOSED` si es `false`. Eso no debe impedir crear una cita. El flag, si se queda, es como mucho informativo; la verdad es `local_horarios`.

El texto de horario que ve el usuario (“9AM - 6PM”) se **deriva** de apertura/cierre. No hace falta un string `horario` como fuente de verdad.

### 3.5 Opiniones reales

El número de comentarios y el promedio salen de la lista real, no de `points` / `opiniones` del JSON.

- Al enviar: se guarda, aparece arriba, autor `"Tú"` (hasta que haya perfil).
- Promedio = media de `calificacion`.
- Cada local tiene comentarios **propios** (ya no se copian los del restaurante a la peluquería).

La tabla `opiniones` está. Faltan las rutas.

### 3.6 Reserva de mesa: primero “¿cuántos van?”

Antes de elegir mesa se pregunta cuántas personas. Solo se pueden marcar mesas con `capacidad >= personas`. Eso se guarda en la cita (`personas`). El mapa del front hoy es uno compartido; a futuro cada local tendrá el suyo. El esquema de `mesas` ya contempla `pos_x`, `pos_y`, `capacidad`. Falta el `POST` de reserva de mesa.

### 3.7 Rutas de reserva

| Local                              | Ruta correcta              |
| ---------------------------------- | -------------------------- |
| `lugar === true` (o `tiene_lugar`) | `/local/:id/reservar`      |
| `lugar === false`                  | `/local/:id/reservar-cita` |

La API puede devolver `tiene_lugar` y listo. El front ya redirige si alguien pega la URL al revés.

---

## 4. Bugs concretos (código actual)

Revisados sobre los archivos de este repo. Conviene corregirlos antes de conectar el front.

### 4.1 `CitasService.getCitasByLocalId` — la ruta del dueño no va a andar

Archivo: `Services/CitasService.js`.

1. Usa `LocalModel.getLocalById` y `LocalModel` **no está importado** (el modelo se llama `LocalesModel`). Eso revienta al listar citas del local.
2. Llama a `getCitasByLocal` dos veces. La segunda pasa `userRequestedId` como si fuera el número de página.
3. Trata “el local no tiene citas” como `404`. Un local sin citas es una lista vacía `200`, no un error.

`GET /api/citas/local/:localId` es justo la que usará Mi Negocio.

### 4.2 `confirmada_en` en el estado equivocado

Archivo: `Models/CitasModel.js`.

```sql
confirmada_en = CASE WHEN $1::smallint = 1 THEN NOW() ELSE confirmada_en END
```

Con el contrato del front, `1` = Por ti. `confirmada_en` debería escribirse al pasar a `2`.

### 4.3 `cancelada_por: 'tiempo'` no entra en el CHECK

Archivo: `Database/Migrations/002CitalySchema.sql`.

```text
cancelada_por ... IN ('cliente', 'local')
```

El front cancela pendientes viejas con `'tiempo'`. Hay que ampliar el CHECK (y el modelo).

### 4.4 `validarUuid` / `validarId` mezclados con `locales.id`

`locales.id` es `TEXT` (sirve `sara`, `al-medio-1`). En `getCitasByLocalId` se hace `validarUuid(localId)`. Un id de local real del demo **no es UUID** y va a rechazarse. Validar UUID solo donde la columna es UUID (citas, servicios, profesionales, mesas).

### 4.5 `UsuariosController` no está montado

Existe el controlador. `App.js` no registra un router de usuarios. `GET/PATCH` de perfil no existen en runtime. El front va a necesitar `/api/.../me` (o equivalente) en cuanto haya login.

### 4.6 Disponibilidad: `local.abierto` y duración vs cierre

Archivo: `Services/DisponibilidadService.js`.

- `if (!local.abierto) throw LOCAL_CLOSED` — ver §3.4.
- Exige que la cita entera quepa antes del cierre — ver §3.3.

El cálculo de slots por `intervalo_minutos` y el set de horarios ocupados por hora de inicio **sí está bien**.

### 4.7 Documentación desfasada respecto a `App.js`

`Doc/RUTAS_API_CITALY.md` y `Doc/FASE_1.md` dicen cosas que el código ya superó (router de profesionales “falta”, Neon “pendiente”, montaje duplicado de servicios). Quien implemente con el Markdown como verdad se va a confundir. Actualizar el doc de rutas a lo que está **conectado ahora**, y marcar el resto como objetivo.

---

## 5. Qué falta para el producto actual

Orden de utilidad para el front, no el plan de 12 fases entero.

### Hace falta para Descubre / Detalle

- [ ] Promedio y cantidad de opiniones **calculados** de `opiniones`, no solo `rating_cache` / `opiniones_count` editables.
- [ ] `GET` opiniones paginadas del local.
- [ ] `POST` opinión autenticada (una por usuario/local, rating 1–5, texto no vacío).
- [ ] Detalle del local con profesionales (hoy el detalle arma servicios, horarios, fotos, amenidades; los profesionales van por otra ruta — el front los necesita juntos o con un contrato claro).
- [ ] Listado de mesas del local (mapa).
- [ ] Abierto/cerrado derivado de `local_horarios` + timezone, sin bloquear reserva.

### Hace falta para reservar

- [ ] `POST` cita de mesa: `personas`, `mesa_id`, consumo mínimo y precio **leídos de Neon**, no del body.
- [ ] `GET` disponibilidad de mesas (`?fecha=&tipo=mesa` o similar).
- [ ] Alinear `POST /api/citas/servicios` al flujo Pendiente (`0`) y a `esLugar: false`.
- [ ] Job o chequeo al leer: pendientes `0` con más de 15 min → `3` / `'tiempo'`.
- [ ] El cliente en estado `1` puede pasar a `2`. Hoy el cliente **solo** puede poner `3`.

### Hace falta para Mis citas / perfil

- [ ] Rutas de perfil montadas (`/me`).
- [ ] Listado de citas del usuario autenticado (el de ahora pide `:usuarioId` y compara con la sesión: sirve, pero es más simple `/me/citas`).
- [ ] Devolver snapshots de servicios en el detalle de la cita, para pintar el recibo.

### Hace falta para Mi Negocio

- [ ] Listado de citas del local (arreglar el bug §4.1).
- [ ] Transición de estado: dueño `0 → 1` o `0 → 3`. No un `PATCH` genérico a cualquier número.
- [ ] CRUD de horarios del local (el alta existe al crear; falta editar la semana).
- [ ] CRUD de mesas.
- [ ] Miembros del local (invitar / cambiar rol).
- [ ] Dashboard (ocupación = citas activas / (turnos del día × profesionales)). Eso puede esperar; el listado del día no.

### Hace falta para vivir juntos

- [ ] Script de importación idempotente de `locales.json` + `mesasMapa.js` (los 3 locales demo: Al Medio, Sara, Itaka).
- [ ] Seeds de amenidades y categorías.
- [ ] Decidir **un** prefijo: `/api/...` actual o `/api/v1/locales/...`. El front no puede perseguir los dos.
- [ ] `.env.example` con `CLOUDINARY_*` y `BETTER_AUTH_SECRET`.
- [ ] `GET /health/db`.
- [ ] Una prueba de integración: dos `POST` iguales al mismo profesional/hora → uno `201` y uno `409`.

### Puede esperar (el front también lo dejó para después)

- Favoritos, notificaciones push, preferencias.
- Pausa / express / “no reciben reservas” como producto.
- Preguntar a cliente y local si **asistieron** (hoy “Atendida” es reloj).
- Mapa de mesas distinto por cada local (la tabla ya aguanta; el SVG del front es uno).
- Choque de huecos por duración real del profesional (pausado a propósito).
- Rate limit, logs estructurados, webhook de Cloudinary.

---

## 6. Contrato sugerido (para no adivinar)

Campos que el front ya manda o espera al crear/leer una cita. Nombres en camelCase en JSON; en SQL pueden seguir en snake_case.

```json
{
  "id": "uuid",
  "esLugar": false,
  "localId": "sara",
  "usuarioId": "text-better-auth",
  "fecha": "2026-10-30",
  "horario": "10:30",
  "estadoReserva": 0,
  "profesionalId": "uuid",
  "mesaId": null,
  "personas": null,
  "servicios": [
    { "id": "uuid", "nombre": "Corte dama", "precio": 450, "duracion": 45 }
  ],
  "precioTotal": 450,
  "demoraMinutos": 45,
  "creadaEn": "2026-10-29T22:00:00.000Z",
  "canceladaEn": null,
  "canceladaPor": null
}
```

Reglas que el servidor debe imponer (el body no es de fiar):

- `estadoReserva` inicial = `0`.
- `precioTotal` y `demoraMinutos` salen del catálogo.
- `servicios[]` en la respuesta = snapshots, no el catálogo vivo.
- `horario` = hora de **inicio** del turno (`HH:mm`).
- Conflicto de turno = `409` con un código estable (`SCHEDULE_NOT_AVAILABLE` / `TABLE_NOT_AVAILABLE` está bien).

---

## 7. Nombres: español vs inglés

El plan largo habla de `venues`, `bookings`, `/api/v1`. El código habla de `locales`, `citas`, `/api/local`. El front está en español (`localId`, `esLugar`, `estadoReserva`).

Propuesta: **quedarse con el código en español** (ya hay routers) y tratar `/api/v1/venues` como documento histórico. Migrar todo a v1 ahora retrasa enchufar el front.

Sí conviene unificar el montaje para que sea predecible, por ejemplo:

```text
GET  /api/locales
GET  /api/locales/:localId
GET  /api/locales/:localId/servicios
GET  /api/locales/:localId/profesionales
GET  /api/locales/:localId/mesas
GET  /api/locales/:localId/disponibilidad
POST /api/locales/:localId/citas/servicios
POST /api/locales/:localId/citas/mesas
```

No es urgente cambiar nombres el mismo día que se arreglan los bugs. Sí es urgente **un** documento de rutas que coincida con `App.js`.

---

## 8. Cómo verificar que estamos alineados

Cuando esto esté, el front debería poder:

1. Pintar Descubre sin `locales.json`.
2. Abrir Sara, ver 4 opiniones distintas y mandar una quinta.
3. Reservar un corte a las 10:30 con Laura y que un segundo cliente reciba `409` a esa misma hora.
4. Reservar mesa para 6 y que solo ofrezca mesas de 6+.
5. Ver la cita en Mis citas como **Pendiente**, sin botón “Voy pa allá”.
6. Que el dueño acepte y al cliente le aparezca **Por ti**.
7. Que a los 15 min sin aceptar, la pendiente pase a **Cancelada**.
8. Reservar aunque el badge del local diga Cerrado (fuera de horario, para otro día).

Si esos 8 puntos pasan, el mock se puede ir retirando.

---

## 9. Contacto de este feedback

Cualquier duda sobre estados, `esLugar` o duración: lado frontend. El criterio de ocupación (turno = hora de inicio) y el de “cerrado no bloquea reserva” no son sugerencias de UI; son reglas de producto ya aplicadas en la web.
