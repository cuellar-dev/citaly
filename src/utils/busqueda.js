import { estaAbierto } from './fichaLocal.js'
import { notaLocal } from './descubre.js'

export const filtrosIniciales = {
  zona: 'Todas',
  categoria: 'Todas',
  abiertos: false,
  rating: '0',
}

export function normalizar(texto) {
  return String(texto || '')
    .toLocaleLowerCase('es')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
}

export function zonaDe(local) {
  return local?.direccion?.split(',').pop()?.trim() || 'Sin zona'
}

export function coincideFiltros(local, filtros, ahora = new Date()) {
  if (filtros.zona !== 'Todas' && zonaDe(local) !== filtros.zona) return false
  if (filtros.categoria !== 'Todas' && local.categoria !== filtros.categoria) return false

  /* Antes esto era `local.horario`, un texto como "9AM - 6PM" que SIEMPRE es
     cierto: el interruptor "solo abiertos" no filtraba nada. Ahora se mira el
     reloj de verdad. */
  if (filtros.abiertos && !estaAbierto(local, ahora)) return false

  /* La nota del filtro tiene que ser la misma que pinta la tarjeta. Antes se
     leía `local.points` crudo y podías filtrar por 4.5+ y recibir un local
     que la tarjeta mostraba con 4.2. */
  const minimo = Number(filtros.rating) || 0
  if (minimo > 0 && notaLocal(local).nota < minimo) return false

  return true
}

export function hayFiltrosActivos(filtros) {
  return (
    filtros.zona !== 'Todas' ||
    filtros.categoria !== 'Todas' ||
    filtros.abiertos ||
    Number(filtros.rating) > 0
  )
}

/** Los filtros puestos, en texto, para poder enseñarlos y quitarlos uno a uno. */
export function resumenFiltros(filtros) {
  const chips = []
  if (filtros.zona !== 'Todas') chips.push({ campo: 'zona', texto: filtros.zona, valor: 'Todas' })
  if (filtros.categoria !== 'Todas') {
    chips.push({ campo: 'categoria', texto: filtros.categoria, valor: 'Todas' })
  }
  if (filtros.abiertos) chips.push({ campo: 'abiertos', texto: 'Abiertos ahora', valor: false })
  if (Number(filtros.rating) > 0) {
    chips.push({ campo: 'rating', texto: `${filtros.rating}★ o más`, valor: '0' })
  }
  return chips
}

/**
 * La caja de texto busca SOLO por nombre: si escribes algo ahí es porque sabes
 * cómo se llama el sitio. Para buscar por tipo de lugar o por zona están los
 * filtros, que es donde eso se entiende y se puede quitar.
 *
 * Lo único que se puntúa es dónde cae la coincidencia dentro del nombre, para
 * que "la" saque antes "La Esquina Verde" que "Casa Mimo".
 */
function puntuarNombre(local, texto) {
  const nombre = normalizar(local.localName)
  if (nombre === texto) return 100
  if (nombre.startsWith(texto)) return 80
  /* Empieza una palabra del nombre: "verde" encuentra "La Esquina Verde". */
  if (nombre.split(/\s+/).some((palabra) => palabra.startsWith(texto))) return 60
  if (nombre.includes(texto)) return 40
  return 0
}

/**
 * Busca por nombre y ordena por lo bien que encaja. Con el texto vacío
 * devuelve todo tal cual: aquí "sin texto" significa "enséñamelo todo y déjame
 * filtrar", no "no hay nada".
 */
export function buscarLocales(locales, consulta) {
  const texto = normalizar(consulta).trim()
  if (!texto) return locales

  /* Varias palabras: todas tienen que estar en el nombre. */
  const palabras = texto.split(/\s+/).filter(Boolean)

  return locales
    .map((local) => {
      const puntos = palabras.map((palabra) => puntuarNombre(local, palabra))
      if (puntos.some((p) => p === 0)) return null
      return { local, puntos: puntos.reduce((a, b) => a + b, 0) / puntos.length }
    })
    .filter(Boolean)
    .sort((a, b) => b.puntos - a.puntos)
    .map((x) => x.local)
}
