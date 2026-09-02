import { differenceInMinutes, format, isBefore, parse } from 'date-fns'
import { es } from 'date-fns/locale'
import { getLocalById } from '../services/locales.js'

function fechaHoraCita(cita) {
  return parse(`${cita.fecha} ${cita.horario}`, 'yyyy-MM-dd HH:mm', new Date())
}

export function esCitaPasada(cita, ahora = new Date()) {
  return isBefore(fechaHoraCita(cita), ahora)
}

export function formatearFechaCita(cita) {
  const fecha = fechaHoraCita(cita)
  const etiqueta = format(fecha, "EEE'-'dd", { locale: es })
  const hora = format(fecha, 'h:mm a', { locale: es })
  return `${etiqueta.charAt(0).toUpperCase()}${etiqueta.slice(1)}, ${hora}`
}

export function textoEstadoCita(cita, ahora = new Date()) {
  const fecha = fechaHoraCita(cita)
  const minutos = differenceInMinutes(fecha, ahora)
  if (minutos < 0) return 'Ya pasó'
  if (minutos < 60) return `Quedan ${minutos} min`
  if (minutos < 60 * 24) {
    const horas = Math.round(minutos / 60)
    return `Quedan ${horas} h`
  }
  const dias = Math.round(minutos / (60 * 24))
  if (dias === 1) return 'Queda 1 día'
  if (dias < 7) return `Quedan ${dias} días`
  const semanas = Math.round(dias / 7)
  return semanas === 1 ? 'Queda 1 semana' : `Quedan ${semanas} semanas`
}

function digitosWhatsApp(valor) {
  return String(valor || '').replace(/\D/g, '')
}

export function propsDesdeCita(cita) {
  const local = getLocalById(cita.localId)
  const base = {
    lugar: cita.localNombre || local?.localName || 'Local',
    wasa: digitosWhatsApp(local?.whatsapp),
    telefono: local?.telefono || '',
    fechaTexto: formatearFechaCita(cita),
    estadoTexto: textoEstadoCita(cita),
    estadoReserva: 'CONFIRMADO',
  }

  if (cita.tipo === 'con-lugar') {
    const precio = cita.precioReserva ?? 0
    return {
      ...base,
      tipo: 'con-lugar',
      mesaId: cita.mesa?.id,
      mesaCodigo: cita.mesa?.codigo,
      mesaUbicacion: cita.mesa?.ubicacion,
      capacidad: cita.mesa?.capacidad,
      consumoTexto: cita.consumoMinimo
        ? `${cita.consumoMinimo} CUP mínimo`
        : undefined,
      coste: precio === 0 ? 'GRATIS (consumo)' : `${precio} CUP`,
      mapsHref: local?.direccion
        ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(local.direccion)}`
        : undefined,
    }
  }

  return {
    ...base,
    tipo: 'sin-lugar',
    fecha: cita.fecha,
    hora: cita.horario,
    profesional: cita.profesional?.name || 'Por asignar',
    servicios: (cita.servicios || []).map((s) => s.nombre).join(', ') || 'Servicio',
    coste: cita.precioTotal === 0 ? 'GRATIS' : `${cita.precioTotal ?? 0} CUP`,
  }
}
