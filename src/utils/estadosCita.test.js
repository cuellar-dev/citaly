import { describe, expect, it } from 'vitest'
import {
  CANCELADA,
  CONFIRMADA,
  HORA_PROPUESTA,
  PENDIENTE,
  caducarPendientes,
  cambiosAceptarPropuesta,
  cambiosProponerHora,
  cambiosRetirarPropuesta,
  venceLaPropuesta,
} from './estadosCita.js'

const cita = { id: 'c1', fecha: '2026-11-25', horario: '15:00', estadoReserva: PENDIENTE, creadaEn: '2026-11-25T10:00:00' }

describe('proponer otra hora', () => {
  it('deja la cita en «hora propuesta» sin tocar la hora original', () => {
    const c = { ...cita, ...cambiosProponerHora({ fecha: '2026-11-25', horario: '16:30' }, new Date('2026-11-25T10:05:00')) }
    expect(c.estadoReserva).toBe(HORA_PROPUESTA)
    expect(c.horario).toBe('15:00')
    expect(c.propuesta).toMatchObject({ fecha: '2026-11-25', horario: '16:30' })
  })

  it('al aceptar pasa a confirmada a la hora nueva y recuerda la vieja', () => {
    const c = { ...cita, ...cambiosProponerHora({ fecha: '2026-11-26', horario: '09:00' }) }
    const hecha = { ...c, ...cambiosAceptarPropuesta(c) }
    expect(hecha).toMatchObject({ estadoReserva: CONFIRMADA, fecha: '2026-11-26', horario: '09:00', propuesta: null })
    expect(hecha.horaAnterior).toEqual({ fecha: '2026-11-25', horario: '15:00' })
  })

  it('retirarla devuelve la pendiente con sus 15 min de nuevo', () => {
    const ahora = new Date('2026-11-25T11:00:00')
    const c = { ...cita, ...cambiosRetirarPropuesta(ahora) }
    expect(c.estadoReserva).toBe(PENDIENTE)
    expect(caducarPendientes([c], new Date('2026-11-25T11:10:00'))[0].estadoReserva).toBe(PENDIENTE)
    expect(caducarPendientes([c], new Date('2026-11-25T11:16:00'))[0].estadoReserva).toBe(CANCELADA)
  })
})

describe('plazo del cliente para contestar', () => {
  it('vence 1 h antes de la hora nueva', () => {
    const c = { propuesta: { fecha: '2026-11-25', horario: '16:30', en: '2026-11-25T10:00:00' } }
    expect(venceLaPropuesta(c)).toEqual(new Date('2026-11-25T15:30:00'))
  })

  it('si la hora nueva está muy cerca, da al menos media hora', () => {
    const c = { propuesta: { fecha: '2026-11-25', horario: '11:00', en: '2026-11-25T10:15:00' } }
    expect(venceLaPropuesta(c)).toEqual(new Date('2026-11-25T10:45:00'))
  })

  it('nunca pasa de la propia hora propuesta', () => {
    const c = { propuesta: { fecha: '2026-11-25', horario: '10:30', en: '2026-11-25T10:15:00' } }
    expect(venceLaPropuesta(c)).toEqual(new Date('2026-11-25T10:30:00'))
  })

  it('sin respuesta a tiempo, se cancela sola', () => {
    const c = { ...cita, estadoReserva: HORA_PROPUESTA, propuesta: { fecha: '2026-11-25', horario: '16:30', en: '2026-11-25T10:00:00' } }
    expect(caducarPendientes([c], new Date('2026-11-25T15:00:00'))[0].estadoReserva).toBe(HORA_PROPUESTA)
    const vencida = caducarPendientes([c], new Date('2026-11-25T15:31:00'))[0]
    expect(vencida).toMatchObject({ estadoReserva: CANCELADA, canceladaPor: 'sinRespuesta' })
  })

  it('mientras espera respuesta, el reloj de 15 min del dueño no corre', () => {
    const c = { ...cita, estadoReserva: HORA_PROPUESTA, propuesta: { fecha: '2026-11-25', horario: '16:30', en: '2026-11-25T10:05:00' } }
    expect(caducarPendientes([c], new Date('2026-11-25T11:00:00'))[0].estadoReserva).toBe(HORA_PROPUESTA)
  })
})
