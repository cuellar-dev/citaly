import { aMinutos, estaAbierto, horaAmPm, notaDeComentarios } from '../fichaLocal.js'
import { MINIMO_SENALES } from './perfil.js'
import { esNuevo } from './rerank.js'

/* Por qué te sale este local, dicho en corto y de tú (manual de marca, 12).
   Nunca nombra los modos internos ("antojo", "confianza"…). Si no hay un
   motivo claro, no se inventa: devuelve null y la tarjeta no enseña nada. */

const TE_GUSTAN = {
  Restaurante: 'Porque te gustan los restaurantes',
  Cafetería: 'Porque te gustan las cafeterías',
  Bar: 'Porque te gustan los bares',
  Terraza: 'Porque te gustan las terrazas',
  'Comida saludable': 'Porque te gusta comer sano',
  Spa: 'Porque te gustan los spas',
  Tatuajes: 'Porque te gustan los tatuajes',
  'Arte y talleres': 'Porque te gustan los talleres',
  Ocio: 'Porque te gustan los planes de ocio',
  Gimnasio: 'Porque te gusta entrenar',
  Peluquería: 'Porque te gustan las peluquerías',
  Barbería: 'Porque te gustan las barberías',
  Uñas: 'Porque te gusta hacerte las uñas',
}

/** Minutos del cierre (cierres de madrugada cuentan como del mismo día: 1:00 → 25:00). */
function minutoCierre(local) {
  if (!local?.horarioApertura || !local?.horarioCierre) return null
  const ini = aMinutos(local.horarioApertura)
  const fin = aMinutos(local.horarioCierre)
  return fin <= ini ? fin + 24 * 60 : fin
}

/** Cierra a las 22:00 o más tarde (o pasada la medianoche). */
export function cierraTarde(local) {
  const fin = minutoCierre(local)
  return fin != null && fin >= 22 * 60
}

/** "11:00 PM": hora de cierre en el formato de la casa. */
export function horaCierre(local) {
  const fin = minutoCierre(local)
  return fin == null ? null : horaAmPm(fin % (24 * 60))
}

/** Precio "desde" en número (0 si no hay): de los servicios o del resumen del backend. */
export function precioMinimo(local) {
  if (local?.precioDesde != null && !local?.servicios) return Number(local.precioDesde) || 0
  const precios = (local?.servicios ?? []).map((s) => Number(s.precio) || 0).filter((p) => p > 0)
  return precios.length ? Math.min(...precios) : 0
}

function categoriaFavorita(perfil) {
  if (!perfil || perfil.senales < MINIMO_SENALES) return null
  const [mejor] = Object.entries(perfil.afinidad).sort((a, b) => b[1] - a[1])
  return mejor && mejor[1] >= 0.4 ? mejor[0] : null
}

/** Todos los motivos que se le pueden dar, del más fuerte al más flojo. */
export function motivosDe(local, { perfil, ahora }) {
  const motivos = []
  if (esNuevo(local, ahora)) motivos.push('Nuevo en Citaly')
  if ((Number(local.repetidores) || 0) >= 3) motivos.push('Lo eligen quienes repiten')
  if (categoriaFavorita(perfil) === local.categoria && TE_GUSTAN[local.categoria]) motivos.push(TE_GUSTAN[local.categoria])
  const abierto = estaAbierto(local, ahora)
  if (ahora.getHours() >= 18 && cierraTarde(local) && abierto) motivos.push(`Abierto hasta las ${horaCierre(local)}`)
  const { nota, cantidad } = notaDeComentarios(local)
  if (cantidad >= 15 && nota >= 4.6) motivos.push(`Muy querido · ${cantidad} opiniones`)
  if (cantidad >= 5 && nota >= 4.7) motivos.push('De los mejor valorados')
  if (cantidad >= 5 && nota >= 4.4) motivos.push(`${String(nota).replace('.', ',')} de nota · ${cantidad} opiniones`)
  if (abierto) motivos.push('Abierto ahora')
  return motivos
}

/** El motivo más fuerte, o null. */
export function motivoDe(local, contexto) {
  return motivosDe(local, contexto)[0] ?? null
}
