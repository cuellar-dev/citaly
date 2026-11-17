/* Limpieza y validación de lo que escribe el dueño al crear su local.

   Todo esto corre en el navegador y por tanto se puede saltar: es la primera
   barrera y la que da los avisos amables. El servidor, cuando exista, tiene
   que repetir las mismas reglas (y la revisión humana es la última).

   Los mensajes los dice Taly en su nube, así que van con su tono. */

const MAX = {
  nombre: 40,
  direccion: 80,
  entreCalles: 80,
  referencia: 120,
  correo: 80,
  descripcion: 400,
  servicio: 40,
  incluye: 60,
}
export { MAX }

/* Fuera: caracteres de control, de ancho cero y de cambio de dirección
   (sirven para disfrazar textos), espacios repetidos. */
const RANGOS_INVISIBLES = [
  [0x00, 0x08],
  [0x0b, 0x0c],
  [0x0e, 0x1f],
  [0x7f, 0x7f],
  [0x200b, 0x200f],
  [0x202a, 0x202e],
  [0x2060, 0x2064],
  [0xfeff, 0xfeff],
]
const hex = (n) => `\\u${n.toString(16).padStart(4, '0')}`
const INVISIBLES = new RegExp(`[${RANGOS_INVISIBLES.map(([a, b]) => `${hex(a)}-${hex(b)}`).join('')}]`, 'g')

export function limpiar(texto, max = 200, { lineas = false } = {}) {
  let t = String(texto ?? '').normalize('NFC').replace(INVISIBLES, '')
  t = lineas ? t.replace(/[ \t]+/g, ' ').replace(/\n{3,}/g, '\n\n') : t.replace(/\s+/g, ' ')
  return t.trim().slice(0, max)
}

const ENLACE = /(https?:\/\/|www\.|\b[a-z0-9-]+\.(com|net|org|cu|es|io|app|link|ly)\b)/i
const CODIGO = /[<>{}]|javascript:|data:|on\w+\s*=/i
const LETRAS = /\p{L}/u

function gritando(texto) {
  const letras = texto.replace(/[^\p{L}]/gu, '')
  return letras.length >= 6 && letras === letras.toUpperCase() && letras !== letras.toLowerCase()
}

/* Comprobaciones comunes a cualquier texto libre. Devuelve el mensaje o null. */
function textoSospechoso(texto) {
  if (CODIGO.test(texto)) return 'Esos signos < > { } no me gustan nada. Solo letras, números y poco más.'
  if (ENLACE.test(texto)) return 'Nada de enlaces aquí, que me pongo nervioso. Escríbelo con palabras.'
  return null
}

export function errorNombre(valor) {
  const v = limpiar(valor, MAX.nombre)
  if (!v) return '¿Y cómo se llama? Sin nombre no te encuentra nadie.'
  if (v.length < 2) return 'Un nombre de una letra… ¿seguro? Ponle al menos dos.'
  const sospecha = textoSospechoso(v)
  if (sospecha) return sospecha
  if (!LETRAS.test(v)) return 'Solo números no vale como nombre. Ponle alguna letra.'
  if (!/^[\p{L}\p{N}][\p{L}\p{N}\p{M} .,'’&()ºª#!¡¿?+-]*$/u.test(v)) return 'Hay algún símbolo raro en el nombre. Déjalo en letras, números y poco más.'
  if (gritando(v)) return '¡NO GRITES! En minúsculas se lee más bonito (la primera en mayúscula, eso sí).'
  return null
}

export function errorDireccion(valor) {
  const v = limpiar(valor, MAX.direccion)
  if (!v) return 'Dime la calle y el número. Si no hay número, algo que la ubique.'
  if (v.length < 6) return 'Con eso no te encuentra ni el cartero. Calle y número, mínimo.'
  return textoSospechoso(v)
}

export function errorOpcional(valor, max) {
  const v = limpiar(valor, max)
  if (!v) return null
  return textoSospechoso(v)
}

/* Teléfonos de Cuba: 8 cifras. Los móviles empiezan por 5 o 6; los fijos por
   el código de la provincia (2, 3, 4, 7). Se acepta con o sin +53. */
export function digitosTelefono(valor) {
  let d = String(valor ?? '').replace(/\D/g, '')
  if (d.length === 10 && d.startsWith('53')) d = d.slice(2)
  return d
}

export function formatoTelefono(valor) {
  const d = digitosTelefono(valor)
  if (d.length !== 8) return limpiar(valor, 20)
  return `+53 ${d.slice(0, 1)} ${d.slice(1, 4)} ${d.slice(4)}`
}

export function errorMovil(valor) {
  const d = digitosTelefono(valor)
  if (!d) return 'Necesito un móvil con WhatsApp: es por donde te escriben los clientes.'
  if (d.length !== 8) return `Ese número tiene ${d.length} cifras y en Cuba son 8. Algo como 5 123 4567.`
  if (!/^[56]/.test(d)) return 'Los móviles cubanos empiezan por 5 o 6. Ese parece un fijo: ponlo abajo.'
  return null
}

export function errorFijo(valor) {
  const d = digitosTelefono(valor)
  if (!d) return null
  if (d.length !== 8) return `Al fijo le sobran o le faltan cifras: tiene ${d.length} y van 8 con el código.`
  if (/^[56]/.test(d)) return 'Eso es un móvil. Si tiene WhatsApp, ponlo arriba.'
  return null
}

export function errorCorreo(valor) {
  const v = limpiar(valor, MAX.correo).toLowerCase()
  if (!v) return 'Pon un correo: ahí te avisamos cuando aprobemos el local.'
  if (!/^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(v)) return 'A ese correo no llega ni una paloma mensajera. Revísalo.'
  return null
}

export function errorDescripcion(valor) {
  const v = limpiar(valor, MAX.descripcion, { lineas: true })
  if (!v) return 'Cuéntales algo: qué haces, qué te hace distinto. Dos frases bastan.'
  if (v.length < 20) return 'Un poquito más, que con eso no se hacen una idea. Al menos 20 letras.'
  const sospecha = textoSospechoso(v)
  if (sospecha) return sospecha
  if (gritando(v)) return '¡NO GRITES! En minúsculas se lee mejor, de verdad.'
  return null
}

/* Precios en CUP, enteros. */
export function errorPrecio(valor, { cero = false } = {}) {
  const n = Number(valor)
  if (valor === '' || valor == null) return 'Falta el precio.'
  if (!Number.isFinite(n) || !Number.isInteger(n)) return 'El precio va en pesos enteros, sin comas ni centavos.'
  if (n < 0) return 'Un precio negativo… ¿les vas a pagar tú a ellos?'
  if (!cero && n === 0) return 'A cero no, que entonces es gratis. Pon lo que cuesta.'
  if (n > 1000000) return 'Eso es mucho dinero. Revisa que no sobre algún cero.'
  return null
}

export function errorServicioNombre(valor) {
  const v = limpiar(valor, MAX.servicio)
  if (!v) return 'Ponle nombre al servicio, como “Corte de caballero”.'
  if (v.length < 3) return 'Ese nombre es muy corto. Algo que se entienda, como “Manicura”.'
  return textoSospechoso(v)
}

/* Mismo nombre en el mismo municipio: para no duplicar ni suplantar a otro. */
export function claveNombre(nombre) {
  return limpiar(nombre)
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
}
