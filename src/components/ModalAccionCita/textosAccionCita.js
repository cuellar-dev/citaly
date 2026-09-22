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

export function elegirTexto(lista) {
  return lista[Math.floor(Math.random() * lista.length)]
}
