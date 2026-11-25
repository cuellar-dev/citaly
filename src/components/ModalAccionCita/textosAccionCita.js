/* Copys cortos: caben en dos botones de recibo sin partir el layout.
   Sin tildes a proposito (Merchant Copy). */

export const TEXTOS_VOY = {
  aviso:
    'Al tocar en este boton le confirmas al dueno tu ida y evitas mensajes por via WhatsApp. Te pedimos encarecidamente que solo lo toques si realmente iras.',
  si: [
    'Ya se, si ire',
    'En serio, voy',
    'Cuenten conmigo',
    'Ahi estare',
    'Hoy no falto',
    'Voy de verdad',
  ],
  no: ['Mejor no', 'Aun no', 'Lo pienso', 'Despues'],
}

export const TEXTOS_CANCELAR = {
  aviso:
    'Si cancelas y te arrepientes, puede que pierdas el hueco: el local no tiene por que guardartelo. Seguro que quieres cancelar?',
  si: ['Si, cancelo', 'Borra la cita', 'La suelto', 'Cancelo igual'],
  no: ['Me quedo', 'La dejo', 'No, espera', 'Sigue viva'],
}

export const TEXTOS_ACEPTAR_HORA = {
  aviso:
    'Al aceptar, tu cita queda confirmada a la hora nueva y el local te espera. Toca solo si de verdad iras a esa hora.',
  si: ['Me vale, ire', 'Esa me sirve', 'Trato hecho', 'Ahi estare'],
  no: ['Lo pienso', 'Aun no', 'Despues'],
}

export const TEXTOS_OTRA_HORA = {
  aviso:
    'Soltamos esta cita y te llevamos a elegir otra hora en este local. El local vera tu nueva reserva como pendiente.',
  si: ['Busco otra', 'Vamos a ver', 'A elegir'],
  no: ['Me quedo', 'Espera', 'Mejor no'],
}

/* Cada acción con su paquete de textos y sus títulos. */
export const ACCIONES_CITA = {
  voy: { pack: TEXTOS_VOY, eyebrow: 'Confirmas que vas', titulo: () => 'Voy pa alla', peligro: false },
  cancelar: {
    pack: TEXTOS_CANCELAR,
    eyebrow: 'Antes de soltarla',
    titulo: (esMesa) => (esMesa ? 'Cancelar la mesa' : 'Cancelar la cita'),
    peligro: true,
  },
  aceptarHora: { pack: TEXTOS_ACEPTAR_HORA, eyebrow: 'La hora nueva', titulo: () => 'Me vale', peligro: false },
  otraHora: { pack: TEXTOS_OTRA_HORA, eyebrow: 'Antes de soltarla', titulo: () => 'Busco otra hora', peligro: true },
}

export function elegirTexto(lista) {
  return lista[Math.floor(Math.random() * lista.length)]
}
