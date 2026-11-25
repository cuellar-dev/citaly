import { describe, expect, it } from 'vitest'
import { buscarLocales, coincideFiltros, filtrosIniciales } from './busqueda.js'
import { situacionSocio, textoSituacion } from './socios.js'

const locales = [
  { id: 1, localName: 'Café del Parque', categoria: 'Cafetería' },
  { id: 2, localName: 'La Esquina Verde', categoria: 'Restaurante' },
  { id: 3, localName: 'Verde Vivo', categoria: 'Comida saludable' },
]

describe('buscarLocales', () => {
  it('ignora tildes y mayúsculas', () => {
    expect(buscarLocales(locales, 'CAFE').map((l) => l.id)).toEqual([1])
  })

  it('lo que empieza por el texto va antes que lo que lo contiene', () => {
    expect(buscarLocales(locales, 'verde').map((l) => l.id)).toEqual([3, 2])
  })

  it('con varias palabras tienen que estar todas', () => {
    expect(buscarLocales(locales, 'esquina verde').map((l) => l.id)).toEqual([2])
    expect(buscarLocales(locales, 'esquina parque')).toEqual([])
  })

  it('sin texto devuelve todo', () => {
    expect(buscarLocales(locales, '  ')).toHaveLength(3)
  })
})

describe('coincideFiltros', () => {
  it('el filtro de nota usa la misma nota que la tarjeta', () => {
    const local = { comentarios: [{ calificacion: 4 }, { calificacion: 4 }] }
    expect(coincideFiltros(local, { ...filtrosIniciales, rating: '4.5' })).toBe(false)
    expect(coincideFiltros(local, { ...filtrosIniciales, rating: '4' })).toBe(true)
  })
})

describe('situacionSocio (cuotas de gimnasio y cursos)', () => {
  const local = { planes: [{ id: 'p', precio: 1000 }], recargo: { porDia: 50, diasGracia: 2, tope: 300 } }
  const hoy = new Date(2026, 10, 24)
  const socio = (proximoPago) => ({ planId: 'p', estado: 'activo', proximoPago })

  it('al día y por vencer', () => {
    expect(situacionSocio(socio('2026-12-10'), local, hoy).clave).toBe('al-dia')
    expect(situacionSocio(socio('2026-11-26'), local, hoy).clave).toBe('por-vencer')
  })

  it('en los días de gracia no se cobra recargo', () => {
    const s = situacionSocio(socio('2026-11-22'), local, hoy)
    expect(s).toMatchObject({ clave: 'gracia', recargo: 0, total: 1000 })
    expect(textoSituacion(s)).toBe('2 días tarde · sin recargo aún')
  })

  it('pasada la gracia cobra por día, con tope', () => {
    expect(situacionSocio(socio('2026-11-19'), local, hoy)).toMatchObject({ clave: 'atrasado', recargo: 150, total: 1150 })
    expect(situacionSocio(socio('2026-10-01'), local, hoy).recargo).toBe(300)
  })

  it('una solicitud no debe nada todavía de recargo', () => {
    expect(situacionSocio({ ...socio('2026-01-01'), estado: 'solicitud' }, local, hoy)).toMatchObject({ recargo: 0 })
  })
})
