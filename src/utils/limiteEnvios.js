/* Freno contra el spam de los formularios de contacto: como mucho LIMITE
   envíos cada VENTANA, contados aparte para cada formulario (clave).

   Aquí solo frena al que escribe de buena fe con el dedo nervioso; cuando
   haya servidor, el límite de verdad va allí (por IP y por cuenta), porque
   el localStorage se borra en un segundo. */

export const LIMITE = 3
export const VENTANA = 5 * 60 * 1000

export function enviosRecientes(clave, ahora = Date.now()) {
  try {
    const lista = JSON.parse(localStorage.getItem(clave)) || []
    return lista.filter((t) => ahora - t < VENTANA)
  } catch {
    return []
  }
}

export function anotarEnvio(clave) {
  try {
    localStorage.setItem(clave, JSON.stringify([...enviosRecientes(clave), Date.now()]))
  } catch {
    /* Sin almacenamiento no hay freno, pero tampoco hay envío real. */
  }
}

/** Milisegundos hasta que se libere un hueco, o 0 si ya puede escribir. */
export function esperaRestante(clave, ahora = Date.now()) {
  const recientes = enviosRecientes(clave, ahora)
  if (recientes.length < LIMITE) return 0
  return Math.max(0, Math.min(...recientes) + VENTANA - ahora)
}

/** "45 s", "3 min", "3 min 05 s". */
export function textoEspera(ms) {
  const s = Math.ceil(ms / 1000)
  if (s < 60) return `${s} s`
  const m = Math.floor(s / 60)
  const r = s % 60
  return r ? `${m} min ${String(r).padStart(2, '0')} s` : `${m} min`
}

/** Lo último guardado en una lista de mensajes, para no mandar lo mismo dos veces. */
export function ultimoTexto(claveLista) {
  try {
    return (JSON.parse(localStorage.getItem(claveLista)) || [])[0]?.texto ?? null
  } catch {
    return null
  }
}

export function guardarMensaje(claveLista, mensaje) {
  try {
    const lista = JSON.parse(localStorage.getItem(claveLista)) || []
    localStorage.setItem(claveLista, JSON.stringify([mensaje, ...lista]))
  } catch {
    /* Sin almacenamiento: el envío es de mentira igualmente. */
  }
}
