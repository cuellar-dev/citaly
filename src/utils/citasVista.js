import { differenceInMinutes, format, isBefore, parse } from 'date-fns'
import { es } from 'date-fns/locale'
import { getLocalById } from '../services/locales.js'
import { planoDeLocal } from '../plano/local.js'
import { HORA_PROPUESTA, venceLaPropuesta } from './estadosCita.js'

function fechaHoraCita(cita) {
  return parse(`${cita.fecha} ${cita.horario}`, 'yyyy-MM-dd HH:mm', new Date())
}

export function esCitaPasada(cita, ahora = new Date()) {
  /* Cancelada sale de Próximas aunque la fecha aún no haya llegado. */
  if (cita.estadoReserva === 3) return true
  /* Con hora propuesta manda la nueva: la vieja puede pasar mientras decide. */
  if (cita.estadoReserva === HORA_PROPUESTA && cita.propuesta) return isBefore(fechaHoraCita(cita.propuesta), ahora)
  return isBefore(fechaHoraCita(cita), ahora)
}

export function formatearFechaCita(cita) {
  const { diaTexto, horaTexto } = partesFechaCita(cita)
  return `${diaTexto}, ${horaTexto}`
}

/** Día y hora por separado: la tarjeta los pinta en dos líneas. */
export function partesFechaCita(cita) {
  const fecha = fechaHoraCita(cita)
  const etiqueta = format(fecha, "EEE'-'dd", { locale: es })
  return {
    diaTexto: `${etiqueta.charAt(0).toUpperCase()}${etiqueta.slice(1)}`,
    horaTexto: format(fecha, 'h:mm a', { locale: es }),
    mesTexto: format(fecha, 'MMM', { locale: es }),
  }
}

export function fechaHoraDesdeCita(cita, diaReferencia = new Date()) {
  if (cita.fecha && cita.horario) {
    return fechaHoraCita(cita)
  }
  const hora = cita.horario || cita.hora
  const fecha = format(diaReferencia, 'yyyy-MM-dd')
  return parse(`${fecha} ${hora}`, 'yyyy-MM-dd HH:mm', new Date())
}

export function minutosHastaCita(cita, ahora = new Date()) {
  return differenceInMinutes(fechaHoraDesdeCita(cita, ahora), ahora)
}

/** Texto corto para el panel del dueño: "en 15 min", "en 1 hora", "ya pasó". */
export function textoEnCita(cita, ahora = new Date()) {
  if (cita.estadoReserva === 3) return 'cancelada'
  const minutos = minutosHastaCita(cita, ahora)
  if (minutos < 0) return 'ya pasó'
  if (minutos === 0) return 'ahora'
  if (minutos < 60) return `en ${minutos} min`
  const horas = Math.floor(minutos / 60)
  const resto = minutos % 60
  if (resto === 0) {
    return horas === 1 ? 'en 1 hora' : `en ${horas} horas`
  }
  if (horas === 1) return `en 1 h ${resto} min`
  return `en ${horas} h ${resto} min`
}

export function textoEstadoCita(cita, ahora = new Date()) {
  /* No repetimos "Cancelada": eso ya lo dice la píldora de estado. Aquí se
     cuenta QUIÉN la canceló, que es el dato que falta. */
  if (cita.estadoReserva === 3) {
    if (cita.canceladaPor === 'cliente') return 'La soltaste tú'
    if (cita.canceladaPor === 'tiempo') return 'Se venció el plazo'
    if (cita.canceladaPor === 'local') return 'La soltó el local'
    if (cita.canceladaPor === 'sinRespuesta') return 'No contestaste a la hora nueva'
    return 'Ya no cuenta'
  }
  const propuesta = vistaPropuesta(cita)
  if (propuesta?.venceTexto) return `Contesta antes de las ${propuesta.venceTexto}`
  const minutos = minutosHastaCita(cita, ahora)
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

/** Mesa (true) o servicio (false). */
export function esCitaDeLugar(cita) {
  return cita?.esLugar === true
}

/* La hora que propuso el local, lista para la tarjeta: la nueva, si cambia
   de día, y hasta cuándo hay para contestar. */
export function vistaPropuesta(cita) {
  if (cita.estadoReserva !== HORA_PROPUESTA || !cita.propuesta) return null
  const nueva = partesFechaCita(cita.propuesta)
  const vence = venceLaPropuesta(cita)
  return {
    horaTexto: nueva.horaTexto,
    diaTexto: nueva.diaTexto,
    otroDia: cita.propuesta.fecha !== cita.fecha,
    fecha: cita.propuesta.fecha,
    venceTexto: vence ? format(vence, 'h:mm a', { locale: es }) : null,
  }
}

export function propsDesdeCita(cita) {
  const local = getLocalById(cita.localId)
  const esLugar = esCitaDeLugar(cita)
  const base = {
    lugar: cita.localNombre || local?.localName || 'Local',
    esLugar,
    wasa: digitosWhatsApp(local?.whatsapp),
    telefono: local?.telefono || '',
    fechaTexto: formatearFechaCita(cita),
    ...partesFechaCita(cita),
    estadoTexto: textoEstadoCita(cita),
    estadoReserva: cita.estadoReserva ?? 0,
    propuesta: vistaPropuesta(cita),
    horaAnteriorTexto: cita.horaAnterior
      ? partesFechaCita({ fecha: cita.horaAnterior.fecha, horario: cita.horaAnterior.horario }).horaTexto
      : null,
    mapsHref: local?.direccion
      ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(local.direccion)}`
      : undefined,
  }

  if (esLugar) {
    const precio = cita.precioReserva ?? 0
    return {
      ...base,
      /* Reserva de grupo: no hay mesa concreta, las juntan en el local. */
      grupoGrande: cita.grupoGrande === true,
      minimoPersonas: cita.minimoPersonas ?? null,
      personas: cita.personas ?? null,
      mesaId: cita.mesa?.id,
      /* Mesas juntas: todas las que ocupa la reserva. */
      mesaIds: cita.mesa?.ids ?? null,
      plano: local?.lugar ? planoDeLocal(local) : undefined,
      mesaCodigo: cita.mesa?.codigo,
      mesaUbicacion: cita.mesa?.ubicacion,
      capacidad: cita.mesa?.capacidad,
      consumoTexto: cita.consumoMinimo
        ? `${cita.consumoMinimo} CUP mínimo`
        : undefined,
      coste: precio === 0 ? 'GRATIS (consumo)' : `${precio} CUP`,
    }
  }

  return {
    ...base,
    fecha: cita.fecha,
    hora: cita.horario,
    servicios: (cita.servicios || []).map((s) => s.nombre).join(', ') || 'Servicio',
    /* Líneas del recibo: nombre, duración y precio por servicio. */
    lineas: cita.servicios || [],
    coste: cita.precioTotal === 0 ? 'GRATIS' : `${cita.precioTotal ?? 0} CUP`,
  }
}
