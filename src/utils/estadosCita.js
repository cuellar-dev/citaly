/* Una sola lista de estados para el cliente y para el dueño.
   0 pendiente  → la cita acaba de crearse; falta que el local acepte.
   1 por ti     → el local ya aceptó; falta que el cliente diga "voy pa allá".
   2 confirmada → los dos confirmaron.
   3 cancelada  → la canceló el cliente, el local, o se venció el plazo del dueño. */

export const PENDIENTE = 0
export const POR_TI = 1
export const CONFIRMADA = 2
export const CANCELADA = 3

export const MINUTOS_PARA_CONFIRMAR = 15

export const ESTADOS_CITA = {
  [PENDIENTE]: { texto: 'Pendiente', clave: 'pendiente' },
  [POR_TI]: { texto: 'Por ti', clave: 'porTi' },
  [CONFIRMADA]: { texto: 'Confirmada', clave: 'confirmada' },
  [CANCELADA]: { texto: 'Cancelada', clave: 'cancelada' },
}

export function textoEstadoReserva(estado) {
  return ESTADOS_CITA[estado]?.texto ?? ESTADOS_CITA[PENDIENTE].texto
}

export function claveEstadoReserva(estado) {
  return ESTADOS_CITA[estado]?.clave ?? 'pendiente'
}

/* Si el dueño no acepta una pendiente en 15 min, pasa a cancelada.
   Devuelve el mismo array si no hubo cambios. */
export function caducarPendientes(citas, ahora = new Date()) {
  const limite = MINUTOS_PARA_CONFIRMAR * 60 * 1000
  let hubo = false
  const next = citas.map((cita) => {
    if (cita.estadoReserva !== PENDIENTE || !cita.creadaEn) return cita
    const creada = new Date(cita.creadaEn).getTime()
    if (Number.isNaN(creada) || ahora.getTime() - creada < limite) return cita
    hubo = true
    return {
      ...cita,
      estadoReserva: CANCELADA,
      canceladaEn: ahora.toISOString(),
      canceladaPor: 'tiempo',
    }
  })
  return hubo ? next : citas
}
