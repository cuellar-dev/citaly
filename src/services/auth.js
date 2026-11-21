import { hayApi, urlApi } from './api.js'
import { cambiarSesion, cargarSesion, usuarioDemo } from './sesion.js'

/* Capa de cuentas. Con VITE_API_URL habla con Better Auth en el backend
   (backend-citaly-main/Config/auth.js); sin ella simula la demo con Laura.

   La sesión NO se guarda aquí ni en localStorage: el backend pone una cookie
   httpOnly que JavaScript no puede leer (ni un script malicioso robar) y el
   navegador la manda sola. Dura 30 días y se renueva sola al usar la app. */

export const MIN_CLAVE = 8
export const MAX_CLAVE = 128

/* Mensajes en español para los códigos de Better Auth. */
const MENSAJES = {
  INVALID_EMAIL_OR_PASSWORD: 'Ese correo y esa contraseña no coinciden.',
  INVALID_EMAIL: 'Pon un correo válido.',
  INVALID_PASSWORD: 'La contraseña no es correcta.',
  USER_ALREADY_EXISTS: 'Ya hay una cuenta con ese correo. Inicia sesión o recupera tu contraseña.',
  USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL: 'Ya hay una cuenta con ese correo. Inicia sesión o recupera tu contraseña.',
  PASSWORD_TOO_SHORT: `La contraseña debe tener al menos ${MIN_CLAVE} caracteres.`,
  PASSWORD_TOO_LONG: `La contraseña no puede pasar de ${MAX_CLAVE} caracteres.`,
  EMAIL_NOT_VERIFIED: 'Antes de entrar, confirma tu correo. Te mandamos un enlace.',
  INVALID_TOKEN: 'El enlace ya no vale o ya se usó. Pide uno nuevo.',
  TOKEN_EXPIRED: 'El enlace caducó. Pide uno nuevo.',
  SESSION_EXPIRED: 'Por seguridad, vuelve a iniciar sesión y prueba otra vez.',
  SESSION_NOT_FRESH: 'Por seguridad, vuelve a iniciar sesión y prueba otra vez.',
  PROVIDER_NOT_FOUND: 'Entrar con Google todavía no está disponible.',
  OWNS_LOCAL: null, // el mensaje del backend ya viene en español
  INVALID_IMAGE: null,
  INVALID_NAME: null,
  TOO_MANY_REQUESTS: 'Demasiados intentos. Espera unos minutos y vuelve a probar.',
  INVALID_REDIRECT_URL: 'No pudimos preparar el enlace. Recarga la página y prueba otra vez.',
  FAILED_TO_CREATE_USER: 'No pudimos crear la cuenta. Prueba otra vez en un momento.',
  CREDENTIAL_ACCOUNT_NOT_FOUND: 'Esta cuenta entra con Google, no tiene contraseña.',
}

function errorDe(status, json) {
  const code = json?.code ?? json?.error?.code ?? (status === 429 ? 'TOO_MANY_REQUESTS' : 'HTTP_ERROR')
  const traducido = MENSAJES[code]
  const message =
    traducido ??
    (traducido === null ? json?.message : null) ??
    json?.error?.message ??
    'No se pudo completar. Inténtalo de nuevo.'
  return Object.assign(new Error(message), { code, status })
}

/** POST/GET a /api/auth/*. Better Auth responde JSON plano (sin { data }). */
async function pedirAuth(ruta, { metodo = 'POST', cuerpo } = {}) {
  let respuesta
  try {
    respuesta = await fetch(urlApi(`/api/auth${ruta}`), {
      method: metodo,
      credentials: 'include',
      headers: cuerpo === undefined ? { Accept: 'application/json' } : { Accept: 'application/json', 'Content-Type': 'application/json' },
      body: cuerpo === undefined ? undefined : JSON.stringify(cuerpo),
      signal: AbortSignal.timeout?.(15000),
    })
  } catch {
    throw Object.assign(new Error('No hay conexión con Citaly. Revisa tu internet y prueba otra vez.'), { code: 'SIN_CONEXION' })
  }
  const json = await respuesta.json().catch(() => null)
  if (!respuesta.ok) throw errorDe(respuesta.status, json)
  return json
}

/* Dirección absoluta de una pantalla de la web (respeta la ruta base de
   GitHub Pages). Es a donde vuelven los enlaces de los correos y Google. */
export function urlApp(ruta = '') {
  const base = import.meta.env.BASE_URL.replace(/\/$/, '')
  return `${window.location.origin}${base}/${ruta.replace(/^\//, '')}`
}

/* Solo rutas internas: un ?volver=https://otro.sitio no puede sacar al
   usuario de Citaly después de entrar. */
export function rutaSegura(ruta, porDefecto = '/perfil') {
  return typeof ruta === 'string' && /^\/(?!\/)/.test(ruta) && !ruta.includes('\\') ? ruta : porDefecto
}

function esperar(ms = 450) {
  return new Promise((r) => setTimeout(r, ms))
}

/* ---------- Validación (la misma en demo y con backend) ---------- */

function limpiarCorreo(correo) {
  const limpio = String(correo || '').trim().toLowerCase()
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(limpio)) throw Object.assign(new Error('Pon un correo válido.'), { code: 'INVALID_EMAIL' })
  return limpio
}

export function problemaClave(contrasena, correo = '') {
  const clave = String(contrasena || '')
  if (clave.length < MIN_CLAVE) return `La contraseña debe tener al menos ${MIN_CLAVE} caracteres.`
  if (clave.length > MAX_CLAVE) return `La contraseña no puede pasar de ${MAX_CLAVE} caracteres.`
  if (correo && clave.toLowerCase() === String(correo).trim().toLowerCase()) return 'La contraseña no puede ser tu correo.'
  if (/^(.)\1+$/.test(clave) || /^(12345678|password|contraseña|qwertyui)/i.test(clave)) return 'Esa contraseña es muy fácil de adivinar.'
  return null
}

function comprobarClave(contrasena, correo) {
  const problema = problemaClave(contrasena, correo)
  if (problema) throw Object.assign(new Error(problema), { code: 'WEAK_PASSWORD' })
}

/* ---------- Entrar y registrarse ---------- */

/** @param {{ correo: string, contrasena: string }} datos */
export async function iniciarSesion(datos) {
  const correo = limpiarCorreo(datos.correo)
  const contrasena = String(datos.contrasena || '')
  if (!contrasena) throw new Error('Pon tu contraseña.')

  if (!hayApi) {
    await esperar()
    cambiarSesion(usuarioDemo())
    return { ok: true }
  }
  await pedirAuth('/sign-in/email', {
    cuerpo: { email: correo, password: contrasena, rememberMe: true, callbackURL: urlApp('perfil') },
  })
  await cargarSesion({ forzar: true })
  return { ok: true }
}

/** @param {{ nombre: string, correo: string, contrasena: string }} datos */
export async function registrarse(datos) {
  const nombre = String(datos.nombre || '').trim()
  const correo = limpiarCorreo(datos.correo)
  if (nombre.length < 2) throw new Error('Pon tu nombre.')
  if (nombre.length > 60) throw new Error('El nombre es demasiado largo.')
  comprobarClave(datos.contrasena, correo)

  if (!hayApi) {
    await esperar()
    cambiarSesion(usuarioDemo())
    return { ok: true, sesion: true }
  }
  const respuesta = await pedirAuth('/sign-up/email', {
    cuerpo: {
      name: nombre,
      email: correo,
      password: datos.contrasena,
      /* A dónde vuelve el enlace del correo de verificación. */
      callbackURL: urlApp('auth?modo=verificado'),
    },
  })
  /* Si el backend exige el correo verificado, no hay sesión todavía. */
  const sesion = Boolean(respuesta?.token)
  if (sesion) await cargarSesion({ forzar: true })
  return { ok: true, sesion }
}

/** Lleva a Google. Al volver, el backend ya dejó la cookie de sesión. */
export async function entrarConGoogle({ volver = '/perfil' } = {}) {
  if (!hayApi) {
    await esperar()
    cambiarSesion(usuarioDemo())
    return { ok: true, demo: true }
  }
  const destino = rutaSegura(volver)
  const respuesta = await pedirAuth('/sign-in/social', {
    cuerpo: {
      provider: 'google',
      callbackURL: urlApp(destino),
      newUserCallbackURL: urlApp(`${destino.replace(/^\//, '')}${destino.includes('?') ? '&' : '?'}bienvenida=1`),
      errorCallbackURL: urlApp('auth'),
    },
  })
  if (!respuesta?.url) throw new Error('No pudimos abrir Google. Prueba otra vez.')
  window.location.assign(respuesta.url)
  return { ok: true }
}

/* ---------- Contraseña olvidada ---------- */

/** Manda el correo. Siempre «sale bien»: no decimos si el correo existe. */
export async function pedirRecuperacion(correoEscrito) {
  const correo = limpiarCorreo(correoEscrito)
  if (!hayApi) {
    await esperar()
    return { ok: true }
  }
  await pedirAuth('/request-password-reset', {
    cuerpo: { email: correo, redirectTo: urlApp('auth?modo=restablecer') },
  })
  return { ok: true }
}

export async function restablecerContrasena({ token, contrasena }) {
  if (!token) throw Object.assign(new Error(MENSAJES.INVALID_TOKEN), { code: 'INVALID_TOKEN' })
  comprobarClave(contrasena)
  if (!hayApi) {
    await esperar()
    return { ok: true }
  }
  await pedirAuth('/reset-password', { cuerpo: { token, newPassword: contrasena } })
  return { ok: true }
}

export async function reenviarVerificacion(correo) {
  if (!hayApi) {
    await esperar()
    return { ok: true }
  }
  await pedirAuth('/send-verification-email', {
    cuerpo: { email: limpiarCorreo(correo), callbackURL: urlApp('auth?modo=verificado') },
  })
  return { ok: true }
}

export async function cambiarContrasena({ actual, nueva }) {
  comprobarClave(nueva)
  if (!hayApi) {
    await esperar()
    return { ok: true }
  }
  /* Cierra las demás sesiones: si alguien más la sabía, se queda fuera. */
  await pedirAuth('/change-password', { cuerpo: { currentPassword: actual, newPassword: nueva, revokeOtherSessions: true } })
  return { ok: true }
}

/* ---------- Salir y borrar ---------- */

export async function cerrarSesion() {
  if (hayApi) {
    try {
      await pedirAuth('/sign-out', { cuerpo: {} })
    } catch {
      /* Sin red: igual se olvida aquí. La cookie caduca sola. */
    }
  }
  cambiarSesion(null)
}

/** Cierra la sesión en todos los dispositivos, este incluido. */
export async function cerrarEnTodos() {
  if (hayApi) await pedirAuth('/revoke-sessions', { cuerpo: {} })
  cambiarSesion(null)
}

/** ¿La cuenta tiene contraseña? (si entra solo con Google, no). */
export async function tieneContrasena() {
  if (!hayApi) return true
  const cuentas = await pedirAuth('/list-accounts', { metodo: 'GET' })
  return (Array.isArray(cuentas) ? cuentas : []).some((c) => (c.providerId ?? c.provider) === 'credential')
}

/** Borra la cuenta. Con contraseña si la tiene; si no, vale una sesión reciente. */
export async function eliminarCuenta({ contrasena } = {}) {
  if (!hayApi) {
    await esperar()
    cambiarSesion(null)
    return { ok: true }
  }
  await pedirAuth('/delete-user', { cuerpo: contrasena ? { password: contrasena } : {} })
  cambiarSesion(null)
  return { ok: true }
}

/* ---------- Perfil ---------- */

/** Nombre (Better Auth) y teléfono (perfil de Citaly). */
export async function actualizarCuenta({ nombre, telefono }) {
  if (!hayApi) return { ok: true }
  if (nombre !== undefined) await pedirAuth('/update-user', { cuerpo: { name: nombre } })
  if (telefono !== undefined) {
    const r = await fetch(urlApi('/api/usuarios/me'), {
      method: 'PATCH',
      credentials: 'include',
      headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
      body: JSON.stringify({ telefono: telefono || null }),
    })
    if (!r.ok) throw errorDe(r.status, await r.json().catch(() => null))
  }
  await cargarSesion({ forzar: true })
  return { ok: true }
}

/** Traduce el ?error= con el que vuelve Google a un mensaje. */
export function mensajeErrorGoogle(codigo) {
  if (!codigo) return ''
  if (codigo === 'account_not_linked') {
    return 'Ya hay una cuenta con ese correo. Entra con tu contraseña y confirma tu correo para poder usar Google después.'
  }
  if (codigo === 'access_denied') return 'Cancelaste la entrada con Google.'
  return 'No pudimos entrar con Google. Prueba otra vez.'
}

/* ---------- Correo, dispositivos y foto ---------- */

/**
 * Pide cambiar el correo. Si el actual está confirmado, primero llega un
 * enlace al correo VIEJO para aprobarlo; luego otro al NUEVO.
 */
export async function cambiarCorreo(nuevo) {
  const correo = limpiarCorreo(nuevo)
  if (!hayApi) {
    await esperar()
    return { ok: true }
  }
  await pedirAuth('/change-email', { cuerpo: { newEmail: correo, callbackURL: urlApp('auth?modo=correo') } })
  return { ok: true }
}

/** Dispositivos con la sesión abierta, el actual primero. */
export async function listarSesiones() {
  if (!hayApi) {
    await esperar(200)
    return [{ id: 'demo', actual: true, dispositivo: 'Este navegador', desde: new Date().toISOString(), token: null }]
  }
  const [lista, actual] = await Promise.all([
    pedirAuth('/list-sessions', { metodo: 'GET' }),
    pedirAuth('/get-session', { metodo: 'GET' }),
  ])
  const idActual = actual?.session?.id
  return (Array.isArray(lista) ? lista : [])
    .map((s) => ({
      id: s.id,
      actual: s.id === idActual,
      dispositivo: describirDispositivo(s.userAgent),
      desde: s.updatedAt ?? s.createdAt,
      token: s.token,
    }))
    .sort((a, b) => Number(b.actual) - Number(a.actual) || String(b.desde).localeCompare(String(a.desde)))
}

export async function cerrarSesionDe(token) {
  if (!hayApi || !token) return { ok: true }
  await pedirAuth('/revoke-session', { cuerpo: { token } })
  return { ok: true }
}

function describirDispositivo(ua = '') {
  const texto = String(ua)
  const sistema = /iPhone|iPad/.test(texto)
    ? 'iPhone'
    : /Android/.test(texto)
      ? 'Android'
      : /Windows/.test(texto)
        ? 'Windows'
        : /Mac OS X/.test(texto)
          ? 'Mac'
          : /Linux/.test(texto)
            ? 'Linux'
            : 'Dispositivo'
  const navegador = /Edg\//.test(texto)
    ? 'Edge'
    : /Chrome\//.test(texto)
      ? 'Chrome'
      : /Firefox\//.test(texto)
        ? 'Firefox'
        : /Safari\//.test(texto)
          ? 'Safari'
          : ''
  return navegador ? `${navegador} en ${sistema}` : sistema
}

async function pedirCitaly(ruta, { metodo = 'POST', cuerpo } = {}) {
  const r = await fetch(urlApi(ruta), {
    method: metodo,
    credentials: 'include',
    headers: cuerpo === undefined ? { Accept: 'application/json' } : { Accept: 'application/json', 'Content-Type': 'application/json' },
    body: cuerpo === undefined ? undefined : JSON.stringify(cuerpo),
  })
  const json = await r.json().catch(() => null)
  if (!r.ok) throw errorDe(r.status, json)
  return json?.data
}

/**
 * Sube la foto de perfil (un data: URL ya recortado) a Cloudinary con la
 * firma del backend y la deja puesta. Devuelve la URL final.
 */
export async function subirFotoPerfil(dataUrl) {
  if (!hayApi) return dataUrl
  const firma = await pedirCitaly('/api/usuarios/me/foto/firma')
  const archivo = await (await fetch(dataUrl)).blob()
  const form = new FormData()
  form.append('file', archivo)
  form.append('api_key', firma.apiKey)
  form.append('timestamp', String(firma.timestamp))
  form.append('signature', firma.signature)
  form.append('public_id', firma.publicId)
  form.append('asset_folder', firma.assetFolder)
  form.append('allowed_formats', firma.allowedFormats)
  const subida = await fetch(`https://api.cloudinary.com/v1_1/${encodeURIComponent(firma.cloudName)}/image/upload`, {
    method: 'POST',
    body: form,
  })
  if (!subida.ok) throw new Error('No pudimos subir la foto. Prueba con otra o más tarde.')
  const { foto } = await pedirCitaly('/api/usuarios/me/foto', { metodo: 'PUT', cuerpo: { publicId: firma.publicId } })
  await cargarSesion({ forzar: true })
  return foto
}

export async function quitarFotoPerfil() {
  if (!hayApi) return null
  await pedirCitaly('/api/usuarios/me/foto', { metodo: 'DELETE' })
  await cargarSesion({ forzar: true })
  return null
}
