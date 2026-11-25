import { addDays, isSameDay, startOfDay } from 'date-fns'
import { es } from 'date-fns/locale'
import { format } from 'date-fns'
import { COMODIDADES, codigoDia, estaAbierto, franjaTurno, horaAmPm, aMinutos, notaDeComentarios, precioPlanTexto } from './fichaLocal.js'

/* Lo que Descubre necesita saber de un local para contarlo como LUGAR, no como
   formulario de reserva: qué nota tiene, si puedes ir ahora, cómo es por dentro
   y qué dice la gente que ya fue. */

/**
 * Nota del local: SOLO la media real de sus comentarios, la misma que enseña
 * la ficha. El campo `points` guardado a mano ya no se usa como respaldo: antes
 * los locales sin reseñas salían con un 4.8 inventado en el listado mientras
 * su ficha decía "0 (0 opiniones)".
 */
export function notaLocal(local) {
  const { nota, cantidad } = notaDeComentarios(local)
  return { nota, cantidad, estimada: false }
}

/** Próximo día que abre, a partir de mañana si hoy ya no vale. */
function proximaApertura(local, desde) {
  const dias = local?.dias ?? []
  if (!dias.length) return null
  for (let i = 0; i <= 7; i++) {
    const fecha = addDays(desde, i)
    if (dias.includes(codigoDia(fecha))) return fecha
  }
  return null
}

/** Fecha y hora exactas de la próxima vez que abre, o null si no se sabe
    (sin horario o sin días). Si ahora está abierto, la siguiente apertura. */
export function proximaAperturaFecha(local, ahora = new Date()) {
  if (!local?.horarioApertura || !local?.horarioCierre) return null
  const minutos = aMinutos(local.horarioApertura)
  const aLaHora = (dia) => {
    const f = new Date(dia)
    f.setHours(Math.floor(minutos / 60), minutos % 60, 0, 0)
    return f
  }
  const hoy = startOfDay(ahora)
  if ((local.dias ?? []).includes(codigoDia(ahora)) && minutos > ahora.getHours() * 60 + ahora.getMinutes()) {
    return aLaHora(hoy)
  }
  const proxima = proximaApertura(local, addDays(hoy, 1))
  return proxima ? aLaHora(proxima) : null
}

/**
 * Estado de puertas, contado como contexto para ir, no como urgencia de venta:
 * "Abierto · cierra en 2 h", "Cerrado · abre mañana 9:00 AM".
 */
export function estadoApertura(local, ahora = new Date()) {
  if (!local?.horarioApertura || !local?.horarioCierre) {
    return { abierto: false, texto: 'Horario sin publicar', detalle: null }
  }

  if (estaAbierto(local, ahora)) {
    const { fin, cursor } = franjaTurno(local.horarioApertura, local.horarioCierre, ahora)
    const quedan = Math.max(0, fin - cursor)
    const horas = Math.floor(quedan / 60)
    const minutos = quedan % 60
    const cuanto = horas > 0 ? (minutos > 0 ? `${horas} h ${minutos} min` : `${horas} h`) : `${minutos} min`
    return { abierto: true, texto: 'Abierto', detalle: `cierra en ${cuanto}` }
  }

  const hoy = startOfDay(ahora)
  const abreHoyMasTarde =
    (local.dias ?? []).includes(codigoDia(ahora)) &&
    aMinutos(local.horarioApertura) > ahora.getHours() * 60 + ahora.getMinutes()

  if (abreHoyMasTarde) {
    return { abierto: false, texto: 'Cerrado', detalle: `abre a las ${horaAmPm(aMinutos(local.horarioApertura))}` }
  }

  const proxima = proximaApertura(local, addDays(hoy, 1))
  if (!proxima) return { abierto: false, texto: 'Cerrado', detalle: null }

  const manana = isSameDay(proxima, addDays(hoy, 1))
  const dia = manana ? 'mañana' : format(proxima, 'EEEE', { locale: es })
  return {
    abierto: false,
    texto: 'Cerrado',
    detalle: `abre ${dia} ${horaAmPm(aMinutos(local.horarioApertura))}`,
  }
}

/** Comodidades del local resueltas a icono + etiqueta, ya recortadas. */
export function comodidadesDe(local, maximo = 3) {
  return (local?.iconos ?? [])
    .map((i) => COMODIDADES.find((c) => c.id === (i.id ?? i)))
    .filter(Boolean)
    .slice(0, maximo)
}

/** El comentario más entusiasta y corto: el que mejor cuenta cómo es el sitio. */
export function fraseDeLocal(local) {
  /* Del backend ya llega calculada (misma regla, ResumenLocalModel). */
  if (local?.frase?.texto) return { texto: local.frase.texto, autor: local.frase.autor, foto: local.frase.foto ?? null }
  const lista = (local?.comentarios ?? []).filter((c) => c.comentario?.trim())
  if (!lista.length) return null
  const mejor = [...lista].sort((a, b) => {
    const nota = (Number(b.calificacion) || 0) - (Number(a.calificacion) || 0)
    if (nota !== 0) return nota
    return a.comentario.length - b.comentario.length
  })[0]
  return {
    texto: mejor.comentario.trim(),
    autor: mejor.nombre,
    foto: mejor.imagenPerfil ?? null,
  }
}

/** Precio más bajo publicado, para situar al local sin empujar a reservar. */
export function desdeTexto(local) {
  if (local?.suscripcion) {
    const planes = (local.planes ?? []).filter((p) => Number(p.precio) > 0)
    if (!planes.length) return null
    const barato = planes.reduce((a, b) => (Number(b.precio) < Number(a.precio) ? b : a))
    return `desde ${precioPlanTexto(barato)}`
  }
  /* Del backend ya llega el mínimo de los servicios activos. */
  if (local?.precioDesde != null && !local?.servicios) {
    return Number(local.precioDesde) > 0 ? `desde ${Number(local.precioDesde)} CUP` : null
  }
  const precios = (local?.servicios ?? []).map((s) => Number(s.precio) || 0).filter((p) => p > 0)
  if (!precios.length) return null
  return `desde ${Math.min(...precios)} CUP`
}

/* El orden de Descubre (qué local sale, dónde y por qué) vive en
   utils/ranking/: ver docs/descubre-implementacion.md. */
