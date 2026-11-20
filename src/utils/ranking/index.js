import { estaAbierto } from '../fichaLocal.js'
import { estadisticasGlobales } from './calidad.js'
import { CONFIG_MODO, FUERA_DEL_FEED, MODO_DE_CATEGORIA } from './modos.js'
import { puntuar } from './puntuar.js'
import { ABIERTOS, HEROE, plantillaPara } from './reparto.js'
import { diversificar, esNuevo, llenarConExploracion, meterNuevos, unoPorCategoria } from './rerank.js'

/* El director de Descubre (docs/descubre-implementacion.md, sección 3):

   ① candidatos → ② perfil (llega hecho) → ③ reparto → ④ puntuar → ⑤ re-ranking

   Función pura: no lee la hora, ni localStorage, ni usa Math.random. Con los
   mismos datos da SIEMPRE el mismo resultado; por eso se puede probar y, el
   día que el ranking pase al servidor, reutilizar tal cual en Node.

   Devuelve lo que pinta Descubre:
     heroLista   los 5 del carrusel
     abiertos    "Puedes ir ahora mismo" (vista; puede repetir locales)
     bloques     [{ tipo: 'lista' | 'rail', clave, titulo, nota, subtitulo, items }]
     explicacion Map localId → por qué está donde está (modo depuración) */

const MINIMO_BLOQUE = 3
/* En los bloques que mezclan todos los modos (mejor valorados, descubrir),
   como mucho 2 locales de la misma categoría. */
const MAX_POR_CATEGORIA_MEZCLA = 2

/* Los modos que quieren variedad (antojo, capricho) tampoco dejan que una
   categoría ocupe más de un tercio del bloque: 6 huecos → 2 cafeterías. */
function topePorCategoria(bloque, modo) {
  if (!bloque.modos) return MAX_POR_CATEGORIA_MEZCLA
  if (bloque.soloCategoria || !CONFIG_MODO[modo]?.quiereVariedad) return Infinity
  return Math.max(2, Math.ceil(bloque.huecos / 3))
}

const modoDelBloque = (bloque) =>
  bloque.pesos ??
  (bloque.modos?.length === 1
    ? bloque.modos[0]
    : bloque.soloCategoria
      ? (MODO_DE_CATEGORIA[bloque.soloCategoria] ?? 'general')
      : 'general')

const ordenar = (lista) => [...lista].sort((a, b) => b.score - a.score)

export function construirDescubre({
  locales = [],
  perfil,
  ahora = new Date(),
  semilla = 0,
  exposicion = new Map(),
  favoritos = [],
}) {
  /* ① Candidatos: fuera lo que no va en el feed y las categorías de confianza
     que el usuario ya tiene resueltas (ya tiene "su" barbería). */
  const resueltas = perfil?.categoriasResueltas ?? new Map()
  const candidatos = locales.filter(
    (l) => !l.oculto && !FUERA_DEL_FEED.has(l.categoria) && !resueltas.has(l.categoria),
  )

  const stats = estadisticasGlobales(locales)
  const contexto = { stats, perfil, exposicion, ahora, semilla }
  const usados = new Set()
  const explicacion = new Map()

  const anotar = (bloqueId, lista) =>
    lista.forEach((c, posicion) => {
      if (!explicacion.has(c.local.id) || bloqueId !== 'abiertos') {
        explicacion.set(c.local.id, {
          bloque: bloqueId,
          posicion,
          score: c.score,
          desglose: c.desglose,
          exploracion: Boolean(c.exploracion),
          nuevo: Boolean(c.nuevo),
          cuota: Boolean(c.cuota),
        })
      }
    })

  /* Héroe: lo mejor de todo, mezclado, sin exploración y una categoría por
     diapositiva. No va primero lo abierto: eso es para su propia fila. */
  const heroe = unoPorCategoria(
    ordenar(candidatos.map((l) => puntuar(l, { modo: 'general', riesgo: HEROE.riesgo, contexto }))),
    HEROE.huecos,
  )
  heroe.forEach((c) => usados.add(c.local.id))
  anotar('heroe', heroe)

  /* Abiertos ahora: vista aparte, ordenada por calidad, sin los del héroe. */
  const abiertos = ordenar(
    candidatos
      .filter((l) => !usados.has(l.id) && estaAbierto(l, ahora))
      .map((l) => puntuar(l, { modo: 'general', riesgo: ABIERTOS.riesgo, contexto })),
  ).slice(0, ABIERTOS.huecos)

  /* ③ Reparto. */
  const favorito = favoritos.map((id) => locales.find((l) => l.id === id)).find(Boolean)
  const plantilla = plantillaPara(perfil, { favorito })

  const bloques = []
  for (const bloque of plantilla) {
    const modo = modoDelBloque(bloque)
    const libres = candidatos.filter(
      (l) =>
        !usados.has(l.id) &&
        l.id !== bloque.excluir &&
        (!bloque.modos || bloque.modos.includes(MODO_DE_CATEGORIA[l.categoria])) &&
        (!bloque.soloCategoria || l.categoria === bloque.soloCategoria),
    )
    if (libres.length < MINIMO_BLOQUE) continue

    /* ④ Puntuar solo contra sus iguales. */
    const puntuados = ordenar(libres.map((l) => puntuar(l, { modo, riesgo: bloque.riesgo, contexto })))

    /* Huecos protegidos para locales nuevos (se sacan antes de llenar). */
    const nuevos = bloque.nuevos ? puntuados.filter((c) => esNuevo(c.local, ahora)).slice(0, bloque.nuevos) : []
    const sinNuevos = puntuados.filter((c) => !nuevos.includes(c))
    const huecos = bloque.huecos - nuevos.length

    /* Cuota de afinidad: 10-30 % de los huecos para el subtipo preferido. */
    let elegidos = []
    const preferido = bloque.afinidad ? perfil?.subtipoPreferido : null
    if (preferido) {
      const cuantos = Math.max(1, Math.round(huecos * preferido.cuota))
      elegidos = sinNuevos
        .filter((c) => c.local.categoria === preferido.categoria)
        .slice(0, cuantos)
        .map((c) => ({ ...c, cuota: true }))
    }
    const resto = sinNuevos.filter((c) => !elegidos.some((e) => e.local.id === c.local.id))

    /* ⑤ Exploración, diversidad y locales nuevos. */
    elegidos = ordenar([
      ...elegidos,
      ...llenarConExploracion(resto, huecos - elegidos.length, {
        riesgo: bloque.riesgo,
        semilla: contexto.semilla,
        bloqueId: bloque.id,
        exposicion,
        maxPorCategoria: topePorCategoria(bloque, modo),
        yaElegidos: elegidos,
      }),
    ])
    let items = diversificar(elegidos)
    items = meterNuevos(items, nuevos, bloque.nuevos ?? 0)

    if (items.length < MINIMO_BLOQUE) continue
    items.forEach((c) => usados.add(c.local.id))
    anotar(bloque.id, items)
    bloques.push({
      tipo: bloque.formato,
      clave: bloque.id,
      titulo: bloque.titulo,
      nota: bloque.nota,
      subtitulo: bloque.nota,
      items: items.map((c) => c.local),
      puntuados: items,
    })
  }

  return {
    heroLista: heroe.map((c) => c.local),
    abiertos: abiertos.map((c) => c.local),
    bloques,
    explicacion,
    stats,
  }
}
