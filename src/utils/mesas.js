import { MESAS_MAPA } from '../data/mesasMapa.js'

/* Locales de mesas (restaurantes, bares, terrazas…).

   El plano es el mismo dibujo para todos (data/mesasMapa.js). Lo que el dueño
   puede cambiar de cada mesa va en `local.mesas`, por id:
     { id, capacidad, ubicacion, online }
   online = false → la mesa existe, pero no se reserva por Citaly: se guarda
   para quien llega sin reserva.

   Y lo que se cobra va en `local.reservaMesa`, igual para todas las mesas:
     cobro:          'gratis' | 'precio'
     precio:         lo que cuesta reservar (si cobro = 'precio')
     consumoMinimo:  lo que hay que gastar como mínimo (si es gratis; 0 = nada)
     tolerancia:     minutos que se guarda la mesa si llegan tarde
     gruposGrandes:  si se aceptan grupos más grandes que la mesa mayor */

export const RESERVA_MESA_BASE = {
  cobro: 'gratis',
  precio: 0,
  consumoMinimo: 0,
  tolerancia: 15,
  gruposGrandes: true,
}

export const TOLERANCIAS = [10, 15, 20, 30]

export function reservaMesaDe(local) {
  return { ...RESERVA_MESA_BASE, ...(local?.reservaMesa ?? {}) }
}

/** Las mesas del plano con lo que el dueño cambió encima. */
export function mesasDeLocal(local) {
  const cambios = new Map((local?.mesas ?? []).map((m) => [m.id, m]))
  return MESAS_MAPA.map((base) => {
    const propio = cambios.get(base.id) ?? {}
    return {
      ...base,
      capacidad: Number(propio.capacidad) || base.capacidad,
      ubicacion: propio.ubicacion ?? base.ubicacion,
      online: propio.online ?? true,
    }
  })
}

/** Lo que el dueño guarda de cada mesa (sin lo del dibujo). */
export function mesasParaGuardar(mesas) {
  return mesas.map(({ id, capacidad, ubicacion, online }) => ({ id, capacidad, ubicacion, online }))
}

/** Lo que paga quien reserva una mesa: { precio, consumoMinimo }. */
export function cobroDeMesa(local, mesa) {
  if (!local?.reservaMesa) {
    /* Locales sin configurar: lo que trae cada mesa del plano. */
    return { precio: Number(mesa?.precio) || 0, consumoMinimo: Number(mesa?.consumoMinimo) || 0 }
  }
  const r = reservaMesaDe(local)
  return r.cobro === 'precio'
    ? { precio: Number(r.precio) || 0, consumoMinimo: 0 }
    : { precio: 0, consumoMinimo: Number(r.consumoMinimo) || 0 }
}

/** "Gratis · consumo mínimo 1000 CUP" / "300 CUP por mesa" */
export function textoCobroMesa(local) {
  const r = reservaMesaDe(local)
  if (r.cobro === 'precio') return `${Number(r.precio) || 0} CUP por mesa`
  return Number(r.consumoMinimo) > 0 ? `Gratis · consumo mínimo ${r.consumoMinimo} CUP` : 'Gratis, sin consumo mínimo'
}

/* Lo que enseña la ficha pública de un local de mesas ya configurado: una
   línea por tamaño de mesa, todas con el mismo cobro. */
export function ofertaMesas(local, duracion) {
  const online = mesasDeLocal(local).filter((m) => m.online)
  const { precio, consumoMinimo } = cobroDeMesa(local, online[0])
  const tamanos = [...new Set(online.map((m) => m.capacidad))].sort((a, b) => a - b)
  return tamanos.map((cap) => {
    const cuantas = online.filter((m) => m.capacidad === cap).length
    return {
      id: `mesa-${cap}`,
      nombre: `Mesa para ${cap}`,
      precio,
      duracion,
      nota: [
        `${cuantas} ${cuantas === 1 ? 'mesa' : 'mesas'}`,
        consumoMinimo ? `consumo mínimo ${consumoMinimo} CUP` : null,
      ]
        .filter(Boolean)
        .join(' · '),
    }
  })
}
