import { addDays, format } from 'date-fns'
import { CANCELADA, CONFIRMADA, PENDIENTE, POR_TI } from '../utils/estadosCita.js'
import { codigoDia, turnosDelDia } from '../utils/fichaLocal.js'

/* La agenda de prueba del dueño: las citas de hoy, escritas a mano para que
   se vea de todo (pendiente, por confirmar, cancelada, en curso), y las de
   los días de alrededor, generadas para poder moverse por la semana.

   Solo hay citas en los días que abre el local, y caen en sus turnos reales.
   Se generan siempre igual (sin azar), así la demo no cambia al recargar. */

const DIAS_ATRAS = 7
const DIAS_ADELANTE = 13

const CLIENTES = [
  ['Lisandra Pérez', '+53 5412 9083'],
  ['Yosvany Morales', '+53 5284 1802'],
  ['Dayana Ruiz', '+53 5367 2241'],
  ['Gretel Rodríguez', '+53 5340 7711'],
  ['Ernesto Báez', '+53 5590 1276'],
  ['Mairelys Soto', '+53 5221 6604'],
  ['Adrián Castro', '+53 5318 4420'],
  ['Yaimí León', '+53 5476 0915'],
  ['Osmany Delgado', '+53 5263 7781'],
  ['Claudia Fonseca', '+53 5390 2246'],
]

const SERVICIOS = [
  { linea: 'Corte caballero', duracion: 30, precio: 300 },
  { linea: 'Corte dama', duracion: 45, precio: 450 },
  { linea: 'Manicura', duracion: 40, precio: 250 },
  { linea: 'Tinte completo', duracion: 120, precio: 1200 },
]

/* Cuántas citas hay cada día, según lo lejos que esté de hoy. Los días
   próximos van más llenos que los lejanos, como en una agenda de verdad. */
const LLENADO = [4, 6, 3, 5, 2, 6, 4, 3, 5, 1, 4, 2, 3, 1, 2, 0, 3, 1, 2, 1]

function hhmm(minutos) {
  return `${String(Math.floor(minutos / 60)).padStart(2, '0')}:${String(minutos % 60).padStart(2, '0')}`
}

function citasHoy(fecha, creadaEn) {
  const base = { fecha, esLugar: false, creadaEn }
  return [
    { ...base, id: 'hoy-1', horario: '09:00', cliente: 'Lisandra Pérez', telefono: '+53 5412 9083', linea: 'Manicura', duracion: 40, precio: 250, estadoReserva: PENDIENTE },
    { ...base, id: 'hoy-2', horario: '10:30', cliente: 'Yosvany Morales', telefono: '+53 5284 1802', linea: 'Corte caballero', duracion: 30, precio: 300, estadoReserva: CONFIRMADA },
    { ...base, id: 'hoy-3', horario: '10:30', cliente: 'Dayana Ruiz', telefono: '+53 5367 2241', linea: 'Tinte completo', duracion: 120, precio: 1200, estadoReserva: POR_TI },
    { ...base, id: 'hoy-4', horario: '12:00', cliente: 'Gretel Rodríguez', telefono: '+53 5340 7711', linea: 'Corte dama', duracion: 45, precio: 450, estadoReserva: PENDIENTE },
    { ...base, id: 'hoy-5', horario: '13:30', cliente: 'Ernesto Báez', telefono: '+53 5590 1276', linea: 'Corte caballero', duracion: 30, precio: 300, estadoReserva: CANCELADA },
    { ...base, id: 'hoy-6', horario: '15:00', cliente: 'Dr. Carlos V.', linea: 'Corte caballero', duracion: 30, precio: 300, estadoReserva: CONFIRMADA },
    { ...base, id: 'hoy-7', horario: '16:30', cliente: 'Mairelys Soto', telefono: '+53 5221 6604', linea: 'Corte dama', duracion: 45, precio: 450, estadoReserva: POR_TI },
  ]
}

/* Estado de una cita generada. Las pasadas ya se atendieron (salvo alguna
   cancelada); las futuras están casi todas confirmadas, mañana con alguna
   aún por cerrar. */
function estadoDe(offset, i) {
  if ((offset * 3 + i) % 7 === 0) return CANCELADA
  if (offset < 0) return CONFIRMADA
  if (offset === 1 && i === 0) return PENDIENTE
  if (offset <= 3 && i % 3 === 1) return POR_TI
  return CONFIRMADA
}

export function citasNegocioDemo(local, hoy = new Date()) {
  const creadaEn = hoy.toISOString()
  const turnos = turnosDelDia(local.horarioApertura, local.horarioCierre, local.intervaloMinutos)
  const citas = citasHoy(format(hoy, 'yyyy-MM-dd'), creadaEn)

  for (let offset = -DIAS_ATRAS; offset <= DIAS_ADELANTE; offset++) {
    if (offset === 0) continue
    const dia = addDays(hoy, offset)
    if (!local.dias?.includes(codigoDia(dia))) continue
    const fecha = format(dia, 'yyyy-MM-dd')
    const cuantas = Math.min(LLENADO[Math.abs(offset) % LLENADO.length], turnos.length)
    for (let i = 0; i < cuantas; i++) {
      /* Cada día arranca en un turno distinto, y nunca repite turno. */
      const turno = turnos[(i + Math.abs(offset)) % turnos.length]
      const [cliente, telefono] = CLIENTES[(i + Math.abs(offset) * 3) % CLIENTES.length]
      const servicio = SERVICIOS[(i + offset + 8) % SERVICIOS.length]
      citas.push({
        id: `d${offset}-${i}`,
        fecha,
        horario: hhmm(turno),
        cliente,
        telefono,
        esLugar: false,
        ...servicio,
        estadoReserva: estadoDe(offset, i),
        creadaEn,
      })
    }
  }
  return citas
}

export { DIAS_ATRAS, DIAS_ADELANTE }
