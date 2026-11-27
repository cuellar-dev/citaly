import { describe, expect, it } from 'vitest'
import { generarHorarios } from './reservaHorarios.js'

describe('generarHorarios', () => {
  it('va de intervalo en intervalo desde la apertura', () => {
    expect(generarHorarios('09:00', '11:00', 30)).toEqual(['09:00', '09:30', '10:00', '10:30'])
  })

  it('el último turno acaba como muy tarde al cierre (igual que el backend)', () => {
    expect(generarHorarios('08:00', '17:30', 60).at(-1)).toBe('16:00')
    expect(generarHorarios('09:00', '18:15', 30).at(-1)).toBe('17:30')
  })

  it('sin intervalo, turnos de una hora', () => {
    expect(generarHorarios('09:00', '11:00')).toEqual(['09:00', '10:00'])
  })
})
