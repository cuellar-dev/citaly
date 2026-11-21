import { hayApi, urlApi } from './api.js'
import { getUsuarioById } from './usuarios.js'

/* Cuenta con la que se usa la app mientras no hay login de verdad
   (la misma que enseña Mi Perfil). Las pantallas de la demo (Mi negocio,
   socios, opiniones) siguen apuntando a ella. */
export const USUARIO_ACTUAL_ID = 'u-laura-mendez'

/* ---------- Sesión de la persona que usa la app ----------

   estado:  'cargando' | 'listo'
   usuario: null (sin cuenta) o { id, nombre, correo, foto, verificado, telefono }

   Con backend se pregunta a GET /api/auth/get-session (la cookie viaja sola).
   En la demo, Laura está dentro salvo que haya pulsado «Cerrar sesión»: eso
   se recuerda en este navegador para que el ensayo se vea completo. */

const DEMO_FUERA_KEY = 'citaly_demo_fuera'

let estado = { estado: hayApi ? 'cargando' : 'listo', usuario: null }
const oyentes = new Set()
let enVuelo = null

function emitir(nuevo) {
  estado = nuevo
  oyentes.forEach((fn) => fn())
}

export function usuarioDemo() {
  const u = getUsuarioById(USUARIO_ACTUAL_ID)
  if (!u) return null
  return { id: u.id, nombre: u.nombre, correo: u.correo, foto: u.foto ?? null, verificado: true, telefono: u.telefono ?? '' }
}

function leerDemo() {
  try {
    if (localStorage.getItem(DEMO_FUERA_KEY) === '1') return null
  } catch {
    /* sin storage: dentro */
  }
  return usuarioDemo()
}

if (!hayApi) estado = { estado: 'listo', usuario: leerDemo() }

function desdeBackend(datos) {
  const u = datos?.user
  if (!u?.id) return null
  return {
    id: u.id,
    nombre: u.name ?? '',
    correo: u.email ?? '',
    foto: u.image ?? null,
    verificado: Boolean(u.emailVerified),
    telefono: '',
  }
}

/** Pregunta al backend quién es. Se reutiliza la petición si ya va de camino. */
export function cargarSesion({ forzar = false } = {}) {
  if (!hayApi) {
    emitir({ estado: 'listo', usuario: leerDemo() })
    return Promise.resolve(estado.usuario)
  }
  if (enVuelo && !forzar) return enVuelo
  enVuelo = (async () => {
    try {
      const r = await fetch(urlApi('/api/auth/get-session'), {
        credentials: 'include',
        headers: { Accept: 'application/json' },
      })
      const datos = r.ok ? await r.json().catch(() => null) : null
      let usuario = desdeBackend(datos)
      if (usuario) {
        /* El teléfono vive en el perfil de Citaly, no en Better Auth. */
        const perfil = await fetch(urlApi('/api/usuarios/me'), { credentials: 'include', headers: { Accept: 'application/json' } })
          .then((p) => (p.ok ? p.json() : null))
          .catch(() => null)
        usuario = { ...usuario, telefono: perfil?.data?.telefono ?? '' }
      }
      emitir({ estado: 'listo', usuario })
    } catch {
      /* Sin conexión: se trata como sin sesión, pero se puede reintentar. */
      emitir({ estado: 'listo', usuario: null, sinConexion: true })
    } finally {
      enVuelo = null
    }
    return estado.usuario
  })()
  return enVuelo
}

/** Lo usa auth.js tras entrar, salir o borrar la cuenta. */
export function cambiarSesion(usuario) {
  if (!hayApi) {
    try {
      if (usuario) localStorage.removeItem(DEMO_FUERA_KEY)
      else localStorage.setItem(DEMO_FUERA_KEY, '1')
    } catch {
      /* sin storage */
    }
  }
  emitir({ estado: 'listo', usuario })
}

export function suscribirSesion(fn) {
  oyentes.add(fn)
  if (hayApi && estado.estado === 'cargando' && !enVuelo) cargarSesion()
  return () => oyentes.delete(fn)
}

export function leerSesion() {
  return estado
}
