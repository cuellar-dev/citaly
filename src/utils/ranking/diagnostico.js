import { estaAbierto, notaDeComentarios } from '../fichaLocal.js'
import { notaRanking } from './calidad.js'
import { CONFIG_MODO, MODO_DE_CATEGORIA } from './modos.js'
import { esNuevo } from './rerank.js'
import { franjaDe } from './reparto.js'
import { puntuar } from './puntuar.js'

/* Diagnóstico del ranking de Descubre, SOLO en desarrollo (Descubre.jsx lo carga
   con import.meta.env.DEV). Sirve para saber, con datos, por qué un local salió
   encima de otro.

   En la consola del navegador, con Descubre abierto:

     descubreDebug()                    tabla de TODOS los locales con sus puntos
     descubreDebug.comparar('son y ron', 'patio azul')
                                        qué factor le dio la ventaja a cada uno
     descubreDebug.bloques()            qué salió en cada bloque y en qué orden
     descubreDebug.texto()              todo en JSON, para pegarlo en el chat
     descubreDebug.copiar()             lo mismo, copiado al portapapeles

   `descubreDebug()` devuelve el objeto completo (contexto, locales, bloques):
   es lo que hay que mandar cuando algo no cuadra. */

const r2 = (n) => (Number.isFinite(n) ? Math.round(n * 1000) / 1000 : null)
const sinTildes = (t) => String(t ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()

let estado = null

/** Descubre.jsx llama a esto cada vez que recalcula el feed. */
export function registrar(nuevo) {
  estado = nuevo
}

/* Los mismos factores que usa puntuar() en un modo, con su peso: lo que cada
   uno aporta al score es peso × factor. */
function aportes(desglose, pesos) {
  return {
    calidad: r2(pesos.calidad * desglose.calidad),
    contexto: r2(pesos.contexto * desglose.contexto),
    afinidad: r2(pesos.afinidad * desglose.afinidad),
    novedad: r2(pesos.novedad * desglose.novedad),
  }
}

function construir() {
  if (!estado) return null
  const { locales, resultado, perfil, ahora, semilla, exposicion, ubicacion, atajo } = estado
  const contextoRanking = { stats: resultado.stats, perfil, exposicion, ahora, semilla }

  /* Dónde salió cada local (puede estar en varios bloques). */
  const apariciones = new Map()
  const anotarLista = (clave, items) =>
    items.forEach((l, pos) => {
      const lista = apariciones.get(l.id) ?? []
      lista.push({ bloque: clave, posicion: pos + 1 })
      apariciones.set(l.id, lista)
    })
  anotarLista('heroe', resultado.heroLista)
  anotarLista('abiertos', resultado.abiertos)
  resultado.bloques.forEach((b) => b.items && anotarLista(b.clave, b.items))

  const filas = locales.map((l) => {
    const { nota, cantidad } = notaDeComentarios(l)
    const modo = MODO_DE_CATEGORIA[l.categoria] ?? '(sin modo)'
    /* Puntos "limpios": modo general, sin temblor de exploración (riesgo 0). */
    const general = puntuar(l, { modo: 'general', riesgo: 0, contexto: contextoRanking })
    const propio = puntuar(l, { modo: CONFIG_MODO[modo] ? modo : 'general', riesgo: 0, contexto: contextoRanking })
    const real = resultado.explicacion.get(l.id) ?? null
    const expo = exposicion.get(l.id) ?? null
    return {
      id: l.id,
      nombre: l.localName,
      categoria: l.categoria,
      modo,
      nota,
      opiniones: cantidad,
      notaRanking: r2(notaRanking(l, resultado.stats)),
      repetidores: Number(l.repetidores) || 0,
      fechaAlta: l.fechaAlta ?? null,
      esNuevo: esNuevo(l, ahora),
      abierto: estaAbierto(l, ahora),
      vistasPrevias: expo?.vistas ?? 0,
      ultimaVezTop: expo?.ultimaVezTop ? new Date(expo.ultimaVezTop).toISOString() : null,
      /* Factores (0-1) y score SIN temblor. */
      calidad: r2(general.desglose.calidad),
      contexto: r2(general.desglose.contexto),
      afinidad: r2(general.desglose.afinidad),
      novedad: r2(general.desglose.novedad),
      scoreGeneral: r2(general.base),
      scoreSuModo: r2(propio.base),
      /* Lo que de verdad se usó la primera vez que salió (con temblor). */
      primeraAparicion: real
        ? {
            bloque: real.bloque,
            posicion: real.posicion + 1,
            score: r2(real.score),
            jitter: r2(real.desglose?.jitter),
            franja: r2(real.desglose?.franja ?? 0),
            exploracion: real.exploracion,
            cuotaAfinidad: real.cuota,
            nuevo: real.nuevo,
          }
        : null,
      apariciones: apariciones.get(l.id) ?? [],
      motivo: resultado.motivos?.get(l.id) ?? null,
      _general: general,
      _propio: propio,
    }
  })
  filas.sort((a, b) => b.scoreGeneral - a.scoreGeneral)

  const datos = {
    generado: new Date().toISOString(),
    contexto: {
      ahora: ahora.toISOString(),
      hora: ahora.getHours(),
      franja: franjaDe(ahora).titulo,
      semilla,
      atajo,
      ubicacion: ubicacion ? { lat: ubicacion.lat, lng: ubicacion.lng } : null,
      mediaGlobal: r2(resultado.stats.m),
      C: resultado.stats.C,
      /* La calidad se mide entre estas dos notas (peor = 0, mejor = 1). */
      notaMin: r2(resultado.stats.min),
      notaMax: r2(resultado.stats.max),
      candidatos: locales.length,
      perfil: {
        esNuevo: perfil.esNuevo,
        senales: perfil.senales,
        afinidad: Object.fromEntries(Object.entries(perfil.afinidad).map(([k, v]) => [k, r2(v)])),
        subtipoPreferido: perfil.subtipoPreferido
          ? { categoria: perfil.subtipoPreferido.categoria, cuota: r2(perfil.subtipoPreferido.cuota) }
          : null,
        categoriasResueltas: [...perfil.categoriasResueltas.keys()],
      },
      pesos: CONFIG_MODO,
      ordenBloques: resultado.bloques.map((b) => b.clave),
    },
    // eslint-disable-next-line no-unused-vars
    locales: filas.map(({ _general, _propio, ...resto }) => resto),
    bloques: resultado.bloques.map((b) => ({
      clave: b.clave,
      titulo: b.titulo ?? null,
      tipo: b.tipo,
      items: (b.items ?? []).map((l) => l.localName),
    })),
  }
  return { datos, filas }
}

function buscar(filas, texto) {
  const t = sinTildes(texto)
  return filas.find((f) => sinTildes(f.nombre) === t) ?? filas.find((f) => sinTildes(f.nombre).includes(t)) ?? null
}

function tabla() {
  const hecho = construir()
  if (!hecho) {
    console.warn('descubreDebug: abre primero la pantalla Descubre (/).')
    return null
  }
  const { datos } = hecho
  console.log(
    `Descubre · ${datos.contexto.candidatos} locales · ${datos.contexto.franja} · semilla ${datos.contexto.semilla} · media global ${datos.contexto.mediaGlobal} · C ${datos.contexto.C}`,
  )
  console.table(
    datos.locales.map((f, i) => ({
      '#': i + 1,
      local: f.nombre,
      categoria: f.categoria,
      nota: f.nota,
      op: f.opiniones,
      calidad: f.calidad,
      ctx: f.contexto,
      afin: f.afinidad,
      novedad: f.novedad,
      'score (sin temblor)': f.scoreGeneral,
      'salió en': f.primeraAparicion ? `${f.primeraAparicion.bloque} #${f.primeraAparicion.posicion}` : '—',
      jitter: f.primeraAparicion?.jitter ?? '',
      marcas: [
        f.primeraAparicion?.exploracion && 'explora',
        f.primeraAparicion?.cuotaAfinidad && 'cuota',
        f.primeraAparicion?.nuevo && 'nuevo',
        f.esNuevo && 'es-nuevo',
      ]
        .filter(Boolean)
        .join(' '),
    })),
  )
  return datos
}

tabla.bloques = () => {
  const hecho = construir()
  if (!hecho) return null
  hecho.datos.bloques.forEach((b) => console.log(`${b.tipo === 'lista' ? 'LISTA' : 'FILA '} ${b.clave} · ${b.titulo ?? ''}\n   ${b.items.join(', ')}`))
  return hecho.datos.bloques
}

/**
 * Compara dos locales: qué factor le dio la ventaja a cada uno. Cada fila es
 * "peso × factor = puntos"; la suma es el score sin temblor. Al final, el
 * temblor (jitter) y la franja que de verdad se aplicaron al salir.
 */
tabla.comparar = (a, b) => {
  const hecho = construir()
  if (!hecho) return null
  const A = buscar(hecho.filas, a)
  const B = buscar(hecho.filas, b)
  if (!A || !B) {
    console.warn(`No encuentro ${!A ? `"${a}"` : ''} ${!B ? `"${b}"` : ''}. Nombres disponibles: tabla descubreDebug().`)
    return null
  }
  const pesos = CONFIG_MODO.general.pesos
  const pa = aportes(A._general.desglose, pesos)
  const pb = aportes(B._general.desglose, pesos)
  const filas = ['calidad', 'contexto', 'afinidad', 'novedad'].map((k) => ({
    factor: k,
    peso: pesos[k],
    [A.nombre]: r2(A._general.desglose[k]),
    [`${A.nombre} (pts)`]: pa[k],
    [B.nombre]: r2(B._general.desglose[k]),
    [`${B.nombre} (pts)`]: pb[k],
    diferencia: r2(pa[k] - pb[k]),
  }))
  console.table(filas)
  const gana = A.scoreGeneral === B.scoreGeneral ? 'empate' : A.scoreGeneral > B.scoreGeneral ? A.nombre : B.nombre
  console.log(
    `Sin temblor: ${A.nombre} ${A.scoreGeneral} · ${B.nombre} ${B.scoreGeneral} → gana ${gana} por ${r2(Math.abs(A.scoreGeneral - B.scoreGeneral))}`,
  )
  const salio = (f) =>
    f.primeraAparicion
      ? `${f.nombre}: salió en ${f.primeraAparicion.bloque} #${f.primeraAparicion.posicion} con temblor ${f.primeraAparicion.jitter} (score final ${f.primeraAparicion.score}${f.primeraAparicion.franja ? `, franja +${f.primeraAparicion.franja}` : ''}${f.primeraAparicion.exploracion ? ', EXPLORACIÓN' : ''}${f.primeraAparicion.cuotaAfinidad ? ', CUOTA' : ''}${f.primeraAparicion.nuevo ? ', NUEVO' : ''})`
      : `${f.nombre}: no salió en ningún bloque`
  console.log(salio(A))
  console.log(salio(B))
  return {
    a: { nombre: A.nombre, nota: A.nota, opiniones: A.opiniones, vistasPrevias: A.vistasPrevias, ultimaVezTop: A.ultimaVezTop, aportes: pa, scoreSinTemblor: A.scoreGeneral, primeraAparicion: A.primeraAparicion, apariciones: A.apariciones },
    b: { nombre: B.nombre, nota: B.nota, opiniones: B.opiniones, vistasPrevias: B.vistasPrevias, ultimaVezTop: B.ultimaVezTop, aportes: pb, scoreSinTemblor: B.scoreGeneral, primeraAparicion: B.primeraAparicion, apariciones: B.apariciones },
    contexto: hecho.datos.contexto,
  }
}

tabla.texto = () => {
  const hecho = construir()
  return hecho ? JSON.stringify(hecho.datos, null, 1) : null
}

tabla.copiar = async () => {
  const texto = tabla.texto()
  if (!texto) return null
  try {
    await navigator.clipboard.writeText(texto)
    console.log(`Copiado (${Math.round(texto.length / 1024)} KB). Pégalo en el chat.`)
  } catch {
    console.log('No pude copiar solo (el navegador pide que la página tenga el foco). Haz clic en la página y repite, o usa copy(descubreDebug.texto()).')
  }
  return texto
}

/** Deja `descubreDebug` listo en la consola. */
export function instalar() {
  window.descubreDebug = tabla
}
