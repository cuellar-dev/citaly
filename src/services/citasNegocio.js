import { pedir } from './api.js'

/* Las citas de un local para su dueño (Mi Negocio), contra el backend:

     GET   /api/citas/local/:localId?page=          de 10 en 10, más recientes primero
     PATCH /api/citas/:id/local/:localId/confirmar  { nuevoEstado: 1 }  aceptar → «Por ti»
     PATCH /api/citas/:id/local/:localId/cancelar   rechazar

   «Mover la hora» (en el backend desde el 27-11-2026, migración 014):
     PATCH  /api/citas/:id/local/:localId/proponer-hora  { fecha, horario }  → estado 4
     DELETE /api/citas/:id/local/:localId/proponer-hora  retirar → vuelve a 0 (15 min de nuevo)

   La forma de salida es la de data/citasNegocioDemo.js, la que pintan
   CitaDueno y el resumen del día. */

const PAGINAS_MAX = 30

/* La hora propuesta por el local (estado 4) y, tras aceptarla, la que había
   antes. Igual para la vista del dueño y la del cliente. */
export function camposDeHoraMovida(r) {
  const campos = {}
  if (r.propuesta_fecha) {
    campos.propuesta = {
      fecha: String(r.propuesta_fecha).slice(0, 10),
      horario: String(r.propuesta_horario ?? '').slice(0, 5),
      en: r.propuesta_en ?? null,
      vence: r.propuesta_vence ?? null,
    }
  }
  if (r.hora_anterior_fecha) {
    campos.horaAnterior = {
      fecha: String(r.hora_anterior_fecha).slice(0, 10),
      horario: String(r.hora_anterior_horario ?? '').slice(0, 5),
    }
  }
  return campos
}

export function adaptarCitaNegocio(r) {
  const servicios = Array.isArray(r.servicios) ? r.servicios : []
  return {
    id: r.id,
    fecha: String(r.fecha ?? '').slice(0, 10),
    horario: String(r.horario ?? '').slice(0, 5),
    esLugar: r.tipo === 'con-lugar',
    creadaEn: r.creada_en ?? null,
    cliente: r.cliente_nombre || 'Cliente de Citaly',
    foto: r.cliente_foto ?? null,
    linea: servicios.map((s) => s.nombre).join(' + ') || (r.tipo === 'con-lugar' ? 'Mesa' : 'Cita'),
    duracion: Number(r.demora_minutos) || servicios.reduce((t, s) => t + (Number(s.duracion_minutos) || 0), 0) || 30,
    precio: Number(r.precio_total) || 0,
    personas: r.personas ?? undefined,
    estadoReserva: Number(r.estado_reserva ?? 0),
    canceladaPor: r.cancelada_por ?? undefined,
    ...camposDeHoraMovida(r),
    asistio: r.asistio ?? undefined,
    deApi: true,
  }
}

export async function cargarCitasDelLocal(localId) {
  const todas = []
  for (let pagina = 1; pagina <= PAGINAS_MAX; pagina++) {
    const filas = await pedir(`/api/citas/local/${encodeURIComponent(localId)}?page=${pagina}`)
    const lista = Array.isArray(filas) ? filas : []
    todas.push(...lista)
    if (lista.length < 10) break
  }
  return todas.map(adaptarCitaNegocio)
}

export const aceptarCitaApi = (localId, citaId) =>
  pedir(`/api/citas/${encodeURIComponent(citaId)}/local/${encodeURIComponent(localId)}/confirmar`, {
    metodo: 'PATCH',
    cuerpo: { nuevoEstado: 1 },
  })

export const rechazarCitaApi = (localId, citaId) =>
  pedir(`/api/citas/${encodeURIComponent(citaId)}/local/${encodeURIComponent(localId)}/cancelar`, {
    metodo: 'PATCH',
  })

const rutaPropuesta = (localId, citaId) =>
  `/api/citas/${encodeURIComponent(citaId)}/local/${encodeURIComponent(localId)}/proponer-hora`

export const proponerHoraApi = (localId, citaId, { fecha, horario }) =>
  pedir(rutaPropuesta(localId, citaId), { metodo: 'PATCH', cuerpo: { fecha, horario } })

export const retirarPropuestaApi = (localId, citaId) => pedir(rutaPropuesta(localId, citaId), { metodo: 'DELETE' })
