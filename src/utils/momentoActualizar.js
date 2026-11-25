/* ¿Es buen momento para aplicar una versión nueva en silencio?

   La actualización recarga la página, así que solo se hace cuando no hay nada
   a medias: ni en pantallas con formularios o pasos (alta de local, reservas,
   sesión, perfil…), ni con un campo enfocado, ni con un diálogo abierto. Lo
   usa AvisosApp. */

/* Rutas (sin el prefijo de GitHub Pages) donde alguien puede estar escribiendo
   o a mitad de un paso. */
const RUTAS_DELICADAS = [
  /^\/auth(\/|$)/,
  /^\/negocio(\/|$)/,
  /^\/local\/[^/]+\/(reservar|reservar-cita|unirse)(\/|$)/,
  /^\/perfil(\/|$)/,
  /^\/opinion(\/|$)/,
  /^\/ayuda(\/|$)/,
]

export function rutaDelicada(pathname) {
  return RUTAS_DELICADAS.some((patron) => patron.test(pathname))
}

/* Campo enfocado (se está escribiendo) o diálogo/menú modal abierto. */
export function hayAlgoAbierto(doc) {
  const activo = doc.activeElement
  if (activo) {
    const etiqueta = activo.tagName
    if (etiqueta === 'INPUT' || etiqueta === 'TEXTAREA' || etiqueta === 'SELECT' || activo.isContentEditable) return true
  }
  return Boolean(doc.querySelector('[role="dialog"], [aria-modal="true"], dialog[open]'))
}

export function puedeActualizarAhora(pathname, doc) {
  return !rutaDelicada(pathname) && !hayAlgoAbierto(doc)
}

/* Tope para no recargar en bucle si algo falla: una actualización silenciosa
   como mucho cada 5 minutos por sesión. */
const CLAVE_ULTIMA = 'citaly_ultima_actualizacion'
const ENTRE_ACTUALIZACIONES_MS = 5 * 60 * 1000

export function actualizacionPermitida(ahora = Date.now()) {
  try {
    const ultima = Number(sessionStorage.getItem(CLAVE_ULTIMA) || 0)
    return ahora - ultima > ENTRE_ACTUALIZACIONES_MS
  } catch {
    return true
  }
}

export function anotarActualizacion(ahora = Date.now()) {
  try {
    sessionStorage.setItem(CLAVE_ULTIMA, String(ahora))
  } catch {
    /* sin sessionStorage no se anota; el aviso solo se usa una vez por carga */
  }
}
