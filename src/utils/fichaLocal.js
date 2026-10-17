import { Cigarette, CigaretteOff, CreditCard, ParkingCircle, Snowflake, Wifi } from 'lucide-react'

/* Semana en orden de lunes a domingo. Los códigos son los de locales.json. */
export const DIAS = [
  { id: 'l', letra: 'L', corto: 'Lun' },
  { id: 'm', letra: 'M', corto: 'Mar' },
  { id: 'x', letra: 'X', corto: 'Mié' },
  { id: 'j', letra: 'J', corto: 'Jue' },
  { id: 'v', letra: 'V', corto: 'Vie' },
  { id: 's', letra: 'S', corto: 'Sáb' },
  { id: 'd', letra: 'D', corto: 'Dom' },
]

const CODIGO_POR_GETDAY = ['d', 'l', 'm', 'x', 'j', 'v', 's']

export const COMODIDADES = [
  { id: 'wifi', label: 'Wifi', Icono: Wifi },
  { id: 'parking', label: 'Parqueo', Icono: ParkingCircle },
  { id: 'snow', label: 'Climatizado', Icono: Snowflake },
  { id: 'transfer', label: 'Transferencia', Icono: CreditCard },
  { id: 'cigarrete', label: 'Se puede fumar', Icono: Cigarette },
  { id: 'no-cigarrete', label: 'Libre de humo', Icono: CigaretteOff },
]

export const DURACIONES_TURNO = [30, 45, 60, 90, 120]

/* Lo que el dueño puede cambiar desde Mi Negocio; el resto (opiniones, nota) es de los clientes. */
export const CAMPOS_EDITABLES = [
  'localName',
  'categoria',
  'descripcion',
  'url',
  'urls',
  'horarioApertura',
  'horarioCierre',
  'horario',
  'dias',
  'intervaloMinutos',
  'telefono',
  'whatsapp',
  'direccion',
  'iconos',
  'close',
  'servicios',
  'profesionales',
]

export function codigoDia(fecha) {
  return CODIGO_POR_GETDAY[fecha.getDay()]
}

export function aMinutos(hhmm) {
  const [h, m] = String(hhmm || '0:0').split(':').map(Number)
  return h * 60 + (m || 0)
}

/* Cierre a la madrugada (18:00 → 01:00) cuenta como el mismo turno. */
export function minutosAbierto(apertura, cierre) {
  const ini = aMinutos(apertura)
  const fin = aMinutos(cierre)
  return fin > ini ? fin - ini : fin + 24 * 60 - ini
}

export function horaAmPm(minutos) {
  const n = ((minutos % 1440) + 1440) % 1440
  const h = Math.floor(n / 60)
  const m = n % 60
  return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${h >= 12 ? 'PM' : 'AM'}`
}

/* Mismo formato corto que ya usa locales.json en "horario" ("9AM - 6PM"). */
export function horarioTexto(apertura, cierre) {
  const corto = (min) => {
    const h = Math.floor(min / 60) % 24
    const m = min % 60
    return `${h % 12 || 12}${m ? `:${String(m).padStart(2, '0')}` : ''}${h >= 12 ? 'PM' : 'AM'}`
  }
  return `${corto(aMinutos(apertura))} - ${corto(aMinutos(cierre))}`
}

export function duracionTexto(min) {
  if (!min) return '—'
  if (min < 60) return `${min} min`
  const h = Math.floor(min / 60)
  const m = min % 60
  return m ? `${h} h ${m} min` : `${h} h`
}

export function turnosDelDia(apertura, cierre, intervalo) {
  const paso = Number(intervalo) || 60
  const ini = aMinutos(apertura)
  const total = minutosAbierto(apertura, cierre)
  const inicios = []
  for (let t = 0; t + paso <= total; t += paso) inicios.push(ini + t)
  return inicios
}

export function diasTexto(dias = []) {
  const indices = DIAS.map((d, i) => (dias.includes(d.id) ? i : -1)).filter((i) => i >= 0)
  if (!indices.length) return 'Ningún día'
  if (indices.length === 7) return 'Todos los días'
  const seguidos = indices.every((v, i) => i === 0 || v === indices[i - 1] + 1)
  if (seguidos && indices.length > 2) return `${DIAS[indices[0]].corto} a ${DIAS[indices.at(-1)].corto}`
  return indices.map((i) => DIAS[i].corto).join(', ')
}

export function tipoLocalTexto(lugar) {
  return lugar ? 'Reservas de mesa' : 'Citas de servicio'
}

/* Al elegir portada, `urls` pasa a guardar todas las fotos: así el orden de la galería no salta. */
export function fotosDe(local) {
  const urls = local?.urls ?? []
  const lista = urls.includes(local?.url) ? urls : [local?.url, ...urls]
  return [...new Set(lista.filter(Boolean))]
}

/* Las fotos vienen de Unsplash a 1100px: para miniaturas se piden más pequeñas. */
export function fotoAncho(url, ancho) {
  if (!/images\.unsplash\.com|plus\.unsplash\.com/.test(url)) return url
  return /[?&]w=\d+/.test(url) ? url.replace(/([?&])w=\d+/, `$1w=${ancho}`) : `${url}&w=${ancho}`
}

export function digitos(telefono) {
  return String(telefono || '').replace(/\D/g, '')
}

/* Catálogo: la duración se guarda como texto ("40 min", "2h", "1h 30 min") porque así la lee la reserva. */
export function duracionAMinutos(duracion) {
  const texto = String(duracion || '').toLowerCase()
  const horas = Number(texto.match(/(\d+)\s*h/)?.[1] ?? 0)
  const minutos = Number(texto.match(/(\d+)\s*min/)?.[1] ?? 0)
  return horas * 60 + minutos
}

export function duracionGuardada(min) {
  const h = Math.floor(min / 60)
  const m = min % 60
  if (!h) return `${m} min`
  return m ? `${h}h ${m} min` : `${h}h`
}

export function precioTexto(precio) {
  return Number(precio) > 0 ? `${precio} CUP` : 'Gratis'
}

export function nuevoId(prefijo) {
  return `${prefijo}-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`
}

export function iniciales(nombre) {
  const partes = String(nombre || '').trim().split(/\s+/).filter(Boolean)
  return (partes[0]?.[0] ?? '') + (partes.length > 1 ? partes.at(-1)[0] : '')
}

export function primerNombre(nombre) {
  return String(nombre || '').trim().split(/\s+/)[0] || '—'
}
