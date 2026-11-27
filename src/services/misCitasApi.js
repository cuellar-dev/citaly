import { pedir } from './api.js'
import { camposDeHoraMovida } from './citasNegocio.js'

/* Mis citas contra el backend (cliente: sus propias citas).

   Rutas que YA existen en backend-citaly-main/Routes/CitasRouter.js:
     GET   /api/citas/usuario/me                    lista (de 10 en 10, ?page=)
     PATCH /api/citas/:id/usuario/confirmar         «Voy pa allá»  { nuevoEstado: 2 }
     PATCH /api/citas/:id/usuario/cancelar          cancelar

   Y también (ya en el backend):
     PATCH /api/citas/:id/usuario/asistencia        { asistio: true | false | null }
     POST  /api/opiniones/local/:localId            { citaId, calificacion, comentario }
     PATCH /api/citas/:id/usuario/aceptar-hora      «Me vale» la hora que propuso el
                                                    local → confirmada a esa hora
                                                    (desde el 27-11-2026, migración 014)

   Falta todavía: editar una opinión ya publicada (DELETE/PUT de la propia).
   Si una ruta falla, `misCitas.js` captura el error y el cambio se queda
   solo en este navegador (se avisa al usuario). */

const PAGINAS_MAX = 20

/* El driver de Postgres puede dar la fecha como '2026-11-21' o como ISO
   completo; el horario como '10:00:00'. El front trabaja con 'yyyy-MM-dd' y 'HH:mm'. */
const soloFecha = (v) => String(v ?? '').slice(0, 10)
const soloHora = (v) => String(v ?? '').slice(0, 5)

/**
 * De una fila del backend a la forma de cita que usa el front (la misma de
 * citasDemo.js). Tolera lo que hoy no manda el backend: sin `servicios` o sin
 * `local_nombre` la tarjeta sigue pintando, solo más pobre.
 */
export function adaptarCita(r) {
  const esLugar = r.tipo === 'con-lugar'
  const cita = {
    id: r.id,
    esLugar,
    localId: r.local_id,
    localNombre: r.local_nombre ?? r.localNombre ?? '',
    /* Para «tus sitios de siempre» cuando la ficha del local aún no se pide. */
    categoria: r.local_categoria ?? r.categoria ?? null,
    localFoto: r.local_foto ?? null,
    fecha: soloFecha(r.fecha),
    horario: soloHora(r.horario),
    estadoReserva: Number(r.estado_reserva ?? 0),
    creadaEn: r.creada_en ?? null,
    deApi: true,
  }
  Object.assign(cita, camposDeHoraMovida(r))
  if (r.cancelada_en) cita.canceladaEn = r.cancelada_en
  if (r.cancelada_por) cita.canceladaPor = r.cancelada_por
  /* «Voy pa allá» = el cliente confirmó (estado 2). */
  if (cita.estadoReserva === 2) {
    cita.voyPaAlla = true
    if (r.confirmada_en) cita.voyPaAllaEn = r.confirmada_en
  }
  if (r.asistio === true) cita.asistencia = 'si'
  else if (r.asistio === false) cita.asistencia = 'no'
  if (r.opinion) {
    cita.opinion = {
      puntuacion: Number(r.opinion.calificacion),
      texto: r.opinion.comentario ?? '',
      en: r.opinion.creado_en ?? null,
    }
  }
  if (esLugar) {
    cita.personas = r.personas ?? null
    cita.precioReserva = Number(r.precio_total) || 0
    cita.consumoMinimo = r.consumo_minimo ?? null
    cita.mesa = {
      id: r.mesa_id ?? null,
      codigo: r.mesa?.codigo ?? null,
      capacidad: r.mesa?.capacidad ?? null,
      ubicacion: r.mesa?.ubicacion ?? null,
    }
  } else {
    cita.precioTotal = Number(r.precio_total) || 0
    cita.demoraMinutos = r.demora_minutos ?? null
    cita.servicios = (r.servicios ?? []).map((s) => ({
      id: s.servicio_id ?? s.id,
      nombre: s.nombre,
      precio: Number(s.precio) || 0,
      duracion: Number(s.duracion_minutos ?? s.duracion) || 0,
    }))
  }
  return cita
}

/** Todas las citas del cliente (el backend pagina de 10 en 10). */
export async function cargarCitasApi() {
  const todas = []
  for (let pagina = 1; pagina <= PAGINAS_MAX; pagina++) {
    const filas = await pedir(`/api/citas/usuario/me?page=${pagina}`)
    const lista = Array.isArray(filas) ? filas : []
    todas.push(...lista)
    if (lista.length < 10) break
  }
  return todas.map(adaptarCita)
}

export const confirmarCitaApi = (citaId) =>
  pedir(`/api/citas/${encodeURIComponent(citaId)}/usuario/confirmar`, { metodo: 'PATCH', cuerpo: { nuevoEstado: 2 } })

export const aceptarHoraApi = (citaId) =>
  pedir(`/api/citas/${encodeURIComponent(citaId)}/usuario/aceptar-hora`, { metodo: 'PATCH' })

export const cancelarCitaApi = (citaId) =>
  pedir(`/api/citas/${encodeURIComponent(citaId)}/usuario/cancelar`, { metodo: 'PATCH' })

/** `asistio`: true (fue), false (no fue) o null (deshacer). */
export const asistenciaCitaApi = (citaId, asistio) =>
  pedir(`/api/citas/${encodeURIComponent(citaId)}/usuario/asistencia`, { metodo: 'PATCH', cuerpo: { asistio } })

export const publicarOpinionApi = (cita, { puntuacion, texto }) =>
  pedir(`/api/opiniones/local/${encodeURIComponent(cita.localId)}`, {
    metodo: 'POST',
    cuerpo: { citaId: cita.id, calificacion: puntuacion, comentario: texto },
  })
