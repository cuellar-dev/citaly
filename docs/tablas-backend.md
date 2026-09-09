# Citaly — Tablas de datos (backend)

Modelo relacional propuesto a partir de:

- lo que la app **ya hace** (Descubre, detalle, dos flujos de reserva, Mis citas, opiniones mock)
- lo que el **plan / `docs/paginas.txt`** pide (perfil, dashboard dueño, cancelar, confirmar/rechazar, favoritos, notificaciones, PWA, auth)
- datos reales de `locales.json`, `mesasMapa.js` y el objeto que guarda `agregarCita`

Este archivo lista **todas** las tablas que el producto necesita. No es el mínimo del día 1: es el mapa completo. Al implementar se puede ir por fases (ver al final).

Convención de estados de reserva (ya en el front):

| Valor | Significado |
| --- | --- |
| `0` | Pendiente (el cliente acaba de reservar) |
| `1` | Confirmado por el local |
| `2` | Pendiente de confirmación (variante de espera) |
| `3` | Cancelado |

---

## Mapa rápido

```
usuarios
  ├── sesiones
  ├── preferencias
  ├── favoritos ──────────────► locales
  ├── notificaciones
  ├── opiniones ──────────────► locales
  ├── citas ──────────────────► locales
  │     ├── cita_servicios ───► servicios
  │     ├── mesa (opcional)
  │     └── profesional (opcional)
  └── local_miembros ──────────► locales  (dueño / staff)

locales
  ├── local_imagenes
  ├── local_horarios
  ├── local_amenidades ───────► amenidades
  ├── servicios
  ├── profesionales ──► profesional_servicios ──► servicios
  └── mesas
```

---

## 1. `usuarios`

**Para qué:** Perfil, login, “mis citas”, dueño del negocio, autor de opiniones. Sin usuarios no hay sync entre dispositivos ni dashboard.

| Campo | Tipo | Por qué |
| --- | --- | --- |
| `id` | uuid PK | Identidad estable |
| `nombre` | texto | Perfil y tarjeta del dueño (“cliente: …”) |
| `telefono` | texto | Contacto, WhatsApp, PDF del día |
| `email` | texto unique nullable | Login (puede ser solo tel en Cuba) |
| `password_hash` | texto nullable | Auth; null si login por código SMS |
| `foto_url` | texto nullable | Foto de perfil |
| `rol_base` | enum: `cliente` / `dueno` / `ambos` | Quién ve `/negocio` |
| `creado_en` | timestamp | Auditoría |
| `actualizado_en` | timestamp | Auditoría |

Hoy no existe: el “usuario” es el navegador (`localStorage`).

---

## 2. `sesiones`

**Para qué:** Auth real (cerrar sesión, varios dispositivos). El plan pide “Cerrar sesión cuando haya auth”.

| Campo | Tipo | Por qué |
| --- | --- | --- |
| `id` | uuid PK | |
| `usuario_id` | FK → usuarios | |
| `token_hash` | texto | Refresh / sesión |
| `dispositivo` | texto nullable | “este teléfono” |
| `expira_en` | timestamp | Caducidad |
| `creado_en` | timestamp | |

Sin esto, un JWT suelto también funciona; la tabla sirve si queréis revocar sesiones.

---

## 3. `preferencias`

**Para qué:** Tema claro/oscuro, notificaciones. El plan lo pone en Perfil. Puede ser columnas en `usuarios`; tabla aparte si crece.

| Campo | Tipo | Por qué |
| --- | --- | --- |
| `usuario_id` | PK/FK → usuarios | Una fila por usuario |
| `tema` | enum: `oscuro` / `claro` / `sistema` | Fase 2 del plan |
| `notif_recordatorio` | boolean | Taly / recordatorio de cita |
| `notif_confirmacion` | boolean | Cuando el dueño confirma |
| `radio_descubre_m` | int nullable | Filtro “cerca” en Descubre |

---

## 4. `locales`

**Para qué:** Cada negocio (Al Medio, Sara, Itaka). Es el JSON de `locales.json` sin arrays anidados.

| Campo | Tipo | Por qué |
| --- | --- | --- |
| `id` | uuid/slug PK | `al-medio-1`, `sara` |
| `nombre` | texto | `localName` |
| `categoria` | texto o FK → categorias | Restaurante, peluquería, bar |
| `descripcion` | texto | Detalle |
| `direccion` | texto | Maps + PDF |
| `lat` / `lng` | decimal nullable | Distancia real (hoy es `metros` mock) |
| `telefono` | texto | Card y detalle |
| `whatsapp` | texto | wa.me |
| `tiene_lugar` | boolean | `lugar`: mesa vs servicios |
| `horario_apertura` | time | Fallback si no hay `local_horarios` |
| `horario_cierre` | time | Idem |
| `intervalo_minutos` | int | Slots del selector de hora |
| `abierto` | boolean | `close` invertido; o se calcula |
| `rating_cache` | decimal | `points`; se puede recalcular de opiniones |
| `opiniones_count` | int | `opiniones: 120` |
| `distancia_mock_m` | int nullable | Hasta tener GPS |
| `yerro_menu_id` | texto nullable | Integración futura elyerromenu.com |
| `creado_en` | timestamp | |

El dueño **no** va solo aquí si hay varios dueños: ver `local_miembros`. Un `dueno_principal_id` extra es opcional.

---

## 5. `categorias`

**Para qué:** Filtros de Descubre (“peluquería”, “restaurante”) sin strings sueltos.

| Campo | Tipo | Por qué |
| --- | --- | --- |
| `id` | uuid PK | |
| `slug` | texto unique | `peluqueria` |
| `nombre` | texto | Para la UI |

Si preferís simplicidad, `locales.categoria` como texto basta al inicio.

---

## 6. `local_imagenes`

**Para qué:** Portada (`url`) + galería (`urls[]`). El dueño podrá subir/borrar fotos.

| Campo | Tipo | Por qué |
| --- | --- | --- |
| `id` | uuid PK | |
| `local_id` | FK → locales | |
| `url` | texto | |
| `es_portada` | boolean | La de TarjetaLocal |
| `orden` | int | Orden en el visor |
| `alt` | texto nullable | Accesibilidad |

---

## 7. `local_horarios`

**Para qué:** Días de apertura (`dias: ["m","x","j"…]`) y, si un día cierra distinto, una fila por día.

| Campo | Tipo | Por qué |
| --- | --- | --- |
| `id` | uuid PK | |
| `local_id` | FK → locales | |
| `dia_semana` | enum `l`–`d` | Igual que el front |
| `abre` | time | Puede diferir del general |
| `cierra` | time | Bares 18:00–23:00 |
| `cerrado` | boolean | Ese día no abre |

`fechasDisponiblesLocal` en el front usa exactamente esto.

---

## 8. `amenidades`

**Para qué:** Catálogo de iconos (wifi, parking, nieve, cigarro). Hoy: `{ id: "wifi" }` en el JSON.

| Campo | Tipo | Por qué |
| --- | --- | --- |
| `id` | slug PK | `wifi`, `parking`, `snow` |
| `nombre` | texto | Leyenda |
| `icono_key` | texto | Clave de `Icons.jsx` |

---

## 9. `local_amenidades`

**Para qué:** Qué amenidades tiene cada local (muchos a muchos).

| Campo | Tipo | Por qué |
| --- | --- | --- |
| `local_id` | FK | |
| `amenidad_id` | FK → amenidades | |
| PK | (`local_id`, `amenidad_id`) | |

---

## 10. `servicios`

**Para qué:** Catálogo del local. Corte, manicura, “mesa para 2”, evento. Precio y duración del flujo sin lugar (y a veces del con lugar).

| Campo | Tipo | Por qué |
| --- | --- | --- |
| `id` | uuid PK | |
| `local_id` | FK → locales | |
| `nombre` | texto | |
| `precio` | int | CUP; 0 = gratis |
| `duracion_minutos` | int | Slots y demora total |
| `nota` | texto nullable | “Consumo mínimo 800 CUP” |
| `activo` | boolean | Ocultar sin borrar |

---

## 11. `profesionales`

**Para qué:** Staff (Laura, Carlos). Solo locales `tiene_lugar = false`, pero la tabla es global.

| Campo | Tipo | Por qué |
| --- | --- | --- |
| `id` | uuid PK | `pro-sara-1` |
| `local_id` | FK → locales | |
| `nombre` | texto | |
| `foto_url` | texto nullable | SelectPro |
| `rating` | decimal nullable | `points` |
| `activo` | boolean | |

---

## 12. `profesional_servicios`

**Para qué:** En el JSON, cada pro tiene `"servicios": ["corte-dama", "tinte"]`. SelectPro debe filtrar quién hace lo elegido.

| Campo | Tipo | Por qué |
| --- | --- | --- |
| `profesional_id` | FK | |
| `servicio_id` | FK | |
| PK | compuesto | |

---

## 13. `mesas`

**Para qué:** Plano SVG. Hoy `MESAS_MAPA` es un mapa único; en producción **cada local con lugar** tiene las suyas.

| Campo | Tipo | Por qué |
| --- | --- | --- |
| `id` | uuid PK | `m-1` |
| `local_id` | FK → locales | |
| `codigo` | texto | `MESA-1` |
| `capacidad` | int | Asientos |
| `precio` | int | Reserva de mesa |
| `consumo_minimo` | int nullable | CUP a consumir |
| `ubicacion` | texto | “Junto a la entrada” |
| `tipo_forma` | enum: `circulo` / `rectangulo` | Dibujo |
| `pos_x` | int | Coordenada SVG |
| `pos_y` | int | Coordenada SVG |
| `activa` | boolean | Mesa fuera de servicio |

**No** guardar `estado: ocupado` permanente. Ocupado = hay una `cita` confirmada/pendiente en esa fecha+hora.

Opcional: `mapa_svg_url` en `locales` si cada restaurante tiene otro plano.

---

## 14. `citas`

**Para qué:** El corazón. Una fila = una reserva (mesa **o** servicio). El front ya usa un solo objeto con `tipo`.

| Campo | Tipo | Por qué |
| --- | --- | --- |
| `id` | uuid PK | `crypto.randomUUID()` |
| `usuario_id` | FK → usuarios | Dueño de “Mis citas” |
| `local_id` | FK → locales | |
| `tipo` | enum: `con-lugar` / `sin-lugar` | Qué tarjeta pintar |
| `fecha` | date | `yyyy-MM-dd` |
| `horario` | time | `HH:mm` |
| `estado_reserva` | smallint | 0–3 como arriba |
| `mesa_id` | FK mesas nullable | Solo con-lugar |
| `profesional_id` | FK profesionales nullable | Solo sin-lugar |
| `precio_total` | int | Suma servicios o precio mesa |
| `consumo_minimo` | int nullable | Copia al reservar |
| `demora_minutos` | int nullable | Suma de duraciones |
| `notas_cliente` | texto nullable | Roadmap “notas del cliente” |
| `personas` | int nullable | Roadmap cantidad de personas |
| `creada_en` | timestamp | |
| `cancelada_en` | timestamp nullable | Cancelar cita |
| `cancelada_por` | enum: `cliente` / `local` nullable | Quién canceló |
| `confirmada_en` | timestamp nullable | Dueño confirma |

Índice único recomendado para no pisar: `(mesa_id, fecha, horario)` donde mesa no es null y estado ≠ cancelado. Otro: `(profesional_id, fecha, horario)` para agenda del pro.

`localNombre` **no** se guarda como fuente de verdad: se lee de `locales`. Se puede denormalizar para histórico si el local cambia de nombre.

---

## 15. `cita_servicios`

**Para qué:** En peluquería se eligen **varios** servicios. El JSON de la cita lleva un array; en SQL eso es tabla puente. Se **copian** nombre/precio/duración para que si el catálogo cambia, la cita vieja no mienta.

| Campo | Tipo | Por qué |
| --- | --- | --- |
| `id` | uuid PK | |
| `cita_id` | FK → citas | |
| `servicio_id` | FK servicios nullable | Null si el servicio se borró |
| `nombre_snapshot` | texto | “Corte dama” |
| `precio_snapshot` | int | |
| `duracion_minutos` | int nullable | |

---

## 16. `opiniones`

**Para qué:** Comentarios del detalle. Hoy están dentro del JSON y el form hace `console.log` (no persiste).

| Campo | Tipo | Por qué |
| --- | --- | --- |
| `id` | uuid PK | |
| `local_id` | FK → locales | |
| `usuario_id` | FK usuarios nullable | Null = anónimo legacy |
| `calificacion` | int 1–5 | CaraRating |
| `comentario` | texto | |
| `creado_en` | timestamp | |
| `visible` | boolean | Moderación del dueño |

El nombre y la foto se leen de `usuarios`, no se duplican (salvo snapshot si el usuario borra la cuenta).

Tras insertar, actualizar `locales.rating_cache` y `opiniones_count`.

---

## 17. `favoritos`

**Para qué:** Roadmap Descubre: “Favoritos / te puede gustar”.

| Campo | Tipo | Por qué |
| --- | --- | --- |
| `usuario_id` | FK | |
| `local_id` | FK | |
| `creado_en` | timestamp | |
| PK | compuesto | Un favorito por par |

---

## 18. `notificaciones`

**Para qué:** Campana en Mi Negocio; recordatorio de cita (escena Taly `recordatorio`).

| Campo | Tipo | Por qué |
| --- | --- | --- |
| `id` | uuid PK | |
| `usuario_id` | FK | Destinatario (cliente o dueño) |
| `cita_id` | FK citas nullable | Contexto |
| `tipo` | enum: `reserva_nueva` / `confirmada` / `cancelada` / `recordatorio` | |
| `titulo` | texto | |
| `cuerpo` | texto | |
| `leida` | boolean | Badge de la campana |
| `creado_en` | timestamp | |

---

## 19. `local_miembros`

**Para qué:** Relación usuario ↔ local con rol. Un dueño puede tener varios locales; un local puede tener encargado + dueño. El `ProfileSwitch` “modo cliente / negocio” usa esto.

| Campo | Tipo | Por qué |
| --- | --- | --- |
| `usuario_id` | FK | |
| `local_id` | FK | |
| `rol` | enum: `dueno` / `encargado` / `staff` | Quién confirma citas |
| PK | compuesto | |

Si un usuario no aparece aquí, no entra a `/negocio` (o ve vacío).

---

## 20. `bloqueos_agenda`

**Para qué:** El dueño cierra un hueco (vacaciones, mesa en reparación, pro de baja un día). El selector de horario debe saltarse esos slots. No está en el front aún; el plan habla de “conflictos de agenda”.

| Campo | Tipo | Por qué |
| --- | --- | --- |
| `id` | uuid PK | |
| `local_id` | FK | |
| `mesa_id` | FK nullable | Bloquear una mesa |
| `profesional_id` | FK nullable | Bloquear un pro |
| `fecha` | date | |
| `hora_inicio` | time nullable | Null = día entero |
| `hora_fin` | time nullable | |
| `motivo` | texto nullable | |

---

## Tablas que **no** hacen falta

| Idea | Por qué no |
| --- | --- |
| `citas_mesa` y `citas_servicio` separadas | Un solo `citas` + `tipo` ya cubre los dos flujos |
| `pdf_exports` | El PDF se genera al vuelo |
| `taly_*` | La mascota es front |
| `sync_queue` | Cola **en el cliente** (IndexedDB), no en el servidor |
| `paises` / `ciudades` | Cuba / Sancti Spíritus como texto en `direccion` basta al inicio |

---

## Conteos

| Alcance | Tablas | Cuáles |
| --- | --- | --- |
| **Núcleo para que la app actual + dueño funcionen** | 12 | usuarios, locales, local_imagenes, servicios, profesionales, profesional_servicios, mesas, citas, cita_servicios, opiniones, local_miembros, local_horarios |
| **Producto completo del plan** | **20** | las 12 + sesiones, preferencias, categorias, amenidades, local_amenidades, favoritos, notificaciones, bloqueos_agenda |
| Amenidades/categorías/horarios en JSON al día 1 | se pueden posponer | no desaparecen del modelo; se posponen |

---

## Orden de implementación sugerido

1. `usuarios` + `locales` + `citas` (+ `cita_servicios` / `mesa_id`)
2. `servicios`, `profesionales`, `profesional_servicios`, `mesas`
3. `opiniones`, `local_imagenes`, `local_horarios`
4. `local_miembros` → dashboard
5. `sesiones`, `preferencias`
6. `favoritos`, `notificaciones`, `bloqueos_agenda`, catálogos (`categorias`, `amenidades`)

---

## Cómo se mapea al código de hoy

| Front / JSON | Tabla |
| --- | --- |
| `locales.json` (ficha) | `locales` + hijas |
| `urls[]` | `local_imagenes` |
| `iconos[]` | `amenidades` + `local_amenidades` |
| `dias[]` + apertura/cierre | `local_horarios` |
| `servicios[]` | `servicios` |
| `profesionales[]` + `servicios: []` | `profesionales` + `profesional_servicios` |
| `comentarios[]` | `opiniones` |
| `MESAS_MAPA` | `mesas` (por `local_id`) |
| `agregarCita({ tipo: con-lugar })` | `citas` + `mesa_id` |
| `agregarCita({ tipo: sin-lugar, servicios[] })` | `citas` + `cita_servicios` |
| `localStorage citaly_citas` | deja de ser fuente de verdad; cache offline |
| `citasVista.js` | no es tabla; sigue siendo traductor UI |
