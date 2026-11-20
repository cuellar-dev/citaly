# Cambios en el backend para conectar Descubre

Fecha: 20 de noviembre de 2026. Hechos desde el lado del frontend para que la pantalla Descubre (el ranking de `src/utils/ranking/`) pueda leer del backend `backend-citaly-main`.

**Por qué existe este documento.** La carpeta `backend-citaly-main` no está versionada en este repo (está en `.gitignore`) y no tiene `.git` propio. Este archivo es el único registro de lo que se tocó. Al final están los diffs completos de cada archivo, contra el backend tal como estaba antes de empezar.

**Reglas que se siguieron (acordadas con el socio):**

- **No se tocó nada de `Database/`** (ni migraciones, ni seeds, ni scripts). Todo funciona con el esquema que ya existe (migraciones 001 a 011).
- Solo se cambió lo necesario para Descubre. Además se añadió el recálculo de nota, opiniones, frase y precio, que el socio dejó opcional ("está de prueba"), porque sin él el ranking trabaja con números congelados.
- No se añadió ninguna dependencia nueva al `package.json`.
- No se activaron los jobs (`//iniciarJobs()` en `Server.js` sigue comentado): es decisión del socio.

---

## Resumen en una tabla

| # | Archivo | Tipo | Qué cambia |
| --- | --- | --- | --- |
| 1 | `Models/DescubreModel.js` | Modificado | El resumen trae días, `tiene_lugar`, distancia demo, dirección, vistas 24 h, comodidades en orden fijo, horas `HH:MM` y fecha `AAAA-MM-DD`. Nuevas consultas de categorías. |
| 2 | `Services/DescubreServices.js` | Modificado | Nuevo contrato del resumen; `[]` en vez de 404; eventos validados; filtros por nombre; categorías; promociones sin datos privados; recálculo masivo para el job. |
| 3 | `Controller/DescubreController.js` | Modificado | `uso-filtros` acepta `categoria` (nombre); nuevo `obtenerCategorias`. |
| 4 | `Routes/DescubreRouter.js` | Modificado | Nueva ruta `GET /api/descubre/categorias`. |
| 5 | `Models/ImpresionesModel.js` | Modificado | Inserción con `unnest` (9 parámetros fijos) y solo para locales que existen. |
| 6 | `Models/LocalExposicionModel.js` | Modificado | `ultima_vez_top` = solo vistas en el héroe o en los 3 primeros; ventana de 30 días. |
| 7 | `Models/PromocionesModel.js` | Modificado | Ya no devuelve presupuesto ni gastado; fechas como texto. |
| 8 | `Models/ResumenLocalModel.js` | **Nuevo** | Recalcula `rating_cache`, `opiniones_count`, frase destacada y `precio_desde`. |
| 9 | `Services/OpinionesService.js` | Modificado | Crear y borrar opinión recalculan el resumen del local en la misma transacción. |
| 10 | `Services/ServiciosServices.js` | Modificado | Crear, editar y borrar servicio recalculan `precio_desde`. |
| 11 | `Utils/eventosDescubre.js` | **Nuevo** | Validación pura de los eventos de Descubre. |
| 12 | `Utils/eventosDescubre.test.js` | **Nuevo** | 5 pruebas (`node --test`). |
| 13 | `Jobs/Ranking.js` | Modificado | El job también recalcula el resumen de todos los locales. |
| 14 | `App.js` | Modificado | CORS: añade `localhost:5174` y `localhost:4173` (solo desarrollo). |
| 15 | `Models/LocalExposicionModel.js` | Modificado (2ª ronda) | "Estuvo arriba" = solo la primera pantalla (héroe, y 3 primeros de `abiertos` y `antojo-1`). Ver "Segunda ronda". |

---

## 1. `Models/DescubreModel.js` — el resumen trae lo que el front necesita

**Antes faltaba:** `dias`, `tiene_lugar`, `distancia_mock_m`, `direccion`, `vistas_24h`. Las comodidades salían como objetos `{id, nombre, icono_key}` en orden arbitrario (un `DISTINCT` sobre JSON), así que las 3 que enseñaba la tarjeta cambiaban sin motivo.

**Ahora:**

- `dias`: `array_agg(dia_semana) FILTER (WHERE NOT cerrado)` de `local_horarios`, en un `LATERAL`. Sin días no se puede calcular "abierto ahora" ni el factor *contexto* del ranking.
- `tiene_lugar`, `distancia_mock_m`, `direccion` y `le.vistas_24h` se seleccionan.
- Comodidades: solo los ids, ordenados por importancia fija (`wifi`, `parking`, `snow`, `transfer`, `no-cigarrete`, `cigarrete`; los demás después, por orden alfabético). Se pasa como parámetro `$2` y se usa `array_position`.
- `horario_apertura`/`horario_cierre` salen como `HH:MM` (`to_char`), no `10:00:00`.
- `fecha_alta` sale como `AAAA-MM-DD` (`to_char`). Como `DATE` crudo, el driver lo convierte a `Date` y al pasar a JSON se puede correr un día por la zona horaria.
- Se quitó el `GROUP BY` (ya no hace falta: las agregaciones van en `LATERAL`), así que no hay N+1 ni filas duplicadas.
- **Nuevo** `getCategorias()`: id, slug, nombre, modo, en_feed, agrupar_por.
- **Nuevo** `getCategoriaIdPorNombre(nombre)`.

## 2. `Services/DescubreServices.js`

### 2.1 Contrato de `GET /api/descubre/local/resumen`

Respuesta: `{ data: [ ...locales ] }`. Cada local:

| Campo | Tipo | De dónde |
| --- | --- | --- |
| `id`, `nombre`, `categoriaId`, `categoria` | texto | `locales`, `categorias` |
| `modo`, `enFeed`, `agruparPor` | texto / bool | `categorias` |
| `direccion` | texto o null | `locales.direccion` (**nuevo**) |
| `foto` | URL o null | portada en `local_imagenes` |
| `nota`, `opiniones` | número | `rating_cache`, `opiniones_count` |
| `repetidores` | número | `repetidores_cache` |
| `notaRanking` | número | nota bayesiana con `ranking_stats` |
| `fechaAlta` | `AAAA-MM-DD` | `fecha_alta` |
| `ultimaVezTop` | fecha o null | `local_exposicion` |
| `vistas24h` | número | `local_exposicion.vistas_24h` (**nuevo**) |
| `comodidades` | ids, máx. 3 | `local_amenidades` (**ahora solo ids, orden fijo**) |
| `precioDesde` | número o null | `precio_desde` (**ahora número**) |
| `frase` | `{texto, autor, foto}` o null | `frase_destacada_*` |
| `lat`, `lng` | número o null | **ahora números** (el driver los da como texto) |
| `provincia` | texto | `locales.provincia` |
| `metros` | número o null | `distancia_mock_m` (**nuevo**, demo hasta que haya geolocalización) |
| `tieneLugar` | bool | `tiene_lugar` (**nuevo**) |
| `horarioApertura`, `horarioCierre` | `HH:MM` | `locales` |
| `dias` | `['l','m',…]` | `local_horarios` (**nuevo**) |
| `aceptaReservas` | bool | `locales.abierto` (**renombrado**) |

**Renombre importante:** el campo `abierto` pasa a llamarse `aceptaReservas`. Es el interruptor del dueño (acepta reservas o no), **no** "abierto ahora". Con el nombre viejo el front lo habría leído mal. "Abierto ahora" lo calcula el front con horario y días.

### 2.2 Provincia vacía: `[]` y no 404

Antes, sin locales, lanzaba `404 NO_DISCOVERABLE_LOCALS`. Una provincia vacía o la BD recién creada no es un error: ahora responde `200` con `[]` y el front enseña "Todavía no hay lugares en tu zona".

### 2.3 `POST /api/descubre/eventos` validado

Antes cualquier cosa iba directa al `INSERT`: un `id` que no fuera UUID o un local inexistente daba **500 para todo el lote**, y el cliente lo habría reenviado para siempre.

Ahora (`Utils/eventosDescubre.js`):

- Más de **100** eventos por petición → `413 TOO_MANY_EVENTS`.
- Si no es una lista → `400 INVALID_EVENTS`.
- Cada evento se valida por separado: `id` UUID, `localId` texto (máx. 120), `bloque` `[\w-]{1,40}`, `posicion` entero 0–500, `tipo` **solo `vista` o `toque`**, `semilla` entero o null. Los malos se descartan y se cuentan; **uno malo no tumba el lote**.
- Ids repetidos dentro del mismo lote se descartan.
- `patrocinado` lo fuerza el servidor a `false`: no lo decide el navegador.
- `reserva` ya no se acepta del cliente: debería registrarlo el servidor al crear la cita (pendiente, ver abajo).
- `anonimoId` opcional pero con formato `[\w-]{8,64}`; si viene mal → `400 INVALID_ANONYMOUS_ID`. Sin sesión ni `anonimoId` → `400 MISSING_IDENTITY`.
- Respuesta `202`: `{ recibidos, insertadas, rechazados }`. `recibidos − insertadas − rechazados` = repetidos (ya estaban) o de locales que ya no existen.

### 2.4 `POST /api/descubre/uso-filtros` por nombre

Sigue necesitando sesión (`requireAuth`). Ahora acepta `{ categoriaId }` **o** `{ categoria: "Restaurante" }`: el front cuenta los filtros por nombre. Si el nombre no existe → `404`.

### 2.5 `GET /api/descubre/categorias` (nuevo)

`{ data: [{ id, slug, nombre, modo, enFeed, agruparPor }] }`. Público.

### 2.6 `GET /api/descubre/promociones`

- Ya no devuelve `SELECT *`: era público y enseñaba el **presupuesto y lo gastado** de cada local. Ahora solo `{ id, localId, desde, hasta }`.
- `?fecha=` inválida → `400 INVALID_DATE` (antes llegaba a Postgres y salía un 500).

### 2.7 `recalcularResumenes()` (nuevo)

Llama a `ResumenLocalModel.recalcularTodos()`. Lo usa el job.

## 3. `Controller/DescubreController.js` y 4. `Routes/DescubreRouter.js`

- `registrarUsoFiltro` pasa `{ categoriaId, categoria }` al servicio.
- Nuevo `obtenerCategorias` y su ruta `GET /api/descubre/categorias`.

## 5. `Models/ImpresionesModel.js`

`crearLote` ahora inserta con `unnest` de arrays: siempre **9 parámetros**, da igual el tamaño del lote (antes eran 9 por evento). Además solo inserta eventos de locales que existen (`WHERE EXISTS (SELECT 1 FROM locales …)`), así que un local borrado no rompe la inserción con un error de clave foránea. Sigue con `ON CONFLICT (id) DO NOTHING` (idempotente).

## 6. `Models/LocalExposicionModel.js`

`ultima_vez_top` antes era `MAX(creado_en) WHERE posicion < 5`: contaba **cualquier evento** (también un toque) en cualquier bloque. Ahora es la última **vista** en el héroe o en los 3 primeros de un bloque, la misma regla que usa el front (`src/utils/ranking/exposicion.js`). El `LEFT JOIN impresiones` se limita a los últimos 30 días para no recorrer todo el histórico.

## 7. `Models/PromocionesModel.js`

`getActivas` selecciona solo `id, local_id, desde, hasta` y las fechas como `AAAA-MM-DD`. `consumirImpresiones` no se tocó.

## 8. `Models/ResumenLocalModel.js` (nuevo) — contar opiniones y lo demás

Mantiene al día los campos que lee Descubre:

- `rating_cache`: `ROUND(AVG(calificacion), 1)` de las opiniones **visibles** (0 si no hay).
- `opiniones_count`: número de opiniones visibles.
- `frase_destacada_texto/autor/foto`: la opinión visible con más nota y, a igualdad, la más corta (la misma regla que `fraseDeLocal()` del front). Autor y foto salen de `"user".name` y `"user".image`.
- `precio_desde`: mínimo de los servicios **activos** con precio > 0 (NULL si no hay).

Usa subconsultas escalares para que un local que se queda sin opiniones o sin servicios vuelva a 0 o NULL. La frase se busca con un `LATERAL` sobre un alias `base` de la misma fila, porque en Postgres un `LATERAL` del `FROM` de un `UPDATE` no puede referirse a la tabla que se actualiza.

- `recalcular(localId, executor)`: un local; pensado para llamarse en la misma transacción que el cambio.
- `recalcularTodos(executor)`: todos; red de seguridad para el job.

## 9. `Services/OpinionesService.js`

`createOpinion` y `deleteOpinion` ahora usan `withTransaction` (ya existía en `Config/db.js`): la opinión y el resumen del local cambian juntos o no cambian.

## 10. `Services/ServiciosServices.js`

Después de crear, editar o borrar un servicio se llama a `ResumenLocalModel.recalcular(localId)` (precio "desde"). No va en transacción porque `ServiciosModel` no acepta `executor` en esas funciones y no se quiso cambiar su firma; si fallara, el job nocturno lo corrige.

## 11 y 12. `Utils/eventosDescubre.js` y su prueba

Validación pura, sin base de datos. Las pruebas corren con el script que ya existía: `pnpm test` (`node --test`). Resultado: **5 de 5 pasan**.

## 13. `Jobs/Ranking.js`

Después de `recalcularRepetidores()` llama a `recalcularResumenes()`. Los jobs siguen **sin activarse** en `Server.js`.

## 14. `App.js`

CORS de desarrollo: además de `localhost:5173`, `localhost:5174` (Vite usa el siguiente puerto si el 5173 está ocupado) y `localhost:4173` (`vite preview`). En producción hay que poner el dominio real (ya apuntado en `REVISION_BACKEND.md`, #19).

---

## Cómo se probó

No hay base de datos ni `node_modules` en el backend, así que:

1. `node --check` de todos los archivos de `Models`, `Services`, `Controller`, `Routes`, `Jobs`, `Utils` y `App.js`: sin errores.
2. `node --test Utils/eventosDescubre.test.js`: 5/5.
3. **Contra Postgres real**: con [PGlite](https://pglite.dev) (Postgres compilado a WebAssembly) en una carpeta temporal fuera del repo. Se aplicaron las **11 migraciones del socio tal cual** (solo se quitó en memoria `CREATE EXTENSION pgcrypto`, que PGlite no trae; `gen_random_uuid()` ya es nativo desde Postgres 13). Se ejecutó el código real de `Services/` y `Models/` (con un `Config/db.js` falso que apunta a PGlite). Comprobado:
   - Crear 3 opiniones → `rating_cache 4.3`, `opiniones_count 3`, frase y `precio_desde 1200` (ignora el servicio inactivo y el de precio 0). Borrar la de 3★ → `5.0`, `2`.
   - El resumen sale con todos los campos de la tabla 2.1; provincia sin locales → `[]`.
   - Eventos: de 4 (uno bueno, uno de local inexistente, uno con id malo, uno `reserva`) → `insertadas 1, rechazados 2`. Reenviar el mismo → `insertadas 0`.
   - Exposición, categorías, filtro por nombre, promociones (`[]` en 2099, una hoy; fecha mala → 400).
4. **De punta a punta con el front**: un servidor HTTP mínimo con ese mismo código y los 69 locales de la demo cargados en PGlite (con sus opiniones y servicios). Con `VITE_API_URL` apuntando a él, Descubre cargó los 69 locales del backend, las tarjetas enseñaron la nota, el "desde" y la frase calculados por el backend, y las impresiones llegaron a la tabla `impresiones` con su `anonimo_id` y su `semilla`. Con el servidor apagado, Descubre cayó en los datos de demo.

**No se probó con Neon** ni con Better Auth real (sesión): `uso-filtros` solo se probó en la parte del servicio.

---

## Lo que queda pendiente en el backend (no se hizo)

- **Seed**: `Database/Seeds/descubre-locales.json` sigue con los 33 locales viejos (con dentista y veterinaria, sin coordenadas y con notas sin filas en `opiniones`). El front ya tiene 69 con lat/lng. Al ejecutar el recálculo nuevo, los locales del seed sin opiniones reales pasan a nota 0. No se tocó porque está en `Database/`.
- **Asistencia (estado 4)**: nadie marca las citas como asistidas, así que `repetidores_cache` sigue en 0.
- **`reserva` como evento**: debería registrarlo el servidor al crear la cita.
- **Límite de ritmo** en `POST /eventos` (por IP y `anonimoId`): necesita `express-rate-limit`, que no está instalado.
- **Moderación**: si algún día se cambia `opiniones.visible`, llamar a `ResumenLocalModel.recalcular`.
- **Jobs**: activar `iniciarJobs()` cuando se despliegue.
- **Ficha del local** (`GET /locales/:id`) y la fase 2 (`GET /api/descubre` con snapshot) no se tocaron.

## Lo que se hizo en el frontend (para tenerlo junto)

- `src/services/api.js`: cliente del backend. Lee `VITE_API_URL`; si no está, la app sigue con la demo.
- `src/services/descubreApi.js`: `cargarResumen()`, `adaptarResumen()` (de la forma del backend a la del front), `enviarEventos()`, `enviarUsoFiltro()`.
- `src/services/identidad.js`: `anonimoId` del navegador. También es la semilla del orden mientras no haya login real.
- `src/services/impresiones.js`: envía las impresiones a `POST /api/descubre/eventos` en lotes de 100 (con `fetch` y `keepalive`, no `sendBeacon`, porque `sendBeacon` no puede mandar JSON a otro origen con cookies).
- `src/pages/Descubre.jsx`: carga del backend con esqueleto mientras llega, estado vacío, y respaldo a la demo si falla.
- `notaDeComentarios`, `fraseDeLocal` y `desdeTexto` usan la nota, la frase y el precio del backend cuando el local no trae comentarios ni servicios.
- `src/utils/ranking/exposicion.js`: suma la exposición global del backend a la del usuario (solo lo anterior al inicio del día, para que el orden no se mueva).

Para usarlo: crear `.env` (o `.env.development.local`) con `VITE_API_URL=http://localhost:1234` (el puerto del backend) y arrancar los dos.

---

## Segunda ronda (20 nov 2026, tarde)

Un solo cambio más en el backend, al revisar bugs de Descubre. **Tampoco se tocó `Database/`.**

### 15. `Models/LocalExposicionModel.js`: qué cuenta como "estuvo arriba"

**El bug:** `ultima_vez_top` contaba como "arriba" los 3 primeros de **cualquier** bloque. Descubre ahora tiene muchos bloques ("Más lugares" en trozos de 5 hasta el final de la página), y los 3 primeros de un trozo del fondo también contaban. Un local visto muy abajo perdía "novedad" al día siguiente como si hubiera estado en el héroe.

**Ahora:** solo la primera pantalla. Una **vista** en el héroe (cualquier posición), o en las posiciones 0-2 de la fila de abiertos (`abiertos`) o de la primera lista (`antojo-1`). Es la misma regla que el front (`src/utils/ranking/exposicion.js`, `BLOQUES_ARRIBA`); si se cambia en un sitio hay que cambiarla en el otro.

Antes (tras la primera ronda):

```sql
MAX(i.creado_en) FILTER (
    WHERE i.tipo = 'vista'
    AND (i.bloque = 'heroe' OR i.posicion < 3)
),
```

Después:

```sql
MAX(i.creado_en) FILTER (
    WHERE i.tipo = 'vista'
    AND (
        i.bloque = 'heroe'
        OR (i.bloque IN ('abiertos', 'antojo-1') AND i.posicion < 3)
    )
),
```

Probado otra vez contra Postgres (PGlite con las 11 migraciones): una vista en el héroe marca `ultima_vez_top`; `node --check` sin errores.

### Nombres de bloque que manda el front (para `impresiones.bloque`)

Por si se quiere analizar en la BD: `heroe`, `abiertos`, `antojo-1`, `antojo-2`, `descubrir`, `mejores`, `cerca`, `guardaste`, `nuevos`, `capricho`, `mesa`, `cuidado`, `tarde`, `rutina`, `baratos` y `mas-1`, `mas-2`… Todos cumplen la validación `[w-]{1,40}` de `Utils/eventosDescubre.js`.

### Lo que el front resolvió sin tocar el backend

- **Todos los locales del seed salían como "nuevos"** (`fecha_alta` = el día que se cargaron). Ahora el front solo considera nuevo un local con **menos de 30 días y 3 opiniones o menos**: el arranque en frío es no tener opiniones. No hace falta cambiar la BD.
- **La ubicación del usuario** para "Cerca de ti" se queda en el móvil y **no se manda nunca al backend**: no hace falta ningún endpoint.

---

## Anexo: diffs completos

Generados con `diff -u` contra la copia del backend hecha justo antes de empezar. Los archivos nuevos van enteros.

### `Models/DescubreModel.js`

```diff
--- antes/Models/DescubreModel.js
+++ despues/Models/DescubreModel.js
@@ -1,6 +1,10 @@
 import { ejecutarConsulta, query } from '../Config/db.js';
 import { manejarError } from '../Utils/validaciones.js';
 
+/* Orden fijo de importancia de las comodidades: la tarjeta de Descubre enseña
+   las 3 primeras, así que siempre deben salir las mismas y en el mismo orden. */
+const ORDEN_COMODIDADES = ['wifi', 'parking', 'snow', 'transfer', 'no-cigarrete', 'cigarrete'];
+
 export default class DescubreModel {
 	static async getResumenLocales(provincia = null, executor = query) {
 		try {
@@ -9,10 +13,11 @@
 					l.id,
 					l.nombre,
 					l.categoria_id,
+					l.direccion,
 					l.rating_cache,
 					l.opiniones_count,
 					l.repetidores_cache,
-					l.fecha_alta,
+					to_char(l.fecha_alta, 'YYYY-MM-DD') AS fecha_alta,
 					l.precio_desde,
 					l.frase_destacada_texto,
 					l.frase_destacada_autor,
@@ -20,29 +25,22 @@
 					l.lat,
 					l.lng,
 					l.provincia,
-					l.horario_apertura,
-					l.horario_cierre,
+					l.tiene_lugar,
+					l.distancia_mock_m,
+					to_char(l.horario_apertura, 'HH24:MI') AS horario_apertura,
+					to_char(l.horario_cierre, 'HH24:MI') AS horario_cierre,
 					l.abierto,
 					c.nombre AS categoria_nombre,
 					c.modo,
 					c.en_feed,
 					c.agrupar_por,
 					portada.url AS foto,
-					COALESCE(
-						jsonb_agg(
-							DISTINCT jsonb_build_object(
-								'id', a.id,
-								'nombre', a.nombre,
-								'icono_key', a.icono_key
-							)
-						) FILTER (WHERE a.id IS NOT NULL),
-						'[]'::jsonb
-					) AS amenidades,
-					le.ultima_vez_top
+					COALESCE(comodidades.ids, '{}') AS amenidades,
+					COALESCE(horario.dias, '{}') AS dias,
+					le.ultima_vez_top,
+					le.vistas_24h
 				FROM locales l
 				INNER JOIN categorias c ON c.id = l.categoria_id
-				LEFT JOIN local_amenidades la ON la.local_id = l.id
-				LEFT JOIN amenidades a ON a.id = la.amenidad_id
 				LEFT JOIN local_exposicion le ON le.local_id = l.id
 				LEFT JOIN LATERAL (
 					SELECT li.url
@@ -51,20 +49,54 @@
 					ORDER BY li.orden ASC, li.id ASC
 					LIMIT 1
 				) portada ON TRUE
+				LEFT JOIN LATERAL (
+					SELECT array_agg(
+						la.amenidad_id
+						ORDER BY COALESCE(array_position($2::text[], la.amenidad_id), 999), la.amenidad_id
+					) AS ids
+					FROM local_amenidades la
+					WHERE la.local_id = l.id
+				) comodidades ON TRUE
+				LEFT JOIN LATERAL (
+					SELECT array_agg(lh.dia_semana::text ORDER BY lh.dia_semana) FILTER (WHERE NOT lh.cerrado) AS dias
+					FROM local_horarios lh
+					WHERE lh.local_id = l.id
+				) horario ON TRUE
 				WHERE l.activo = TRUE
 					AND c.en_feed = TRUE
 					AND ($1::text IS NULL OR l.provincia = $1)
-				GROUP BY
-					l.id,
-					c.id,
-					portada.url,
-					le.ultima_vez_top
 				ORDER BY l.nombre ASC, l.id ASC
-			`, [provincia]);
+			`, [provincia, ORDEN_COMODIDADES]);
 
 			return result.rows;
 		} catch (error) {
 			manejarError('DescubreModel', 'No se pudo obtener el resumen de locales', error);
 		}
 	}
+
+	/** Categorías con su modo de consumo, para traducir nombre ↔ id en el front. */
+	static async getCategorias(executor = query) {
+		try {
+			const result = await ejecutarConsulta(executor, `
+				SELECT id, slug, nombre, modo, en_feed, agrupar_por
+				FROM categorias
+				ORDER BY nombre ASC
+			`);
+			return result.rows;
+		} catch (error) {
+			manejarError('DescubreModel', 'No se pudieron obtener las categorias', error);
+		}
+	}
+
+	/** Id de una categoría a partir de su nombre ("Restaurante"), o null. */
+	static async getCategoriaIdPorNombre(nombre, executor = query) {
+		try {
+			const result = await ejecutarConsulta(executor, `
+				SELECT id FROM categorias WHERE nombre = $1 LIMIT 1
+			`, [nombre]);
+			return result.rows[0]?.id ?? null;
+		} catch (error) {
+			manejarError('DescubreModel', 'No se pudo obtener la categoria', error);
+		}
+	}
 }
```

### `Services/DescubreServices.js`

```diff
--- antes/Services/DescubreServices.js
+++ despues/Services/DescubreServices.js
@@ -7,6 +7,8 @@
 import UsoFiltrosModel from '../Models/UsoFiltrosModel.js';
 import PromocionesModel from '../Models/PromocionesModel.js';
 import DescubreSnapshotsModel from '../Models/DescubreSnapshotsModel.js';
+import ResumenLocalModel from '../Models/ResumenLocalModel.js';
+import { filtrarEventos, validarAnonimoId } from '../Utils/eventosDescubre.js';
 
 export default class DescubreServices {
     static calcularNotaBayesianaConEstadisticas(local, estadisticas) {
@@ -55,8 +57,10 @@
             RankingStatsModel.get(executor),
         ]);
 
+        /* Una provincia sin locales (o la BD recién creada) no es un error:
+           200 con [] y el front enseña su estado vacío. */
         if (locales.length === 0) {
-            throw crearError('No se encontraron locales activos para Descubre.', 404, 'NO_DISCOVERABLE_LOCALS');
+            return [];
         }
 
         if (!estadisticas) {
@@ -67,6 +71,7 @@
             );
         }
 
+        /* Contrato del resumen: lo que lee el front en src/services/descubreApi.js. */
         return locales.map((local) => {
             return {
                 id: local.id,
@@ -75,6 +80,8 @@
                 categoria: local.categoria_nombre,
                 modo: local.modo,
                 enFeed: local.en_feed,
+                agruparPor: local.agrupar_por,
+                direccion: local.direccion ?? null,
                 foto: local.foto ?? null,
                 nota: Number(local.rating_cache ?? 0),
                 opiniones: Number(local.opiniones_count ?? 0),
@@ -82,19 +89,31 @@
                 notaRanking: DescubreServices.calcularNotaBayesianaConEstadisticas(local, estadisticas),
                 fechaAlta: local.fecha_alta,
                 ultimaVezTop: local.ultima_vez_top ?? null,
-                comodidades: local.amenidades.slice(0, 3),
-                precioDesde: local.precio_desde,
+                vistas24h: Number(local.vistas_24h ?? 0),
+                /* Solo ids y en orden fijo de importancia (DescubreModel). */
+                comodidades: (local.amenidades ?? []).slice(0, 3),
+                precioDesde: local.precio_desde === null || local.precio_desde === undefined
+                    ? null
+                    : Number(local.precio_desde),
                 frase: local.frase_destacada_texto ? {
                     texto: local.frase_destacada_texto,
                     autor: local.frase_destacada_autor,
                     foto: local.frase_destacada_foto,
                 } : null,
-                lat: local.lat,
-                lng: local.lng,
+                lat: local.lat === null ? null : Number(local.lat),
+                lng: local.lng === null ? null : Number(local.lng),
                 provincia: local.provincia,
+                /* Distancia de demo mientras no haya geolocalización real. */
+                metros: local.distancia_mock_m === null ? null : Number(local.distancia_mock_m),
+                tieneLugar: Boolean(local.tiene_lugar),
                 horarioApertura: local.horario_apertura,
                 horarioCierre: local.horario_cierre,
-                abierto: local.abierto,
+                /* Días que abre: 'l','m','x','j','v','s','d' (local_horarios). */
+                dias: local.dias ?? [],
+                /* Antes se llamaba "abierto", pero es el interruptor del dueño
+                   (acepta reservas o no), NO "abierto ahora". Eso lo calcula el
+                   front con el horario y los días. */
+                aceptaReservas: Boolean(local.abierto),
             };
         });
     }
@@ -114,20 +133,64 @@
 
     static async registrarImpresiones(eventos, identidad, executor = query) {
         validarObjeto(identidad, 'de identidad');
-        if (!Array.isArray(eventos)) {
+
+        const anonimo = validarAnonimoId(identidad.anonimoId);
+        if (!anonimo.ok) {
+            throw crearError('El anonimoId no es valido.', 400, 'INVALID_ANONYMOUS_ID');
+        }
+        if (!identidad.usuarioId && !anonimo.valor) {
+            throw crearError('Hace falta sesion o anonimoId para registrar eventos.', 400, 'MISSING_IDENTITY');
+        }
+
+        const { validos, rechazados, demasiados, noEsLista } = filtrarEventos(eventos);
+        if (noEsLista) {
             throw crearError('Los eventos de Descubre deben ser una lista.', 400, 'INVALID_EVENTS');
         }
-        return ImpresionesModel.crearLote(eventos, identidad, executor);
+        if (demasiados) {
+            throw crearError('Demasiados eventos en una sola peticion.', 413, 'TOO_MANY_EVENTS');
+        }
+
+        const { insertadas } = validos.length
+            ? await ImpresionesModel.crearLote(
+                validos,
+                { usuarioId: identidad.usuarioId ?? null, anonimoId: anonimo.valor },
+                executor,
+            )
+            : { insertadas: 0 };
+
+        /* recibidos - insertadas - rechazados = repetidos o de locales que ya no existen. */
+        return { recibidos: eventos.length, insertadas, rechazados };
     }
 
     static async recalcularExposicion(executor = query) {
         return LocalExposicionModel.recalcular(executor);
     }
 
-    static async registrarUsoFiltro(usuarioId, categoriaId, executor = query) {
+    /* Acepta el id de la categoría o su nombre ("Restaurante"): el front
+       cuenta los filtros por nombre. */
+    static async registrarUsoFiltro(usuarioId, { categoriaId = null, categoria = null } = {}, executor = query) {
         validarId(usuarioId, 'El usuario_id');
-        validarId(categoriaId, 'El categoria_id');
-        return UsoFiltrosModel.registrar(usuarioId, categoriaId, executor);
+        let id = categoriaId;
+        if (!id && typeof categoria === 'string' && categoria.trim()) {
+            id = await DescubreModel.getCategoriaIdPorNombre(categoria.trim(), executor);
+            if (!id) {
+                throw crearError('La categoria no existe.', 404, 'RESOURCE_NOT_FOUND');
+            }
+        }
+        validarId(id, 'El categoria_id');
+        return UsoFiltrosModel.registrar(usuarioId, id, executor);
+    }
+
+    static async obtenerCategorias(executor = query) {
+        const categorias = await DescubreModel.getCategorias(executor);
+        return categorias.map((c) => ({
+            id: c.id,
+            slug: c.slug,
+            nombre: c.nombre,
+            modo: c.modo,
+            enFeed: c.en_feed,
+            agruparPor: c.agrupar_por,
+        }));
     }
 
     static async obtenerUsoFiltros(usuarioId, executor = query) {
@@ -136,7 +199,17 @@
     }
 
     static async obtenerPromocionesActivas(fecha = new Date(), executor = query) {
-        return PromocionesModel.getActivas(fecha, executor);
+        const dia = fecha instanceof Date ? fecha : new Date(fecha);
+        if (Number.isNaN(dia.getTime())) {
+            throw crearError('La fecha no es valida.', 400, 'INVALID_DATE');
+        }
+        const promociones = await PromocionesModel.getActivas(dia, executor);
+        return promociones.map((p) => ({ id: p.id, localId: p.local_id, desde: p.desde, hasta: p.hasta }));
+    }
+
+    /* Red de seguridad para el job: nota, opiniones, frase y precio de todos. */
+    static async recalcularResumenes(executor = query) {
+        return ResumenLocalModel.recalcularTodos(executor);
     }
 
     static async consumirPromocion(promocionId, cantidad = 1, executor = query) {
```

### `Controller/DescubreController.js`

```diff
--- antes/Controller/DescubreController.js
+++ despues/Controller/DescubreController.js
@@ -32,15 +32,25 @@
     static async registrarUsoFiltro(req, res) {
         try {
             const usuarioId = req.userId;
-            const categoriaId = req.body?.categoriaId;
-
-            const resultado = await DescubreServices.registrarUsoFiltro(usuarioId, categoriaId);
+            const resultado = await DescubreServices.registrarUsoFiltro(usuarioId, {
+                categoriaId: req.body?.categoriaId ?? null,
+                categoria: req.body?.categoria ?? null,
+            });
             return responderExito(res, resultado, 201);
         } catch (error) {
             return responderError(res, error, 'Error al registrar el uso del filtro');
         }
     }
 
+    static async obtenerCategorias(req, res) {
+        try {
+            const categorias = await DescubreServices.obtenerCategorias();
+            return responderExito(res, categorias);
+        } catch (error) {
+            return responderError(res, error, 'Error al obtener las categorias');
+        }
+    }
+
     static async obtenerPromociones(req, res) {
         try {
             const fecha = req.query.fecha ?? new Date();
```

### `Routes/DescubreRouter.js`

```diff
--- antes/Routes/DescubreRouter.js
+++ despues/Routes/DescubreRouter.js
@@ -7,6 +7,7 @@
 descubreRouter.get('/local/resumen', DescubreController.getResumen);
 descubreRouter.post('/eventos', optionalAuth, DescubreController.registrarEventos);
 descubreRouter.post('/uso-filtros', requireAuth, DescubreController.registrarUsoFiltro);
+descubreRouter.get('/categorias', DescubreController.obtenerCategorias);
 descubreRouter.get('/promociones', DescubreController.obtenerPromociones);
 
 export default descubreRouter;
```

### `Models/ImpresionesModel.js`

```diff
--- antes/Models/ImpresionesModel.js
+++ despues/Models/ImpresionesModel.js
@@ -7,32 +7,36 @@
             return { insertadas: 0 };
         }
 
-        const valores = [];
-        const filas = eventos.map((evento, indice) => {
-            const base = indice * 9;
-            valores.push(
-                evento.id,
-                identidad.usuarioId ?? null,
-                identidad.anonimoId ?? null,
-                evento.localId,
-                evento.bloque,
-                evento.posicion,
-                evento.tipo,
-                evento.patrocinado ?? false,
-                evento.semilla ?? null,
-            );
-            return `($${base + 1}::uuid, $${base + 2}, $${base + 3}, $${base + 4}, $${base + 5}, $${base + 6}, $${base + 7}, $${base + 8}, $${base + 9}, now())`;
-        });
-
+        /* Una fila por evento con unnest (siempre 9 parámetros, da igual el
+           tamaño del lote) y solo para locales que existen: un local borrado ya
+           no rompe el lote con un error de clave foránea. Los eventos llegan ya
+           validados por Utils/eventosDescubre.js. */
         try {
             const result = await ejecutarConsulta(executor, `
                 INSERT INTO impresiones (
                     id, usuario_id, anonimo_id, local_id, bloque, posicion,
                     tipo, patrocinado, semilla, creado_en
                 )
-                VALUES ${filas.join(', ')}
+                SELECT
+                    v.id, $1, $2, v.local_id, v.bloque, v.posicion,
+                    v.tipo, v.patrocinado, v.semilla, now()
+                FROM unnest(
+                    $3::uuid[], $4::text[], $5::text[], $6::smallint[],
+                    $7::text[], $8::boolean[], $9::bigint[]
+                ) AS v(id, local_id, bloque, posicion, tipo, patrocinado, semilla)
+                WHERE EXISTS (SELECT 1 FROM locales l WHERE l.id = v.local_id)
                 ON CONFLICT (id) DO NOTHING
-            `, valores);
+            `, [
+                identidad.usuarioId ?? null,
+                identidad.anonimoId ?? null,
+                eventos.map((e) => e.id),
+                eventos.map((e) => e.localId),
+                eventos.map((e) => e.bloque),
+                eventos.map((e) => e.posicion),
+                eventos.map((e) => e.tipo),
+                eventos.map((e) => e.patrocinado ?? false),
+                eventos.map((e) => e.semilla ?? null),
+            ]);
             return { insertadas: result.rowCount };
         } catch (error) {
             manejarError('ImpresionesModel', 'No se pudo guardar el lote de impresiones', error);
```

### `Models/LocalExposicionModel.js`

```diff
--- antes/Models/LocalExposicionModel.js
+++ despues/Models/LocalExposicionModel.js
@@ -31,10 +31,19 @@
                         WHERE i.tipo = 'toque'
                         AND i.creado_en >= now() - INTERVAL '24 hours'
                     )::integer,
-                    MAX(i.creado_en) FILTER (WHERE i.posicion < 5),
+                    /* "Estuvo arriba": una VISTA en el héroe o en los 3
+                       primeros de un bloque. Igual que el front
+                       (src/utils/ranking/exposicion.js). Un toque no cuenta. */
+                    MAX(i.creado_en) FILTER (
+                        WHERE i.tipo = 'vista'
+                        AND (i.bloque = 'heroe' OR i.posicion < 3)
+                    ),
                     now()
                 FROM locales l
-                LEFT JOIN impresiones i ON i.local_id = l.id
+                /* Solo los últimos 30 días: no recorrer todo el histórico. */
+                LEFT JOIN impresiones i
+                    ON i.local_id = l.id
+                    AND i.creado_en >= now() - INTERVAL '30 days'
                 GROUP BY l.id
                 ON CONFLICT (local_id) DO UPDATE SET
                     vistas_24h = EXCLUDED.vistas_24h,
```

### `Models/PromocionesModel.js`

```diff
--- antes/Models/PromocionesModel.js
+++ despues/Models/PromocionesModel.js
@@ -4,8 +4,14 @@
 export default class PromocionesModel {
     static async getActivas(fecha = new Date(), executor = query) {
         try {
+            /* Solo lo que necesita el front para colocar el hueco: el
+               presupuesto y lo gastado de cada local no son públicos. */
             const result = await ejecutarConsulta(executor, `
-                SELECT *
+                SELECT
+                    id,
+                    local_id,
+                    to_char(desde, 'YYYY-MM-DD') AS desde,
+                    to_char(hasta, 'YYYY-MM-DD') AS hasta
                 FROM promociones
                 WHERE activa = TRUE
                     AND desde <= $1::date
```

### `Services/OpinionesService.js`

```diff
--- antes/Services/OpinionesService.js
+++ despues/Services/OpinionesService.js
@@ -1,5 +1,7 @@
 import LocalesModel from '../Models/LocalesModel.js';
 import OpinionesModel from '../Models/OpinionesModel.js';
+import ResumenLocalModel from '../Models/ResumenLocalModel.js';
+import { withTransaction } from '../Config/db.js';
 import { crearError, validarId } from '../Utils/validaciones.js';
 
 export class OpinionesService {
@@ -27,7 +29,13 @@
             throw crearError('El local especificado no existe.', 404, 'RESOURCE_NOT_FOUND');
         }
 
-        const opinion = await OpinionesModel.crearOpinion(localId, usuarioId, opinionData);
+        /* La opinión y la nota del local (rating_cache, opiniones_count y frase
+           destacada que lee Descubre) cambian juntas o no cambian. */
+        const opinion = await withTransaction(async (client) => {
+            const creada = await OpinionesModel.crearOpinion(localId, usuarioId, opinionData, client);
+            if (creada) await ResumenLocalModel.recalcular(localId, client);
+            return creada;
+        });
         if (!opinion) {
             throw crearError('No se pudo crear la opinion.', 400, 'CREATE_OPINION_ERROR');
         }
@@ -47,7 +55,11 @@
             throw crearError('No tienes permiso para eliminar esta opinion.', 403, 'FORBIDDEN');
         }
 
-        const opinionEliminada = await OpinionesModel.deleteOpinion(opinionId);
+        const opinionEliminada = await withTransaction(async (client) => {
+            const eliminada = await OpinionesModel.deleteOpinion(opinionId, client);
+            if (eliminada) await ResumenLocalModel.recalcular(eliminada.local_id, client);
+            return eliminada;
+        });
         if (!opinionEliminada) {
             throw crearError('La opinion especificada no existe.', 404, 'RESOURCE_NOT_FOUND');
         }
```

### `Services/ServiciosServices.js`

```diff
--- antes/Services/ServiciosServices.js
+++ despues/Services/ServiciosServices.js
@@ -1,5 +1,6 @@
  import LocalesModel from "../Models/LocalesModel.js";
 import ServiciosModel from "../Models/ServiciosModel.js";
+import ResumenLocalModel from "../Models/ResumenLocalModel.js";
 import { crearError } from "../Utils/validaciones.js";
 
 export default class ServiciosServices {
@@ -37,6 +38,9 @@
             throw crearError('No se pudo crear el servicio.', 400, 'CREATE_SERVICE_ERROR');
         }
 
+        /* precio_desde (el "desde X CUP" de Descubre) sigue a los servicios. */
+        await ResumenLocalModel.recalcular(localId);
+
         return nuevoServicio;
     }
 
@@ -66,6 +70,8 @@
             throw crearError('No se pudo actualizar el servicio.', 400, 'UPDATE_SERVICE_ERROR');
         }
 
+        await ResumenLocalModel.recalcular(localId);
+
         return servicioActualizado;
     }
 
@@ -116,6 +122,8 @@
             throw crearError('No se pudo eliminar el servicio.', 400, 'DELETE_SERVICE_ERROR');
         }
 
+        await ResumenLocalModel.recalcular(localId);
+
         return servicioEliminado;
     }
 }
\ No newline at end of file
```

### `Jobs/Ranking.js`

```diff
--- antes/Jobs/Ranking.js
+++ despues/Jobs/Ranking.js
@@ -12,6 +12,7 @@
     try {
         await DescubreService.recalcularEstadisticas();
         await DescubreService.recalcularRepetidores();
+        await DescubreService.recalcularResumenes();
         console.log('Job de ranking ejecutado correctamente.');
     } catch (error) {
         console.error('Error al ejecutar el job de ranking:', error);
```

### `App.js`

```diff
--- antes/App.js
+++ despues/App.js
@@ -30,6 +30,10 @@
 app.use(cors({
 	origin: [
 		'http://localhost:5173',
+		/* Vite usa el siguiente puerto libre si el 5173 está ocupado, y 4173
+		   es "vite preview". Solo desarrollo. */
+		'http://localhost:5174',
+		'http://localhost:4173',
 		'http://localhost:5500',
 		'http://127.0.0.1:5500',
 	],
```

### `Models/ResumenLocalModel.js` (nuevo)

```js
import { ejecutarConsulta, query } from '../Config/db.js';
import { manejarError } from '../Utils/validaciones.js';

/* Mantiene al día los campos precalculados de `locales` que lee Descubre:

   rating_cache, opiniones_count   media y número de opiniones VISIBLES
   frase_destacada_texto/autor/foto la opinión visible con más nota y, a
                                    igualdad, la más corta (igual que
                                    fraseDeLocal() en el front)
   precio_desde                     precio mínimo de los servicios activos
                                    con precio > 0

   Se usan subconsultas escalares (no UPDATE ... FROM GROUP BY) para que un
   local que se queda sin opiniones o sin servicios vuelva a 0 / NULL en vez de
   quedarse con el valor viejo.

   La frase se busca con un LATERAL sobre `base` (otra referencia a la misma
   fila): en Postgres un LATERAL del FROM de un UPDATE no puede mirar a la
   tabla que se actualiza (`l`). */

const SET_RESUMEN = `
    rating_cache = COALESCE((
        SELECT ROUND(AVG(o.calificacion), 1)
        FROM opiniones o
        WHERE o.local_id = l.id AND o.visible = TRUE
    ), 0),
    opiniones_count = (
        SELECT COUNT(*)
        FROM opiniones o
        WHERE o.local_id = l.id AND o.visible = TRUE
    ),
    frase_destacada_texto = frase.texto,
    frase_destacada_autor = frase.autor,
    frase_destacada_foto = frase.foto,
    precio_desde = (
        SELECT MIN(s.precio)
        FROM servicios s
        WHERE s.local_id = l.id AND s.activo = TRUE AND s.precio > 0
    ),
    actualizado_en = now()
`;

const FRASE_LATERAL = `
    LEFT JOIN LATERAL (
        SELECT
            trim(o.comentario) AS texto,
            u.name AS autor,
            u.image AS foto
        FROM opiniones o
        LEFT JOIN "user" u ON u.id = o.usuario_id
        WHERE o.local_id = base.id
            AND o.visible = TRUE
            AND length(trim(o.comentario)) > 0
        ORDER BY o.calificacion DESC, length(trim(o.comentario)) ASC, o.creado_en DESC
        LIMIT 1
    ) frase ON TRUE
`;

export default class ResumenLocalModel {
    /** Recalcula un local. Llamar en la misma transacción que el cambio. */
    static async recalcular(localId, executor = query) {
        try {
            const result = await ejecutarConsulta(executor, `
                UPDATE locales AS l
                SET ${SET_RESUMEN}
                FROM locales AS base
                ${FRASE_LATERAL}
                WHERE l.id = $1 AND base.id = l.id
                RETURNING l.id, l.rating_cache, l.opiniones_count, l.precio_desde
            `, [localId]);
            return result.rows[0] ?? null;
        } catch (error) {
            manejarError('ResumenLocalModel', 'No se pudo recalcular el resumen del local', error);
        }
    }

    /** Recalcula todos (red de seguridad para el job nocturno). */
    static async recalcularTodos(executor = query) {
        try {
            const result = await ejecutarConsulta(executor, `
                UPDATE locales AS l
                SET ${SET_RESUMEN}
                FROM locales AS base
                ${FRASE_LATERAL}
                WHERE base.id = l.id
            `);
            return result.rowCount;
        } catch (error) {
            manejarError('ResumenLocalModel', 'No se pudieron recalcular los resúmenes de los locales', error);
        }
    }
}

```

### `Utils/eventosDescubre.js` (nuevo)

```js
/* Validación de los eventos de Descubre (POST /api/descubre/eventos).

   Función pura, sin base de datos, para poder probarla sola
   (Utils/eventosDescubre.test.js).

   Reglas (Doc/DESCUBRE_BACKEND_IMPLEMENTACION.md, 8.2):
   - Como mucho MAX_EVENTOS por petición: más es un error 413.
   - Cada evento se valida por separado. Uno malo NO tumba el lote: se
     descarta y se cuenta en `rechazados`. Si no, el front reenviaría el lote
     entero para siempre.
   - El cliente solo puede mandar 'vista' o 'toque'. 'reserva' la registra el
     servidor cuando se crea la cita, y 'patrocinado' lo decide el servidor
     (aquí siempre false). */

export const MAX_EVENTOS = 100;
const TIPOS_CLIENTE = new Set(['vista', 'toque']);
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const TEXTO_CORTO = /^[\w-]{1,40}$/;
const ANONIMO = /^[\w-]{8,64}$/;
const MAX_POSICION = 500;

function eventoValido(e) {
    return Boolean(
        e
        && typeof e === 'object'
        && typeof e.id === 'string' && UUID.test(e.id)
        && typeof e.localId === 'string' && e.localId.length > 0 && e.localId.length <= 120
        && typeof e.bloque === 'string' && TEXTO_CORTO.test(e.bloque)
        && Number.isInteger(e.posicion) && e.posicion >= 0 && e.posicion <= MAX_POSICION
        && TIPOS_CLIENTE.has(e.tipo)
        && (e.semilla === undefined || e.semilla === null || Number.isSafeInteger(e.semilla)),
    );
}

/** El anonimoId del navegador: null si no viene, error si viene mal. */
export function validarAnonimoId(anonimoId) {
    if (anonimoId === undefined || anonimoId === null || anonimoId === '') return { ok: true, valor: null };
    if (typeof anonimoId !== 'string' || !ANONIMO.test(anonimoId)) return { ok: false, valor: null };
    return { ok: true, valor: anonimoId };
}

/**
 * Separa los eventos válidos (ya normalizados) de los que no.
 * @returns {{ validos: object[], rechazados: number, demasiados: boolean, noEsLista: boolean }}
 */
export function filtrarEventos(eventos) {
    if (!Array.isArray(eventos)) return { validos: [], rechazados: 0, demasiados: false, noEsLista: true };
    if (eventos.length > MAX_EVENTOS) return { validos: [], rechazados: 0, demasiados: true, noEsLista: false };

    const vistos = new Set();
    const validos = [];
    for (const e of eventos) {
        if (!eventoValido(e) || vistos.has(e.id.toLowerCase())) continue;
        vistos.add(e.id.toLowerCase());
        validos.push({
            id: e.id,
            localId: e.localId,
            bloque: e.bloque,
            posicion: e.posicion,
            tipo: e.tipo,
            patrocinado: false,
            semilla: e.semilla ?? null,
        });
    }
    return { validos, rechazados: eventos.length - validos.length, demasiados: false, noEsLista: false };
}

```

### `Utils/eventosDescubre.test.js` (nuevo)

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { MAX_EVENTOS, filtrarEventos, validarAnonimoId } from './eventosDescubre.js';

const base = {
    id: '3f2b9c1e-1234-4abc-8def-0123456789ab',
    localId: 'al-medio-1',
    bloque: 'antojo-1',
    posicion: 0,
    tipo: 'vista',
};

test('acepta un evento correcto y fuerza patrocinado a false', () => {
    const r = filtrarEventos([{ ...base, patrocinado: true }]);
    assert.equal(r.validos.length, 1);
    assert.equal(r.rechazados, 0);
    assert.equal(r.validos[0].patrocinado, false);
});

test('un evento malo no tumba el lote', () => {
    const r = filtrarEventos([
        base,
        { ...base, id: 'no-es-uuid' },
        { ...base, id: '3f2b9c1e-1234-4abc-8def-0123456789ac', tipo: 'reserva' },
        { ...base, id: '3f2b9c1e-1234-4abc-8def-0123456789ad', posicion: -1 },
        { ...base, id: '3f2b9c1e-1234-4abc-8def-0123456789ae', bloque: 'con espacios' },
    ]);
    assert.equal(r.validos.length, 1);
    assert.equal(r.rechazados, 4);
});

test('quita ids repetidos dentro del mismo lote', () => {
    const r = filtrarEventos([base, { ...base }]);
    assert.equal(r.validos.length, 1);
    assert.equal(r.rechazados, 1);
});

test('rechaza lotes demasiado grandes y lo que no es lista', () => {
    assert.equal(filtrarEventos(Array(MAX_EVENTOS + 1).fill(base)).demasiados, true);
    assert.equal(filtrarEventos({}).noEsLista, true);
});

test('anonimoId: opcional, pero con formato', () => {
    assert.deepEqual(validarAnonimoId(undefined), { ok: true, valor: null });
    assert.equal(validarAnonimoId('3f2b9c1e-1234-4abc-8def-0123456789ab').ok, true);
    assert.equal(validarAnonimoId('corto').ok, false);
    assert.equal(validarAnonimoId('x'.repeat(65)).ok, false);
});

```
