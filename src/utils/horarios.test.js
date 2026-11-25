import { describe, expect, it } from 'vitest'
import { estaAbierto, notaDeComentarios } from './fichaLocal.js'
import { estadoApertura, proximaAperturaFecha } from './descubre.js'

/* Horarios: lo que decide «Abierto / Cerrado», el aviso de apertura y la
   fila «Puedes ir ahora mismo». Fechas fijas en hora local:
   24-11-2026 es martes ('m'), 23-11-2026 lunes ('l'). */
const martes = (h, m = 0) => new Date(2026, 10, 24, h, m)
const lunes = (h, m = 0) => new Date(2026, 10, 23, h, m)

const cafe = { horarioApertura: '07:00', horarioCierre: '20:00', dias: ['l', 'm', 'x', 'j', 'v', 's', 'd'] }
const bar = { horarioApertura: '18:00', horarioCierre: '01:00', dias: ['m', 'x', 'j', 'v', 's', 'd'] }

describe('estaAbierto', () => {
  it('abierto dentro del horario y cerrado fuera', () => {
    expect(estaAbierto(cafe, martes(10))).toBe(true)
    expect(estaAbierto(cafe, martes(6, 59))).toBe(false)
    expect(estaAbierto(cafe, martes(20))).toBe(false)
  })

  it('un bar que cierra a la 1:00 sigue abierto a medianoche', () => {
    expect(estaAbierto(bar, martes(23, 30))).toBe(true)
    expect(estaAbierto(bar, martes(17, 59))).toBe(false)
  })

  it('cerrado el día que no abre', () => {
    expect(estaAbierto(bar, lunes(20))).toBe(false)
  })

  it('sin horario cuenta como cerrado', () => {
    expect(estaAbierto({}, martes(10))).toBe(false)
  })
})

describe('estadoApertura y aviso de apertura', () => {
  it('antes de abrir: «abre a las 7:00 AM» y el aviso cae hoy a esa hora', () => {
    const ahora = martes(6)
    expect(estadoApertura(cafe, ahora).detalle).toBe('abre a las 7:00 AM')
    expect(proximaAperturaFecha(cafe, ahora)).toEqual(martes(7))
  })

  it('después de cerrar: el aviso cae mañana', () => {
    const f = proximaAperturaFecha(cafe, martes(21))
    expect(f).toEqual(new Date(2026, 10, 25, 7, 0))
  })

  it('salta los días que no abre', () => {
    const soloSabado = { ...cafe, dias: ['s'] }
    expect(proximaAperturaFecha(soloSabado, martes(21))).toEqual(new Date(2026, 10, 28, 7, 0))
  })

  it('sin horario no hay aviso posible', () => {
    expect(proximaAperturaFecha({}, martes(10))).toBeNull()
  })
})

describe('notaDeComentarios', () => {
  it('media redondeada a un decimal', () => {
    const local = { comentarios: [{ calificacion: 5 }, { calificacion: 4 }, { calificacion: 4 }] }
    expect(notaDeComentarios(local)).toEqual({ nota: 4.3, cantidad: 3 })
  })

  it('los del backend traen la nota ya contada', () => {
    expect(notaDeComentarios({ notaResumen: 4.66, opinionesResumen: 9 })).toEqual({ nota: 4.7, cantidad: 9 })
  })

  it('sin opiniones: 0 y 0', () => {
    expect(notaDeComentarios({})).toEqual({ nota: 0, cantidad: 0 })
  })
})
