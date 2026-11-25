/* global process */
import { beforeAll, describe, expect, it } from 'vitest'
import { construirDescubre } from './index.js'
import { adaptarResumen } from '../../services/descubreApi.js'
import { estaAbierto, notaDeComentarios } from '../fichaLocal.js'

/* Descubre con los locales REALES del backend local (VITE_API_URL, por
   defecto http://localhost:1234). Si el backend no está encendido, estos
   tests se saltan solos. Comprueba las reglas del feed a varias horas y
   deja en la consola un informe de qué sale en cada sitio. */

const API = (process.env.VITE_API_URL || 'http://localhost:1234').replace(/\/+$/, '')
let locales = []

beforeAll(async () => {
  try {
    const r = await fetch(`${API}/api/descubre/local/resumen`, { signal: AbortSignal.timeout(4000) })
    const cuerpo = await r.json()
    const datos = Array.isArray(cuerpo) ? cuerpo : (cuerpo.data ?? [])
    locales = datos.map(adaptarResumen)
  } catch {
    locales = []
  }
})

/* Martes 24-11-2026 a varias horas, y un lunes (casi todos cierran). */
const MOMENTOS = [
  ['martes 10:00', new Date(2026, 10, 24, 10, 0)],
  ['martes 21:00', new Date(2026, 10, 24, 21, 0)],
  ['lunes 12:00', new Date(2026, 10, 23, 12, 0)],
]

const nombre = (l) => l.localName

describe.each(MOMENTOS)('Descubre con datos reales · %s', (etiqueta, ahora) => {
  const feed = () => construirDescubre({ locales, ahora, semilla: 7 })

  it('ningún local se repite entre héroe, listas de arriba, abiertos y filas', () => {
    if (!locales.length) return
    const r = feed()
    const vistos = new Map()
    const apuntar = (donde, lista) =>
      lista.forEach((l) => {
        expect(vistos.get(l.id), `${nombre(l)} sale en ${vistos.get(l.id)} y en ${donde}`).toBeUndefined()
        vistos.set(l.id, donde)
      })
    apuntar('héroe', r.heroLista)
    r.bloques.filter((b) => b.tipo === 'lista' && !b.clave.startsWith('mas-')).forEach((b) => apuntar(b.clave, b.items))
    apuntar('abiertos', r.abiertos)
    r.bloques.filter((b) => b.tipo === 'rail' && b.clave !== 'cerca').forEach((b) => apuntar(b.clave, b.items))
  })

  it('«Puedes ir ahora mismo» solo tiene locales abiertos de verdad', () => {
    if (!locales.length) return
    feed().abiertos.forEach((l) => expect(estaAbierto(l, ahora), nombre(l)).toBe(true))
  })

  it('«Mejor valorados» solo con opiniones y nota ≥ 4', () => {
    if (!locales.length) return
    const mejores = feed().bloques.find((b) => b.clave === 'mejores')
    mejores?.items.forEach((l) => {
      const { nota, cantidad } = notaDeComentarios(l)
      expect(cantidad, nombre(l)).toBeGreaterThan(0)
      expect(nota, nombre(l)).toBeGreaterThanOrEqual(4)
    })
  })

  it('toda fila sale con 3 locales o más y el «+» cuenta bien', () => {
    if (!locales.length) return
    feed()
      .bloques.filter((b) => b.tipo === 'rail')
      .forEach((b) => {
        expect(b.items.length, b.clave).toBeGreaterThanOrEqual(3)
        expect(b.todos.length, b.clave).toBeGreaterThanOrEqual(b.items.length)
      })
  })

  it('todos los locales salen en algún sitio del feed', () => {
    if (!locales.length) return
    const r = feed()
    const ids = new Set([...r.heroLista, ...r.abiertos, ...r.bloques.flatMap((b) => b.items ?? [])].map((l) => l.id))
    const fuera = locales.filter((l) => !ids.has(l.id)).map(nombre)
    expect(fuera).toEqual([])
  })

  it('informe', () => {
    if (!locales.length) return
    const r = feed()
    const lineas = [
      `\n=== ${etiqueta} · ${locales.length} locales ===`,
      `Héroe: ${r.heroLista.map(nombre).join(', ')}`,
      `Abiertos (${r.abiertos.length} de ${r.abiertosTodos.length}): ${r.abiertos.map(nombre).join(', ') || '—'}`,
      ...r.bloques.map((b) =>
        b.tipo === 'cerca-cta'
          ? `[fila]  ${b.titulo}: (pide la ubicación)`
          : `${b.tipo === 'rail' ? '[fila] ' : '[lista]'} ${b.titulo ?? b.clave} (${b.items.length}${b.todos ? ` de ${b.todos.length}` : ''}): ${b.items.map(nombre).join(', ')}`,
      ),
    ]
    console.log(lineas.join('\n'))
  })
})
