import { addDays, format } from 'date-fns'
import { CANCELADA, CONFIRMADA, PENDIENTE, POR_TI } from '../utils/estadosCita.js'
import { codigoDia, turnosDelDia } from '../utils/fichaLocal.js'
import { cobroDeMesa, mesasDeLocal } from '../utils/mesas.js'

/* La agenda de prueba de un local de mesas (el ejemplo es Al Medio). Igual
   que la de Sara: hoy escrito a mano para que se vea de todo, y los días de
   alrededor generados sin azar. Cada reserva lleva su mesa y cuántos van. */

const DIAS_ATRAS = 7
const DIAS_ADELANTE = 13

const CLIENTES = [
  ['Camila Soto', '+53 5412 3390'],
  ['Luis Herrera', '+53 5288 1145'],
  ['Yania Cruz', '+53 5367 9902'],
  ['Reinaldo Pupo', '+53 5340 2218'],
  ['Marisol Vega', '+53 5590 7431'],
  ['Alejandro Díaz', '+53 5221 0098'],
  ['Thalía Ramos', '+53 5318 6620'],
  ['Pedro Luis Gil', '+53 5476 3317'],
]

const LLENADO = [5, 7, 4, 6, 3, 7, 5, 4, 6, 2, 5, 3, 4, 2, 3, 1, 4, 2, 3, 2]

function hhmm(minutos) {
  return `${String(Math.floor(minutos / 60) % 24).padStart(2, '0')}:${String(minutos % 60).padStart(2, '0')}`
}

/** Arma una reserva con los datos de la mesa y lo que se cobra hoy en el local. */
export function reservaDeMesa(local, mesa, datos) {
  const { precio, consumoMinimo } = cobroDeMesa(local, mesa)
  const personas = datos.personas ?? mesa.capacidad
  return {
    esLugar: true,
    duracion: Number(local.intervaloMinutos) || 60,
    mesaId: mesa.id,
    personas,
    linea: `${mesa.codigo} · ${personas} ${personas === 1 ? 'persona' : 'personas'}`,
    detalle: [mesa.ubicacion, consumoMinimo ? `consumo mínimo ${consumoMinimo} CUP` : null].filter(Boolean).join(' · '),
    precio,
    /* Para el "Estimado" del día: si la reserva es gratis, cuenta lo que se
       compromete a gastar. */
    estimado: precio || consumoMinimo,
    ...datos,
  }
}

function reservasHoy(local, fecha, creadaEn, mesas) {
  const m = (id) => mesas.find((x) => x.id === id) ?? mesas[0]
  const base = { fecha, creadaEn }
  const r = (id, mesaId, datos) => reservaDeMesa(local, m(mesaId), { ...base, id, ...datos })
  return [
    r('mesa-hoy-1', 'm-2', { horario: '12:00', cliente: 'Camila Soto', telefono: '+53 5412 3390', personas: 2, estadoReserva: CONFIRMADA }),
    r('mesa-hoy-2', 'm-7', { horario: '13:00', cliente: 'Luis Herrera', telefono: '+53 5288 1145', personas: 6, estadoReserva: CONFIRMADA }),
    r('mesa-hoy-3', 'm-4', { horario: '13:00', cliente: 'Yania Cruz', telefono: '+53 5367 9902', personas: 3, estadoReserva: CANCELADA }),
    r('mesa-hoy-4', 'm-6', { horario: '14:00', cliente: 'Reinaldo Pupo', telefono: '+53 5340 2218', personas: 4, estadoReserva: POR_TI }),
    r('mesa-hoy-5', 'm-3', { horario: '19:00', cliente: 'Marisol Vega', telefono: '+53 5590 7431', personas: 2, estadoReserva: PENDIENTE }),
    r('mesa-hoy-6', 'm-5', { horario: '20:00', cliente: 'Alejandro Díaz', telefono: '+53 5221 0098', personas: 4, estadoReserva: CONFIRMADA }),
    r('mesa-hoy-7', 'm-7', { horario: '20:00', cliente: 'Thalía Ramos', telefono: '+53 5318 6620', personas: 5, estadoReserva: POR_TI }),
    r('mesa-hoy-8', 'm-2', { horario: '20:00', cliente: 'Pedro Luis Gil', personas: 2, estadoReserva: PENDIENTE }),
  ]
}

function estadoDe(offset, i) {
  if ((offset * 3 + i) % 7 === 0) return CANCELADA
  if (offset < 0) return CONFIRMADA
  if (offset === 1 && i === 0) return PENDIENTE
  if (offset <= 3 && i % 3 === 1) return POR_TI
  return CONFIRMADA
}

export function reservasMesaDemo(local, hoy = new Date()) {
  const creadaEn = hoy.toISOString()
  const mesas = mesasDeLocal(local).filter((m) => m.online)
  const turnos = turnosDelDia(local.horarioApertura, local.horarioCierre, local.intervaloMinutos)
  const reservas = reservasHoy(local, format(hoy, 'yyyy-MM-dd'), creadaEn, mesas)

  for (let offset = -DIAS_ATRAS; offset <= DIAS_ADELANTE; offset++) {
    if (offset === 0) continue
    const dia = addDays(hoy, offset)
    if (!local.dias?.includes(codigoDia(dia))) continue
    const fecha = format(dia, 'yyyy-MM-dd')
    const cuantas = LLENADO[Math.abs(offset) % LLENADO.length]
    for (let i = 0; i < cuantas; i++) {
      /* Mesa y turno distintos en cada vuelta: nunca dos reservas en la
         misma mesa a la misma hora. */
      const mesa = mesas[(i + Math.abs(offset)) % mesas.length]
      const turno = turnos[(i * 2 + Math.abs(offset)) % turnos.length]
      const [cliente, telefono] = CLIENTES[(i + Math.abs(offset) * 3) % CLIENTES.length]
      reservas.push(
        reservaDeMesa(local, mesa, {
          id: `mesa-d${offset}-${i}`,
          fecha,
          horario: hhmm(turno),
          cliente,
          telefono,
          personas: Math.max(1, mesa.capacidad - (i % 2)),
          estadoReserva: estadoDe(offset, i),
          creadaEn,
        }),
      )
    }
  }
  return reservas
}

export { DIAS_ATRAS, DIAS_ADELANTE }
