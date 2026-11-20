import { notaDeComentarios } from '../fichaLocal.js'
import { aleatorioCon, hashTexto } from './semilla.js'

/* Paso 8 — Re-ranking (sección 12): lo que una puntuación no capta.
   Todo puro: recibe listas ya puntuadas y devuelve listas nuevas. */

/* 12.1 Diversidad: no más de 2 seguidos de la misma categoría y nunca dos
   seguidos del mismo dueño. Voraz: si el siguiente rompe la regla, se coge el
   primero que no la rompa y el saltado espera su turno. */
const MAX_SEGUIDOS = 2

function rompeDiversidad(candidato, resultado) {
  const ultimo = resultado[resultado.length - 1]
  if (ultimo && candidato.local.duenoId && candidato.local.duenoId === ultimo.local.duenoId) return true
  const cola = resultado.slice(-MAX_SEGUIDOS)
  return cola.length === MAX_SEGUIDOS && cola.every((c) => c.local.categoria === candidato.local.categoria)
}

export function diversificar(ordenados) {
  const resultado = []
  const pendientes = [...ordenados]
  while (pendientes.length) {
    const i = pendientes.findIndex((c) => !rompeDiversidad(c, resultado))
    resultado.push(pendientes.splice(i === -1 ? 0 : i, 1)[0])
  }
  return resultado
}

/* Para el héroe: una categoría por diapositiva mientras se pueda. */
export function unoPorCategoria(ordenados, cuantos) {
  const vistas = new Set()
  const primero = []
  const resto = []
  for (const c of ordenados) {
    if (!vistas.has(c.local.categoria)) {
      vistas.add(c.local.categoria)
      primero.push(c)
    } else resto.push(c)
  }
  return [...primero, ...resto].slice(0, cuantos)
}

/* 12.2 Exploración ε-greedy: en cada hueco se tira un dado (con semilla, nunca
   Math.random). Con probabilidad ε = riesgo del bloque se coge el candidato
   MENOS mostrado en vez del mejor puntuado. Así un local bueno que aún nadie
   ha visto tiene su oportunidad.

   Solo se explora entre la mitad de arriba de lo que queda (un local malo no
   salta por sorteo) y, si varios están igual de poco vistos (un usuario nuevo:
   todos con 0), se elige uno al azar con el mismo dado. Antes se cogía el
   primero del empate, que era el mejor puntuado: no exploraba nada. */
export function llenarConExploracion(
  ordenados,
  huecos,
  { riesgo, semilla, bloqueId, exposicion, maxPorCategoria = Infinity, yaElegidos = [] },
) {
  const dado = aleatorioCon(semilla ^ hashTexto(`explorar|${bloqueId}`))
  /* En los bloques que mezclan de todo, ninguna categoría se lo come entero. */
  const porCategoria = new Map()
  const contar = (c) => porCategoria.set(c.local.categoria, (porCategoria.get(c.local.categoria) ?? 0) + 1)
  yaElegidos.forEach(contar)
  const cabe = (c) => (porCategoria.get(c.local.categoria) ?? 0) < maxPorCategoria
  let pendientes = [...ordenados]
  const elegidos = []
  while (elegidos.length < huecos) {
    pendientes = pendientes.filter(cabe)
    if (!pendientes.length) break
    let i = 0
    let explora = false
    if (riesgo > 0 && dado() < riesgo && pendientes.length > 1) {
      const vistas = (c) => exposicion?.get(c.local.id)?.vistas ?? 0
      const mitad = pendientes.slice(0, Math.max(2, Math.ceil(pendientes.length / 2)))
      const minimo = Math.min(...mitad.map(vistas))
      const empatados = mitad.map((c, j) => (vistas(c) === minimo ? j : -1)).filter((j) => j >= 0)
      i = empatados[Math.floor(dado() * empatados.length)]
      explora = i !== 0
    }
    const [elegido] = pendientes.splice(i, 1)
    contar(elegido)
    elegidos.push(explora ? { ...elegido, exploracion: true } : elegido)
  }
  return elegidos
}

/* 12.3 Arranque en frío: un local recién dado de alta no tiene opiniones, así
   que la nota bayesiana lo deja en la media y nunca subiría. Se le guardan
   huecos protegidos durante sus primeros 30 días.

   Además tiene que tener pocas opiniones (3 o menos): el arranque en frío es
   justo eso, no tener opiniones. Un local con 10 opiniones ya no lo necesita,
   aunque su fecha de alta sea reciente (pasa con los datos de prueba del
   backend, donde todos tienen la fecha del día en que se cargaron). */
export const DIAS_NUEVO = 30
const MAX_OPINIONES_NUEVO = 3

export function esNuevo(local, ahora) {
  const alta = local.fechaAlta ?? local.aprobadoEn
  if (!alta) return false
  if (notaDeComentarios(local).cantidad > MAX_OPINIONES_NUEVO) return false
  const dias = (ahora.getTime() - new Date(alta).getTime()) / 86400000
  return dias >= 0 && dias < DIAS_NUEVO
}

/** Mete hasta `cuantos` locales nuevos en las posiciones 2, 5, 8… del bloque. */
export function meterNuevos(lista, nuevos, cuantos) {
  const resultado = [...lista]
  nuevos.slice(0, cuantos).forEach((c, i) => {
    const posicion = Math.min(1 + i * 3, resultado.length)
    resultado.splice(posicion, 0, { ...c, nuevo: true })
  })
  return resultado
}
