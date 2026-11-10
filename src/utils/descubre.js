import { addDays, isSameDay, startOfToday } from 'date-fns'
import { es } from 'date-fns/locale'
import { format } from 'date-fns'
import { COMODIDADES, codigoDia, estaAbierto, franjaTurno, horaAmPm, aMinutos, notaDeComentarios } from './fichaLocal.js'

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

  const hoy = startOfToday()
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
  const precios = (local?.servicios ?? []).map((s) => Number(s.precio) || 0).filter((p) => p > 0)
  if (!precios.length) return null
  return `desde ${Math.min(...precios)} CUP`
}

/* Categorías que cuentan como "para comer" en las estantas de Descubre. */
const CATEGORIAS_COMER = ['Restaurante', 'Cafetería', 'Comida saludable', 'Terraza', 'Bar']

/**
 * Arma Descubre al estilo de Play Store / App Store: un feed vertical cortado
 * cada 5 tarjetas por una estanta horizontal con un gancho propio. Devuelve:
 *  - heroLista: los 5 mejores (abiertos primero) para el carrusel del héroe.
 *  - abiertos:  los abiertos ahora (sin los del héroe) para el primer rail.
 *  - bloques:   la secuencia intercalada de listas y estantas.
 *
 * Las estantas se repiten (Para comer / Más para comer, Mejor valorados /
 * También muy valorados) pero cada repetición cae en locales distintos, porque
 * el dedupe es POR tipo de estanta. Entre estantas de tipos distintos sí puede
 * haber solape (un restaurante es "para comer" y "para sentarte"), igual que en
 * esas apps: no se nota monótono porque el título y la mezcla cambian.
 */
export function construirDescubre(locales = [], favoritos = []) {
  const meta = new Map(
    locales.map((l) => [
      l.id,
      { nota: notaLocal(l).nota, abierto: estaAbierto(l), metros: Number(l.metros) || 0 },
    ]),
  )
  const notaDe = (l) => meta.get(l.id)?.nota ?? 0
  const abiertoDe = (l) => meta.get(l.id)?.abierto ?? false
  const metrosDe = (l) => meta.get(l.id)?.metros ?? 0

  const porNota = [...locales].sort((a, b) => notaDe(b) - notaDe(a))

  // Héroe: 5 mejores, abiertos primero para que el carrusel abra con lo que se
  // puede visitar ya.
  const abiertosPorNota = porNota.filter(abiertoDe)
  const cerradosPorNota = porNota.filter((l) => !abiertoDe(l))
  const heroLista = [...abiertosPorNota, ...cerradosPorNota].slice(0, 5)
  const heroIds = new Set(heroLista.map((l) => l.id))

  // Primer rail: abiertos ahora, sin los del héroe para no repetir de golpe.
  const abiertos = abiertosPorNota.filter((l) => !heroIds.has(l.id))

  // Dedupe por tipo de estanta: dos "Para comer" no coinciden, pero "Para comer"
  // y "Para sentarte" sí pueden compartir algún local.
  const usadosPorClave = new Map()
  const tomar = (pool, clave, max = 8) => {
    let set = usadosPorClave.get(clave)
    if (!set) {
      set = new Set()
      usadosPorClave.set(clave, set)
    }
    const out = []
    for (const l of pool) {
      if (set.has(l.id)) continue
      set.add(l.id)
      out.push(l)
      if (out.length >= max) break
    }
    return out
  }

  const comerPorNota = porNota.filter((l) => CATEGORIAS_COMER.includes(l.categoria))
  const mesaPorNota = porNota.filter((l) => l.lugar === true)

  // Cola de estantas en el orden que pidió Luis. Cada una se construye en el
  // momento (función) para que el dedupe vea lo ya tomado por las anteriores.
  const peticiones = [
    () => ({ clave: 'comer', titulo: 'Para comer', nota: 'Si te entró el antojo', items: tomar(comerPorNota, 'comer') }),
    () => ({ clave: 'mesa', titulo: 'Para sentarte a la mesa', nota: 'Con reserva de sitio', items: tomar(mesaPorNota, 'mesa') }),
  ]

  const fav = favoritos.map((id) => locales.find((l) => l.id === id)).find(Boolean)
  if (fav) {
    const similares = porNota.filter((l) => l.categoria === fav.categoria && l.id !== fav.id)
    peticiones.push(() => ({
      clave: 'guardaste',
      titulo: `Porque guardaste ${fav.localName}`,
      nota: 'Del mismo estilo',
      items: tomar(similares, 'guardaste'),
    }))
  }

  peticiones.push(
    () => ({ clave: 'mejor', titulo: 'Mejor valorados', nota: 'Los que más gustan', items: tomar(porNota, 'mejor') }),
    () => ({ clave: 'comer', titulo: 'Más para comer', nota: 'Otras cocinas', items: tomar(comerPorNota, 'comer') }),
    () => ({ clave: 'mesa', titulo: 'Otras mesas para reservar', nota: 'Más sitios con reserva', items: tomar(mesaPorNota, 'mesa') }),
    () => ({ clave: 'mejor', titulo: 'También muy valorados', nota: 'Siguen en lo alto', items: tomar(porNota, 'mejor') }),
  )

  // Lista vertical: todo menos el héroe, del más cercano al más lejos.
  const vertical = locales
    .filter((l) => !heroIds.has(l.id))
    .sort((a, b) => metrosDe(a) - metrosDe(b))

  // Intercalar: trozo de 5 tarjetas, luego una estanta, y así.
  const bloques = []
  let i = 0
  let primera = true
  for (const pedir of peticiones) {
    if (i < vertical.length) {
      bloques.push({
        tipo: 'lista',
        clave: `lista-${i}`,
        titulo: primera ? 'Cerca de ti' : null,
        subtitulo: primera ? 'Del más cercano al más lejos' : null,
        items: vertical.slice(i, i + 5),
      })
      i += 5
      primera = false
    }
    const estanta = pedir()
    // Una estanta con menos de 3 no merece una fila horizontal.
    if (estanta.items.length >= 3) {
      bloques.push({ tipo: 'rail', ...estanta, clave: `${estanta.clave}-${bloques.length}` })
    }
  }
  // Lo que quede de la lista, en trozos de 5.
  while (i < vertical.length) {
    bloques.push({
      tipo: 'lista',
      clave: `lista-${i}`,
      titulo: null,
      subtitulo: null,
      items: vertical.slice(i, i + 5),
    })
    i += 5
  }

  return { heroLista, abiertos, bloques }
}
