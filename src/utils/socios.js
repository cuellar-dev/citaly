import { addMonths, addWeeks, addYears, differenceInCalendarDays, format, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'

/* Socios de un local de suscripción (gimnasio, curso…).

   Un socio: { id, nombre, telefono, planId, desde, proximoPago, estado, pagos }
     desde / proximoPago: 'yyyy-MM-dd'
     estado: 'activo' | 'solicitud' | 'baja'
     pagos:  [{ fecha, monto, recargo }]

   El recargo por atraso es del local (`local.recargo`):
     porDia:     CUP por cada día de atraso
     diasGracia: días después de la fecha en que todavía no se cobra recargo
     tope:       lo máximo que puede sumar el recargo (0 = sin tope) */

export const RECARGO_BASE = { porDia: 0, diasGracia: 0, tope: 0 }

/* Cuántos días antes del pago empieza el aviso de "por vencer". */
export const DIAS_AVISO = 3

export function recargoDe(local) {
  return { ...RECARGO_BASE, ...(local?.recargo ?? {}) }
}

export function planDeSocio(local, socio) {
  return (local?.planes ?? []).find((p) => p.id === socio.planId) ?? null
}

/** Siguiente fecha de pago tras cobrar un periodo. */
export function sumarPeriodo(fecha, periodo = 'mes') {
  const d = typeof fecha === 'string' ? parseISO(fecha) : fecha
  if (periodo === 'semana') return addWeeks(d, 1)
  if (periodo === 'trimestre') return addMonths(d, 3)
  if (periodo === 'anio') return addYears(d, 1)
  return addMonths(d, 1)
}

/**
 * Dónde está un socio con su pago.
 *   clave: 'al-dia' | 'por-vencer' | 'gracia' | 'atrasado' | 'solicitud' | 'baja'
 *   dias:  días hasta el pago (negativo = días de atraso)
 *   recargo, cuota, total: CUP a cobrar hoy si viniera a pagar
 */
export function situacionSocio(socio, local, hoy = new Date()) {
  const plan = planDeSocio(local, socio)
  const cuota = Number(plan?.precio) || 0
  if (socio.estado === 'solicitud') return { clave: 'solicitud', dias: null, recargo: 0, cuota, total: cuota, plan }
  if (socio.estado === 'baja') return { clave: 'baja', dias: null, recargo: 0, cuota, total: 0, plan }

  const dias = differenceInCalendarDays(parseISO(socio.proximoPago), hoy)
  const r = recargoDe(local)
  const diasCobrables = Math.max(0, -dias - r.diasGracia)
  let recargo = diasCobrables * (Number(r.porDia) || 0)
  if (r.tope > 0) recargo = Math.min(recargo, r.tope)

  let clave = 'al-dia'
  if (dias < 0) clave = diasCobrables > 0 ? 'atrasado' : 'gracia'
  else if (dias <= DIAS_AVISO) clave = 'por-vencer'

  return { clave, dias, recargo, cuota, total: cuota + recargo, plan }
}

/** La frase corta que va en la fila del socio. */
export function textoSituacion({ clave, dias, recargo }) {
  if (clave === 'solicitud') return 'Quiere unirse'
  if (clave === 'baja') return 'De baja'
  if (dias === 0) return 'Paga hoy'
  if (dias === 1) return 'Paga mañana'
  if (dias > 0) return `Faltan ${dias} días`
  const atraso = -dias
  const base = atraso === 1 ? '1 día tarde' : `${atraso} días tarde`
  if (clave === 'gracia') return `${base} · sin recargo aún`
  return recargo ? `${base} · +${recargo} CUP` : base
}

export const ETIQUETA_SITUACION = {
  'al-dia': 'Al día',
  'por-vencer': 'Por vencer',
  gracia: 'En gracia',
  atrasado: 'Atrasado',
  solicitud: 'Solicitud',
  baja: 'Baja',
}

/** "el 5 de cada mes" (o, corto, "paga el día 5") */
export function textoDiaDePago(socio, plan, { corto = false } = {}) {
  const d = parseISO(socio.proximoPago)
  if (plan?.periodo === 'semana') return `paga los ${format(d, 'EEEE', { locale: es })}`
  if (corto) return `paga el día ${format(d, 'd')}`
  return `el ${format(d, 'd')} de cada ${plan?.periodo === 'trimestre' ? 'trimestre' : plan?.periodo === 'anio' ? 'año' : 'mes'}`
}

export function fechaCorta(iso) {
  return format(parseISO(iso), "d 'de' MMM", { locale: es })
}

/** Mensaje de WhatsApp para recordar el pago, con el recargo si lo hay. */
export function mensajeRecordatorio(socio, situacion, local) {
  const nombre = String(socio.nombre).split(' ')[0]
  const plan = situacion.plan?.nombre ? ` (plan ${situacion.plan.nombre})` : ''
  if (situacion.dias != null && situacion.dias < 0) {
    const extra = situacion.recargo ? ` Con el recargo por atraso son ${situacion.total} CUP.` : ''
    return `Hola ${nombre}, te escribimos de ${local.localName}. Tu cuota${plan} venció el ${fechaCorta(socio.proximoPago)}.${extra} ¡Te esperamos!`
  }
  return `Hola ${nombre}, te escribimos de ${local.localName}. Te recordamos que tu cuota${plan} de ${situacion.cuota} CUP vence el ${fechaCorta(socio.proximoPago)}.`
}
