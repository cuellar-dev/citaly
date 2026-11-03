import { CANCELADA, CONFIRMADA, PENDIENTE, POR_TI } from './estadosCita.js'

/*
  Cómo se calculará con citas reales (getCitas() del cliente):

  idas        = confirmadas cuya fecha+hora de turno ya pasó
                (asistió: estado CONFIRMADA && instanteTurno < ahora)
  canceladas  = estado CANCELADA (el cliente, el local o el plazo de 15 min)
  enCurso     = PENDIENTE o POR_TI, o CONFIRMADA con turno todavía por delante
  promedioMes = idas de los últimos 12 meses / 12
                (si no hay historial, 0; no se divide solo por meses con cita
                para no inflar al usuario nuevo)
  puntualidad = % de idas en las que llegó a tiempo
                (cuando exista `llegadaEn`: llegadaEn <= instanteTurno)
  masVisitado = localId con más idas; empate → el más reciente

  Hasta que el backend entregue ese historial, `statsCitasPerfil()` usa el mock.
*/

const MOCK_CITAS = [
  { estadoReserva: CONFIRMADA, fecha: '2026-01-08', hora: '10:00', localId: 'sara', llegadaEn: '2026-01-08T09:52:00' },
  { estadoReserva: CONFIRMADA, fecha: '2026-01-22', hora: '16:30', localId: 'sara', llegadaEn: '2026-01-22T16:31:00' },
  { estadoReserva: CONFIRMADA, fecha: '2026-02-14', hora: '11:00', localId: 'sara', llegadaEn: '2026-02-14T10:55:00' },
  { estadoReserva: CONFIRMADA, fecha: '2026-03-03', hora: '09:00', localId: 'al-medio-1', llegadaEn: '2026-03-03T09:00:00' },
  { estadoReserva: CONFIRMADA, fecha: '2026-04-19', hora: '18:00', localId: 'sara', llegadaEn: '2026-04-19T18:12:00' },
  { estadoReserva: CONFIRMADA, fecha: '2026-05-11', hora: '12:00', localId: 'sara', llegadaEn: '2026-05-11T11:58:00' },
  { estadoReserva: CONFIRMADA, fecha: '2026-06-02', hora: '15:00', localId: 'sara', llegadaEn: '2026-06-02T14:50:00' },
  { estadoReserva: CONFIRMADA, fecha: '2026-07-20', hora: '10:30', localId: 'sara', llegadaEn: '2026-07-20T10:29:00' },
  { estadoReserva: CONFIRMADA, fecha: '2026-08-09', hora: '17:00', localId: 'al-medio-1', llegadaEn: '2026-08-09T16:40:00' },
  { estadoReserva: CONFIRMADA, fecha: '2026-09-15', hora: '11:30', localId: 'sara', llegadaEn: '2026-09-15T11:30:00' },
  { estadoReserva: CONFIRMADA, fecha: '2026-10-04', hora: '13:00', localId: 'sara', llegadaEn: '2026-10-04T13:04:00' },
  { estadoReserva: CONFIRMADA, fecha: '2026-10-28', hora: '09:30', localId: 'sara', llegadaEn: '2026-10-28T09:20:00' },
  { estadoReserva: CANCELADA, fecha: '2026-02-01', hora: '10:00', localId: 'sara' },
  { estadoReserva: CANCELADA, fecha: '2026-05-30', hora: '19:00', localId: 'al-medio-1' },
  { estadoReserva: CANCELADA, fecha: '2026-09-02', hora: '08:00', localId: 'sara' },
  { estadoReserva: PENDIENTE, fecha: '2026-11-08', hora: '11:00', localId: 'sara' },
  { estadoReserva: POR_TI, fecha: '2026-11-12', hora: '16:00', localId: 'sara' },
]

function instanteTurno(cita) {
  const t = new Date(`${cita.fecha}T${cita.hora || '12:00'}:00`)
  return Number.isNaN(t.getTime()) ? null : t
}

export function estadisticasCitasCliente(citas, ahora = new Date()) {
  const idas = citas.filter((c) => {
    if (c.estadoReserva !== CONFIRMADA) return false
    const t = instanteTurno(c)
    return t && t.getTime() < ahora.getTime()
  })
  const canceladas = citas.filter((c) => c.estadoReserva === CANCELADA)
  const enCurso = citas.filter((c) => {
    if (c.estadoReserva === PENDIENTE || c.estadoReserva === POR_TI) return true
    if (c.estadoReserva !== CONFIRMADA) return false
    const t = instanteTurno(c)
    return t && t.getTime() >= ahora.getTime()
  })

  const haceUnAnio = new Date(ahora)
  haceUnAnio.setMonth(haceUnAnio.getMonth() - 12)
  const idasAnio = idas.filter((c) => {
    const t = instanteTurno(c)
    return t && t >= haceUnAnio
  })
  const promedioMes = Math.round((idasAnio.length / 12) * 10) / 10

  const conLlegada = idas.filter((c) => c.llegadaEn && instanteTurno(c))
  const aTiempo = conLlegada.filter((c) => new Date(c.llegadaEn).getTime() <= instanteTurno(c).getTime())
  const puntualidad = conLlegada.length ? Math.round((aTiempo.length / conLlegada.length) * 100) : null

  const porLocal = new Map()
  idas.forEach((c) => porLocal.set(c.localId, (porLocal.get(c.localId) || 0) + 1))
  let masVisitadoId = null
  let masVisitas = 0
  porLocal.forEach((n, id) => {
    if (n >= masVisitas) {
      masVisitadoId = id
      masVisitas = n
    }
  })

  return {
    idas: idas.length,
    canceladas: canceladas.length,
    enCurso: enCurso.length,
    promedioMes,
    puntualidad,
    masVisitadoId,
    masVisitas,
  }
}

export function statsCitasPerfil() {
  return estadisticasCitasCliente(MOCK_CITAS)
}
