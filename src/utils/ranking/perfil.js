import { CANCELADA } from '../estadosCita.js'
import { sitiosFijos } from '../resumenCitas.js'
import { MODO_DE_CATEGORIA } from './modos.js'

/* Paso 5 — Lo que sabemos del usuario (docs/descubre-implementacion.md, 9).

   Función pura: todo lo que necesita le llega como parámetro. Quien la llama
   (Descubre) lee citas, favoritos y filtros de localStorage.

   {
     esNuevo,              sin ninguna señal todavía
     afinidad,             { Restaurante: 0.6, Cafetería: 0.25, … } (suma 1)
     subtipoPreferido,     { categoria, cuota } dentro de "antojo", o null
     categoriasResueltas,  Map categoria → { localId, hasta }
     fijos,                [{ localId, categoria, veces, hasta }]
   } */

/* Puntos de interés por señal: reservar compromete más que guardar, y
   guardar más que filtrar. */
export const PUNTOS = { cita: 2, favorito: 1, filtro: 0.5 }

/* Para detectar un subtipo preferido hacen falta señales suficientes y que uno
   destaque. La cuota va del 10 % al 30 %: con más, el feed se cierra en banda
   y deja de descubrir. */
export const MINIMO_SENALES = 3
const DESTACA = 0.4
const CUOTA_MIN = 0.1
const CUOTA_MAX = 0.3

/* Una categoría resuelta (ya tiene "su" barbería) se reabre a los 6 meses sin
   ir. También se reabre si el local desaparece de Citaly. */
const MESES_RESUELTA = 6

const clamp = (min, max, v) => Math.min(max, Math.max(min, v))

function proporciones(puntos) {
  const total = Object.values(puntos).reduce((a, b) => a + b, 0)
  if (!total) return { total: 0, partes: {} }
  return {
    total,
    partes: Object.fromEntries(Object.entries(puntos).map(([c, p]) => [c, p / total])),
  }
}

export function construirPerfil({ citas = [], favoritos = [], filtrosUsados = {}, locales = [], ahora = new Date() }) {
  const porId = new Map(locales.map((l) => [l.id, l]))
  const categoriaDe = (id) => porId.get(id)?.categoria

  /* Sitios de confianza ya resueltos: ir siempre a la misma barbería dice que
     ya terminó de buscar, no que le interese más. */
  const fijosBrutos = sitiosFijos(citas, (id) => porId.get(id) ?? null, ahora)
  const fijos = fijosBrutos
    .map((f) => {
      const hasta = new Date(`${f.ultima.fecha}T12:00:00`)
      hasta.setMonth(hasta.getMonth() + MESES_RESUELTA)
      return { localId: f.local.id, categoria: f.local.categoria, veces: f.veces, hasta }
    })
    .filter((f) => f.hasta > ahora)
  const categoriasResueltas = new Map(fijos.map((f) => [f.categoria, { localId: f.localId, hasta: f.hasta }]))

  const puntos = {}
  const sumar = (categoria, p) => {
    if (!categoria) return
    puntos[categoria] = (puntos[categoria] ?? 0) + p
  }
  citas
    .filter((c) => c.estadoReserva !== CANCELADA)
    .forEach((c) => {
      const categoria = categoriaDe(c.localId)
      /* En confianza, reservar no es "interés": es una necesidad (cortarse el
         pelo). No suma afinidad; los favoritos sí. */
      if (MODO_DE_CATEGORIA[categoria] === 'confianza') return
      sumar(categoria, PUNTOS.cita)
    })
  favoritos.forEach((id) => sumar(categoriaDe(id), PUNTOS.favorito))
  Object.entries(filtrosUsados).forEach(([categoria, { veces }]) => sumar(categoria, PUNTOS.filtro * (veces || 0)))

  const { total, partes: afinidad } = proporciones(puntos)

  /* Subtipo preferido: solo dentro de antojo (restaurante, cafetería, bar…),
     que es donde la variedad ES el servicio. */
  const puntosAntojo = Object.fromEntries(
    Object.entries(puntos).filter(([c]) => MODO_DE_CATEGORIA[c] === 'antojo'),
  )
  const antojo = proporciones(puntosAntojo)
  let subtipoPreferido = null
  if (antojo.total >= MINIMO_SENALES) {
    const [categoria, parte] = Object.entries(antojo.partes).sort((a, b) => b[1] - a[1])[0]
    if (parte >= DESTACA) {
      subtipoPreferido = { categoria, parte, cuota: clamp(CUOTA_MIN, CUOTA_MAX, CUOTA_MIN + (parte - DESTACA) * 0.5) }
    }
  }

  return {
    esNuevo: total === 0,
    senales: total,
    afinidad,
    subtipoPreferido,
    categoriasResueltas,
    fijos,
  }
}
