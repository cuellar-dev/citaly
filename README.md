# Citaly

App web de **reservas** para locales de servicios (barberos, veterinarios, restaurantes, etc.), pensada para usarse bien con **conexión inestable** (enfoque offline-first) y como proyecto de aprendizaje + portfolio.

> Stack: **React 19** · **Vite** · **React Router** · **date-fns** · **Lucide**  
> Datos actuales: mock JSON + `localStorage` (sin backend todavía).

---

## Qué hace hoy

| Área | Estado |
|------|--------|
| **Descubre** | Listado de locales (mock) |
| **Detalle del local** | Info, galería, opiniones, formulario de comentario |
| **Reservar con lugar** | Fecha, hora, mapa de mesas → guarda cita |
| **Reservar sin lugar** | Servicios, profesional, fecha/hora → guarda cita |
| **Mis citas** | UI Próximas/Pasadas + tarjetas servicio/lugar (mocks + mapa) |
| **Mi negocio / Perfil** | Placeholders |

Documentación viva de cada page (qué hay y qué falta):  
[`docs/paginas.txt`](docs/paginas.txt)

Plan por fases original:  
[`Plan por fases dado por cursor.txt`](Plan%20por%20fases%20dado%20por%20cursor.txt)

---

## Requisitos

- **Node.js** 20+ (recomendado LTS)
- **pnpm** o **npm**

---

## Cómo arrancar

```bash
# Instalar dependencias
pnpm install
# o: npm install

# Desarrollo
pnpm dev
# o: npm run dev

# Build de producción
pnpm build

# Preview del build
pnpm preview

# Lint
pnpm lint
```

La app queda en la URL que imprime Vite (normalmente `http://localhost:5173`).

---

## Estructura del proyecto

```
src/
  components/   # UI reutilizable (TarjetaLocal, CitaCard, MapaMesas, …)
  pages/        # Pantallas por ruta
  layout/       # Shell (header + outlet + NavBar)
  hooks/        # useCitas, useAppHeader, …
  services/     # locales.js, storage.js
  data/         # locales.json, mesasMapa.js
  utils/        # fechasLocal.js
  fonts/        # Quicksand, Outfit
docs/
  paginas.txt   # Inventario de pages y roadmap por pantalla
public/         # Estáticos
```

### Rutas principales

| Ruta | Página |
|------|--------|
| `/` | Descubre |
| `/local/:id` | Detalle local |
| `/local/:id/reservar` | Reserva con mesa |
| `/local/:id/reservar-cita` | Reserva con servicios |
| `/citas` | Mis citas |
| `/negocio` | Dashboard dueño (WIP) |
| `/perfil` | Perfil (WIP) |

---

## Datos y persistencia

- **Locales / servicios / opiniones mock:** `src/data/locales.json` vía `src/services/locales.js`
- **Citas del usuario:** `localStorage` vía `src/services/storage.js` y el hook `useCitas`
- **Mapa de mesas:** `src/data/mesasMapa.js` + componente `MapaMesas`

Más adelante: API REST + fallback a `localStorage` si no hay red (ver plan por fases).

---

## Scripts útiles

| Comando | Descripción |
|---------|-------------|
| `pnpm dev` | Servidor de desarrollo |
| `pnpm build` | Build a `dist/` |
| `pnpm preview` | Sirve el build |
| `pnpm lint` | ESLint |

---

## Roadmap (resumen)

1. Enganchar **Mis Citas** a `useCitas` + filtro Próximas/Pasadas  
2. Perfil básico + tema claro/oscuro  
3. Dashboard dueño (citas de hoy)  
4. Persistencia real de comentarios  
5. Búsqueda/filtros en Descubre  
6. PWA / offline real  
7. Backend Node  

Detalle por page en `docs/paginas.txt`.

---

## Contribuir / trabajar en el repo

1. Crea una rama desde `main` para cada feature o arreglo.  
2. Commits claros (qué y por qué).  
3. No subas `.env`, credenciales ni `node_modules`.  
4. Actualiza `docs/paginas.txt` cuando cierres un bloque de una pantalla.

---

## Licencia

Proyecto personal / portfolio. Ver [`LICENSE`](LICENSE) (MIT).
