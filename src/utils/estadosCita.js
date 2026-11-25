/* Una sola lista de estados para el cliente y para el dueño.
   0 pendiente  → la cita acaba de crearse; falta que el local acepte.
   1 por ti     → el local ya aceptó; falta que el cliente diga "voy pa allá".
   2 confirmada → los dos confirmaron.
   3 cancelada  → la canceló el cliente, el local, o se venció un plazo.
   4 propuesta  → el local no puede a esa hora y propone otra; falta que el
                  cliente diga si le vale. Si dice que sí, pasa directo a
                  confirmada a la hora nueva (los dos ya están de acuerdo). */

export const PENDIENTE = 0
export const POR_TI = 1
export const CONFIRMADA = 2
export const CANCELADA = 3
export const HORA_PROPUESTA = 4

export const MINUTOS_PARA_CONFIRMAR = 15
/* El cliente tiene hasta 1 h antes de la hora nueva para contestar. Si la
   hora nueva está muy cerca, al menos media hora desde que se propuso (sin
   pasarse de la propia hora). */
export const MINUTOS_ANTES_PROPUESTA = 60
export const MINUTOS_MINIMOS_PROPUESTA = 30

export const ESTADOS_CITA = {
  [PENDIENTE]: { texto: 'Pendiente', textoDueno: 'Pendiente', clave: 'pendiente' },
  [POR_TI]: { texto: 'Por ti', textoDueno: 'Por cliente', clave: 'porTi' },
  [CONFIRMADA]: { texto: 'Confirmada', textoDueno: 'Confirmada', clave: 'confirmada' },
  [CANCELADA]: { texto: 'Cancelada', textoDueno: 'Cancelada', clave: 'cancelada' },
  [HORA_PROPUESTA]: { texto: 'Nueva hora', textoDueno: 'Hora propuesta', clave: 'propuesta' },
}

export function textoEstadoReserva(estado, { dueno = false } = {}) {
  const item = ESTADOS_CITA[estado] ?? ESTADOS_CITA[PENDIENTE]
  return dueno ? item.textoDueno : item.texto
}

export function claveEstadoReserva(estado) {
  return ESTADOS_CITA[estado]?.clave ?? 'pendiente'
}

/* Todavía cuenta como hueco ocupado del local (no está cancelada). */
export function estaViva(cita) {
  return cita.estadoReserva !== CANCELADA
}

function aFecha(fecha, horario) {
  return new Date(`${fecha}T${horario}:00`)
}

/** Hasta cuándo puede el cliente contestar a la hora propuesta (Date), o null. */
export function venceLaPropuesta(cita) {
  const p = cita?.propuesta
  if (!p?.fecha || !p?.horario) return null
  if (p.vence) return new Date(p.vence)
  const inicio = aFecha(p.fecha, p.horario).getTime()
  const propuestaEn = new Date(p.en ?? Date.now()).getTime()
  let limite = inicio - MINUTOS_ANTES_PROPUESTA * 60000
  const minimo = propuestaEn + MINUTOS_MINIMOS_PROPUESTA * 60000
  if (limite < minimo) limite = Math.min(minimo, inicio)
  return new Date(limite)
}

/* Pendientes que el dueño no aceptó en 15 min y propuestas que el cliente no
   contestó a tiempo pasan a canceladas. Devuelve el mismo array si no hubo
   cambios. El reloj del dueño cuenta desde `pendienteDesde` (si retiró una
   propuesta, vuelve a tener sus 15 min) o desde que se creó la cita. */
export function caducarPendientes(citas, ahora = new Date()) {
  const limite = MINUTOS_PARA_CONFIRMAR * 60 * 1000
  let hubo = false
  const next = citas.map((cita) => {
    if (cita.estadoReserva === HORA_PROPUESTA) {
      const vence = venceLaPropuesta(cita)
      if (!vence || ahora < vence) return cita
      hubo = true
      return { ...cita, estadoReserva: CANCELADA, canceladaEn: ahora.toISOString(), canceladaPor: 'sinRespuesta' }
    }
    const desde = cita.pendienteDesde ?? cita.creadaEn
    if (cita.estadoReserva !== PENDIENTE || !desde) return cita
    const creada = new Date(desde).getTime()
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

/* ---------- Mover la hora ----------
   Los tres pasos devuelven solo los cambios, para pintarlos al instante y
   mandarlos después a donde toque (servidor o localStorage). */

/** El local propone otra hora (puede ser otro día). La original no se toca hasta que el cliente acepte. */
export function cambiosProponerHora({ fecha, horario }, ahora = new Date()) {
  return {
    estadoReserva: HORA_PROPUESTA,
    propuesta: { fecha, horario, en: ahora.toISOString() },
  }
}

/** El local retira su propuesta: vuelve a pendiente con sus 15 min de nuevo. */
export function cambiosRetirarPropuesta(ahora = new Date()) {
  return { estadoReserva: PENDIENTE, propuesta: null, pendienteDesde: ahora.toISOString() }
}

/** «Me vale»: confirmada a la hora nueva. Se guarda la vieja por si hay que explicarlo. */
export function cambiosAceptarPropuesta(cita, ahora = new Date()) {
  const p = cita.propuesta
  return {
    estadoReserva: CONFIRMADA,
    fecha: p.fecha,
    horario: p.horario,
    horaAnterior: { fecha: cita.fecha, horario: cita.horario },
    propuesta: null,
    voyPaAlla: true,
    voyPaAllaEn: ahora.toISOString(),
  }
}
