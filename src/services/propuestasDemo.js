import { getCitas, saveCitas } from './storage.js'
import { HORA_PROPUESTA } from '../utils/estadosCita.js'

/* Solo para la demo (sin backend). La agenda del dueño y las citas del cliente
   son datos separados, así que una propuesta hecha en Mi Negocio no llegaría
   nunca a Mis citas. Este puente copia la cita propuesta a las citas de este
   navegador para poder probar el camino entero: proponer en Mi Negocio y
   aceptar o cancelar en Mis citas. Con backend no se usa: la cita es la misma
   fila para los dos y el servidor manda la notificación. */

const idCliente = (local, cita) => `neg-${local.id}-${cita.id}`

function comoCitaDelCliente(local, cita, propuesta) {
  const base = {
    id: idCliente(local, cita),
    localId: local.id,
    localNombre: local.localName ?? local.nombre ?? '',
    fecha: cita.fecha,
    horario: cita.horario,
    creadaEn: cita.creadaEn ?? new Date().toISOString(),
    estadoReserva: HORA_PROPUESTA,
    propuesta,
    deDemoNegocio: true,
  }
  if (cita.esLugar) {
    return { ...base, esLugar: true, personas: cita.personas ?? null, precioReserva: cita.precio ?? 0, mesa: { id: cita.mesaId ?? null } }
  }
  return {
    ...base,
    esLugar: false,
    precioTotal: cita.precio ?? 0,
    servicios: [{ id: 'demo', nombre: cita.linea ?? 'Servicio', precio: cita.precio ?? 0, duracion: cita.duracion ?? 0 }],
  }
}

export function reflejarPropuestaDemo(local, cita, propuesta) {
  const id = idCliente(local, cita)
  const resto = getCitas().filter((c) => c.id !== id)
  saveCitas([...resto, comoCitaDelCliente(local, cita, propuesta)])
}

/** El dueño retiró la propuesta: la copia del cliente desaparece si aún no contestó. */
export function quitarPropuestaDemo(local, cita) {
  const id = idCliente(local, cita)
  saveCitas(getCitas().filter((c) => !(c.id === id && c.estadoReserva === HORA_PROPUESTA)))
}
