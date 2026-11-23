import { addDays, format } from 'date-fns'
import { pedir } from './api.js'

/* Reservar contra el backend:

     GET  /api/local/:id/horas-ocupadas?desde=&hasta=   horas ya tomadas (sin datos de nadie)
     POST /api/citas/servicios                          { local_id, fecha, horario, serviciosIds }

   Las reservas de mesa y las suscripciones todavía no tienen ruta en el
   backend: siguen guardándose en este navegador (ver docs/backend-auth-cambios.md). */

const DIAS_AGENDA = 60

/** Horas tomadas, con la forma de cita que entiende useReserva (horasYaReservadas). */
export async function horasOcupadasApi(localId, hoy = new Date()) {
  const desde = format(hoy, 'yyyy-MM-dd')
  const hasta = format(addDays(hoy, DIAS_AGENDA), 'yyyy-MM-dd')
  const filas = await pedir(
    `/api/local/${encodeURIComponent(localId)}/horas-ocupadas?desde=${desde}&hasta=${hasta}`,
  )
  return (Array.isArray(filas) ? filas : []).map((f, i) => ({
    id: `ocupada-${i}`,
    localId,
    fecha: f.fecha,
    horario: f.horario,
    estadoReserva: 0,
  }))
}

export const reservarServiciosApi = ({ localId, fecha, horario, serviciosIds }) =>
  pedir('/api/citas/servicios', {
    metodo: 'POST',
    cuerpo: { local_id: localId, fecha, horario, serviciosIds },
  })
