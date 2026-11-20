import { estaAbierto, franjaTurno, aMinutos, codigoDia } from '../fichaLocal.js'
import { factorCalidad } from './calidad.js'
import { CONFIG_MODO, MODO_DE_CATEGORIA } from './modos.js'
import { MINIMO_SENALES } from './perfil.js'
import { jitter } from './semilla.js'

/* Paso 7 — Nivel 2: puntuar dentro de cada bloque (sección 11).

   score = wCalidad·calidad + wContexto·contexto + wAfinidad·afinidad + wNovedad·novedad
   Cada factor va de 0 a 1. Los pesos salen de CONFIG_MODO (modos.js). */

const clamp01 = (v) => Math.min(1, Math.max(0, v))

/* Cafetería por la mañana, bar por la noche: un retoque pequeño solo dentro
   de antojo. [desde, hasta) en horas, y el multiplicador. */
const HORA_ANTOJO = {
  Cafetería: [
    [6, 12, 1.15],
    [20, 29, 0.8],
  ],
  Bar: [
    [19, 29, 1.15],
    [6, 13, 0.75],
  ],
  Terraza: [[16, 24, 1.1]],
}

function ajusteHorario(categoria, ahora) {
  const h = ahora.getHours()
  for (const [desde, hasta, mult] of HORA_ANTOJO[categoria] ?? []) {
    if ((h >= desde && h < hasta) || (h + 24 >= desde && h + 24 < hasta)) return mult
  }
  return 1
}

/** ¿Le sirve AHORA? Pesa poco en el total (ver CONFIG_MODO). */
export function factorContexto(local, ahora) {
  if (!local?.horarioApertura || !local?.horarioCierre) return 0.3
  let valor
  if (estaAbierto(local, ahora)) {
    const { fin, cursor } = franjaTurno(local.horarioApertura, local.horarioCierre, ahora)
    const quedan = Math.max(0, fin - cursor)
    valor = quedan >= 45 ? 1 : 0.6 + 0.4 * (quedan / 45)
  } else {
    const abreHoyMasTarde =
      (local.dias ?? []).includes(codigoDia(ahora)) &&
      aMinutos(local.horarioApertura) > ahora.getHours() * 60 + ahora.getMinutes()
    valor = abreHoyMasTarde ? 0.6 : 0.35
  }
  if (MODO_DE_CATEGORIA[local.categoria] === 'antojo') valor *= ajusteHorario(local.categoria, ahora)
  return clamp01(valor)
}

/** ¿Le suele gustar este tipo de sitio? Usuario nuevo: igual para todo. */
export function factorAfinidad(local, perfil) {
  /* Con menos de 3 puntos de interés (un favorito suelto) es ruido: neutro. */
  if (!perfil || perfil.senales < MINIMO_SENALES) return 0.5
  const valores = Object.values(perfil.afinidad)
  const maximo = valores.length ? Math.max(...valores) : 0
  if (!maximo) return 0.5
  /* De 0,5 (nada de interés) a 1 (su favorita): un empujón, no un muro. */
  return 0.5 + 0.5 * ((perfil.afinidad[local.categoria] ?? 0) / maximo)
}

/** ¿Hace mucho que no le sale arriba? 72 h o nunca → 1. */
export function factorNovedad(local, exposicion, ahora) {
  const ultima = exposicion?.get(local.id)?.ultimaVezTop
  if (!ultima) return 1
  return clamp01((ahora.getTime() - ultima) / (72 * 3600 * 1000))
}

/* Cuánto puede "temblar" la puntuación según el riesgo del bloque: arriba
   poco (solo desempata), abajo más. */
export const amplitudJitter = (riesgo) => 0.04 + riesgo * 0.12

/**
 * Score de un local para un bloque, con el desglose (para depurar: "¿por qué
 * sale este primero?").
 */
export function puntuar(local, { modo, riesgo = 0, contexto }) {
  const { stats, perfil, exposicion, ahora, semilla } = contexto
  const { pesos } = CONFIG_MODO[modo] ?? CONFIG_MODO.general
  const desglose = {
    calidad: factorCalidad(local, stats),
    contexto: factorContexto(local, ahora),
    afinidad: factorAfinidad(local, perfil),
    novedad: factorNovedad(local, exposicion, ahora),
  }
  const base =
    pesos.calidad * desglose.calidad +
    pesos.contexto * desglose.contexto +
    pesos.afinidad * desglose.afinidad +
    pesos.novedad * desglose.novedad
  desglose.jitter = jitter(semilla, local.id, amplitudJitter(riesgo))
  return { local, base, score: base + desglose.jitter, desglose }
}
