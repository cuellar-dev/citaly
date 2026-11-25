import { describe, expect, it } from 'vitest'
import { hayAlgoAbierto, puedeActualizarAhora, rutaDelicada } from './momentoActualizar.js'

const doc = ({ etiqueta, editable = false, dialogo = false } = {}) => ({
  activeElement: etiqueta ? { tagName: etiqueta, isContentEditable: editable } : null,
  querySelector: () => (dialogo ? {} : null),
})

describe('rutaDelicada', () => {
  it.each(['/auth', '/negocio/nuevo', '/negocio/plano/3', '/local/energym/reservar', '/local/x/reservar-cita', '/local/x/unirse', '/perfil', '/opinion', '/ayuda'])(
    '%s es delicada',
    (ruta) => expect(rutaDelicada(ruta)).toBe(true),
  )
  it.each(['/', '/buscar', '/buscar/seccion/cerca', '/local/energym', '/favoritos', '/citas', '/notificaciones', '/terminos'])(
    '%s no lo es',
    (ruta) => expect(rutaDelicada(ruta)).toBe(false),
  )
})

describe('puedeActualizarAhora', () => {
  it('sí, en una ficha sin nada abierto', () => {
    expect(puedeActualizarAhora('/local/energym', doc())).toBe(true)
  })
  it('no, en una reserva', () => {
    expect(puedeActualizarAhora('/local/energym/reservar', doc())).toBe(false)
  })
  it('no, con un campo enfocado o un diálogo abierto', () => {
    expect(hayAlgoAbierto(doc({ etiqueta: 'INPUT' }))).toBe(true)
    expect(hayAlgoAbierto(doc({ etiqueta: 'DIV', editable: true }))).toBe(true)
    expect(puedeActualizarAhora('/', doc({ dialogo: true }))).toBe(false)
  })
})
