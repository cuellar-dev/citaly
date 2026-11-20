import { estaAbierto } from '../fichaLocal.js'
import { metrosATi, textoDistancia } from '../distancia.js'
import { estadisticasGlobales } from './calidad.js'
import { CONFIG_MODO, FUERA_DEL_FEED, MODO_DE_CATEGORIA } from './modos.js'
import { cierraTarde, horaCierre, motivoDe, motivosDe, precioMinimo } from './motivos.js'
import { puntuar } from './puntuar.js'
import { ABIERTOS, EMPUJON_FRANJA, HEROE, plantillaPara } from './reparto.js'
import { diversificar, esNuevo, llenarConExploracion, unoPorCategoria } from './rerank.js'

/* El director de Descubre (docs/descubre-implementacion.md, sección 3):

   ① candidatos → ② perfil (llega hecho) → ③ reparto → ④ puntuar → ⑤ re-ranking

   Función pura: no lee la hora, ni localStorage, ni usa Math.random. Con los
   mismos datos da SIEMPRE el mismo resultado; por eso se puede probar y, el
   día que el ranking pase al servidor, reutilizar tal cual en Node.

   Devuelve lo que pinta Descubre:
     heroLista   los 5 del carrusel
     abiertos    "Puedes ir ahora mismo"
     bloques     [{ tipo: 'lista' | 'rail' | 'cerca-cta', clave, titulo, nota,
                    subtitulo, taly, items, etiquetas }]
     motivos     Map localId → "por qué te sale" (texto corto) o nada
     explicacion Map localId → desglose del score (modo depuración) */

const MINIMO_BLOQUE = 3
/* Tarjetas grandes seguidas antes de que entre otra fila horizontal. */
const TROZO = 5
/* En los bloques que mezclan todos los modos, como mucho 2 de la misma categoría. */
const MAX_POR_CATEGORIA_MEZCLA = 2
/* "Cerca de ti": hasta qué distancia cuenta como cerca. */
const CERCA_KM = 15
const BARATO_CUP = 500

/* Atajos de arriba: rehacen el feed solo con un tipo de sitio. */
export const ATAJOS = [
  { id: 'comer', etiqueta: 'Comer', modos: ['antojo'] },
  { id: 'cuidarte', etiqueta: 'Cuidarte', modos: ['confianza', 'rutina'] },
  { id: 'caprichos', etiqueta: 'Caprichos', modos: ['capricho'] },
  { id: 'abierto', etiqueta: 'Abierto ahora', abierto: true },
]

/* Las condiciones especiales de algunas filas (campo `filtro` en reparto.js). */
const FILTROS = {
  lugar: (l) => l.lugar === true,
  tarde: (l) => cierraTarde(l),
  barato: (l) => {
    const p = precioMinimo(l)
    return p > 0 && p <= BARATO_CUP
  },
}

/* Los modos que quieren variedad (antojo, capricho) no dejan que una
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

/* Alterna lista, fila, lista, fila… respetando el orden de cada tipo, y
   empezando SIEMPRE por una lista (justo encima va la fila de abiertos). Si un
   tipo se acaba, el resto del otro va al final. */
function intercalar(listas, filas) {
  const l = [...listas]
  const f = [...filas]
  const salida = []
  let tocaLista = true
  while (l.length || f.length) {
    const cola = tocaLista ? (l.length ? l : f) : f.length ? f : l
    salida.push(cola.shift())
    tocaLista = !tocaLista
  }
  return salida
}

/** Elige los locales de un bloque normal (lista o fila sin orden especial). */
function llenarBloque(bloque, libres, { contexto, perfil }) {
  const modo = modoDelBloque(bloque)
  let puntuados = libres.map((l) => puntuar(l, { modo, riesgo: bloque.riesgo, contexto }))

  /* Empujón de la franja del día (solo el primer bloque). */
  if (bloque.preferir?.length) {
    puntuados = puntuados.map((c) =>
      bloque.preferir.includes(c.local.categoria)
        ? { ...c, score: c.score + EMPUJON_FRANJA, desglose: { ...c.desglose, franja: EMPUJON_FRANJA } }
        : c,
    )
  }
  puntuados = ordenar(puntuados)

  /* Cuota de afinidad: 10-30 % de los huecos para el subtipo preferido. */
  let elegidos = []
  const preferido = bloque.afinidad ? perfil?.subtipoPreferido : null
  if (preferido) {
    const cuantos = Math.max(1, Math.round(bloque.huecos * preferido.cuota))
    elegidos = puntuados
      .filter((c) => c.local.categoria === preferido.categoria)
      .slice(0, cuantos)
      .map((c) => ({ ...c, cuota: true }))
  }
  const resto = puntuados.filter((c) => !elegidos.some((e) => e.local.id === c.local.id))

  elegidos = ordenar([
    ...elegidos,
    ...llenarConExploracion(resto, bloque.huecos - elegidos.length, {
      riesgo: bloque.riesgo,
      semilla: contexto.semilla,
      bloqueId: bloque.id,
      exposicion: contexto.exposicion,
      maxPorCategoria: topePorCategoria(bloque, modo),
      yaElegidos: elegidos,
    }),
  ])
  return diversificar(elegidos)
}

export function construirDescubre({
  locales = [],
  perfil,
  ahora = new Date(),
  semilla = 0,
  exposicion = new Map(),
  favoritos = [],
  ubicacion = null,
  atajo = null,
}) {
  /* ① Candidatos: fuera lo que no va en el feed. Las categorías de confianza
     que el usuario ya tiene resueltas (ya tiene "su" barbería) no reciben
     bloques de descubrimiento, pero sí salen al final, en "Más lugares": no
     desaparecen de la app. El atajo de arriba, si lo hay, filtra todo. */
  const resueltas = perfil?.categoriasResueltas ?? new Map()
  const filtroAtajo = ATAJOS.find((a) => a.id === atajo)
  const pasaAtajo = (l) =>
    !filtroAtajo ||
    (filtroAtajo.abierto ? estaAbierto(l, ahora) : filtroAtajo.modos.includes(MODO_DE_CATEGORIA[l.categoria]))
  const todos = locales.filter((l) => !l.oculto && !FUERA_DEL_FEED.has(l.categoria) && pasaAtajo(l))
  const candidatos = todos.filter((l) => !resueltas.has(l.categoria))

  const stats = estadisticasGlobales(locales)
  const contexto = { stats, perfil, exposicion, ahora, semilla }
  const explicacion = new Map()
  const motivos = new Map()

  const anotar = (bloqueId, lista) =>
    lista.forEach((c, posicion) => {
      if (!explicacion.has(c.local.id)) {
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
      if (!motivos.has(c.local.id)) motivos.set(c.local.id, motivoDe(c.local, { perfil, ahora }))
    })

  /* Héroe: lo mejor de todo, mezclado, sin exploración y una categoría por
     diapositiva. No va primero lo abierto: eso es para su propia fila. */
  const heroe = unoPorCategoria(
    ordenar(candidatos.map((l) => puntuar(l, { modo: 'general', riesgo: HEROE.riesgo, contexto }))),
    HEROE.huecos,
  )
  const enHeroe = new Set(heroe.map((c) => c.local.id))
  /* En el héroe, cada diapositiva con un motivo distinto: cinco "Muy querido"
     seguidos no dicen nada. */
  const usadosHeroe = new Set()
  heroe.forEach((c) => {
    const libre = motivosDe(c.local, { perfil, ahora }).find((m) => !usadosHeroe.has(m.split(' · ')[0]))
    if (libre) usadosHeroe.add(libre.split(' · ')[0])
    motivos.set(c.local.id, libre ?? null)
  })
  anotar('heroe', heroe)

  const favorito = favoritos.map((id) => locales.find((l) => l.id === id)).find(Boolean)
  const plantilla = plantillaPara(perfil, { favorito, ahora })

  /* Los recién llegados se reservan para su fila "Nuevos en Citaly" (su hueco
     protegido contra el arranque en frío), si hay al menos 3. */
  const nuevos = candidatos.filter((l) => !enHeroe.has(l.id) && esNuevo(l, ahora))
  const reservados = new Set(
    plantilla.filas.some((b) => b.filtro === 'nuevo') && nuevos.length >= MINIMO_BLOQUE ? nuevos.map((l) => l.id) : [],
  )

  /* ③④⑤ Listas de arriba. Entre ellas no se repite nada. */
  const enListas = new Set(enHeroe)
  const listas = []
  for (const bloque of plantilla.listas) {
    const libres = candidatos.filter(
      (l) =>
        !enListas.has(l.id) &&
        !reservados.has(l.id) &&
        (!bloque.modos || bloque.modos.includes(MODO_DE_CATEGORIA[l.categoria])),
    )
    if (libres.length < MINIMO_BLOQUE) continue
    const items = llenarBloque(bloque, libres, { contexto, perfil })
    if (items.length < MINIMO_BLOQUE) continue
    items.forEach((c) => enListas.add(c.local.id))
    anotar(bloque.id, items)
    listas.push({ tipo: 'lista', clave: bloque.id, titulo: bloque.titulo, nota: bloque.nota, subtitulo: bloque.nota, items: items.map((c) => c.local), puntuados: items })
  }

  /* Abiertos ahora: sin el héroe ni la primera lista, que van pegados. Con el
     atajo "Abierto ahora" sobra (todo el feed ya es eso). */
  const primeraLista = new Set(listas[0]?.items.map((l) => l.id) ?? [])
  const abiertos =
    filtroAtajo?.abierto
      ? []
      : ordenar(
          candidatos
            .filter((l) => !enHeroe.has(l.id) && !primeraLista.has(l.id) && estaAbierto(l, ahora))
            .map((l) => puntuar(l, { modo: 'general', riesgo: ABIERTOS.riesgo, contexto })),
        ).slice(0, ABIERTOS.huecos)

  /* Filas: no repiten el héroe, ni las listas de arriba, ni otra fila. Así lo
     que acabas de ver no te vuelve a salir justo al lado. */
  const enFilas = new Set([...enListas, ...abiertos.map((c) => c.local.id)])
  const filas = []
  for (const bloque of plantilla.filas) {
    /* "Cerca de ti": si no sabemos dónde estás, en su sitio va la llamada
       para activarlo. Si lo sabemos, por distancia y sin más reglas (sí puede
       repetir locales: lo cerca es lo cerca). */
    if (bloque.filtro === 'cerca') {
      if (!ubicacion) {
        filas.push({ tipo: 'cerca-cta', clave: 'cerca', titulo: bloque.titulo, taly: '¿Te digo qué te queda cerca?' })
        continue
      }
      const cerca = candidatos
        .filter((l) => !enHeroe.has(l.id))
        .map((l) => ({ local: l, metros: metrosATi(l, ubicacion) }))
        .filter((c) => c.metros != null && c.metros <= CERCA_KM * 1000)
        .sort((a, b) => a.metros - b.metros)
        .slice(0, bloque.huecos)
      if (cerca.length < MINIMO_BLOQUE) continue
      const items = cerca.map((c) => ({ ...puntuar(c.local, { modo: 'general', riesgo: 0, contexto }), metros: c.metros }))
      anotar('cerca', items)
      filas.push({
        tipo: 'rail',
        clave: 'cerca',
        titulo: bloque.titulo,
        nota: bloque.nota,
        items: items.map((c) => c.local),
        puntuados: items,
        etiquetas: Object.fromEntries(items.map((c) => [c.local.id, `A ${textoDistancia(c.metros)}`])),
      })
      continue
    }

    const libres = candidatos.filter(
      (l) =>
        !enFilas.has(l.id) &&
        l.id !== bloque.excluir &&
        (!bloque.modos || bloque.modos.includes(MODO_DE_CATEGORIA[l.categoria])) &&
        (!bloque.soloCategoria || l.categoria === bloque.soloCategoria) &&
        (bloque.filtro === 'nuevo' ? esNuevo(l, ahora) : !bloque.filtro || FILTROS[bloque.filtro](l)),
    )
    if (libres.length < MINIMO_BLOQUE) continue
    const items = llenarBloque(bloque, libres, { contexto, perfil })
    if (items.length < MINIMO_BLOQUE) continue
    items.forEach((c) => enFilas.add(c.local.id))
    anotar(bloque.id, items)

    /* Etiqueta sobre la foto según la fila: "Nuevo", "Hasta las 11:00 PM"… */
    const etiquetaDe = {
      nuevo: () => 'Nuevo',
      tarde: (l) => `Hasta las ${horaCierre(l)}`,
      barato: (l) => `Desde ${precioMinimo(l)} CUP`,
    }[bloque.filtro]
    filas.push({
      tipo: 'rail',
      clave: bloque.id,
      titulo: bloque.titulo,
      nota: bloque.nota,
      taly: bloque.taly,
      items: items.map((c) => c.local),
      puntuados: items,
      etiquetas: etiquetaDe ? Object.fromEntries(items.map((c) => [c.local.id, etiquetaDe(c.local)])) : undefined,
    })
  }

  /* "Más lugares": todo lo que aún no salió como tarjeta grande (puede haber
     salido en una fila), por puntuación, en trozos de 5. Incluye las
     categorías resueltas: al final del todo también se ven. */
  const sobrantes = diversificar(
    ordenar(
      todos
        .filter((l) => !enListas.has(l.id))
        .map((l) => puntuar(l, { modo: 'general', riesgo: 0.2, contexto })),
    ),
  )
  const trozos = []
  for (let i = 0; i < sobrantes.length; i += TROZO) trozos.push(sobrantes.slice(i, i + TROZO))
  if (trozos.length > 1 && trozos[trozos.length - 1].length < MINIMO_BLOQUE) {
    trozos[trozos.length - 2].push(...trozos.pop())
  }
  trozos.forEach((items, i) => {
    anotar(`mas-${i + 1}`, items)
    listas.push({
      tipo: 'lista',
      clave: `mas-${i + 1}`,
      titulo: i === 0 ? 'Más lugares' : null,
      nota: i === 0 ? 'Todo lo que hay en tu zona' : null,
      subtitulo: i === 0 ? 'Todo lo que hay en tu zona' : null,
      items: items.map((c) => c.local),
      puntuados: items,
    })
  })

  return {
    heroLista: heroe.map((c) => c.local),
    abiertos: abiertos.map((c) => c.local),
    bloques: intercalar(listas, filas),
    motivos,
    explicacion,
    stats,
  }
}
