import { MESAS_MAPA } from '../data/mesasMapa.js'
import { mesasDelPlano, planoDeLocal } from '../plano/local.js'

/* Locales de mesas (restaurantes, bares, terrazas…).

   Las mesas salen del PLANO del local (src/plano/): el que dibujó el dueño
   con el editor, o el de siempre si aún no lo hizo. Cada mesa lleva:
     capacidad          la normal (cómoda)
     capMin / capMax    el rango completo (solo lo sabe el dueño)
     online = false     la mesa existe, pero no se reserva por Citaly: se
                        guarda para quien llega sin reserva ("solo en el local").

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

/** Las mesas del local, sacadas de su plano. */
export function mesasDeLocal(local) {
  return mesasDelPlano(planoDeLocal(local))
}

/** Lo que paga quien reserva una mesa: { precio, consumoMinimo }. */
export function cobroDeMesa(local, mesa) {
  if (!local?.reservaMesa) {
    /* Locales de demo sin configurar: lo que traía cada mesa del plano de siempre. */
    const base = MESAS_MAPA.find((m) => m.id === mesa?.id)
    return { precio: Number(base?.precio) || 0, consumoMinimo: Number(base?.consumoMinimo) || 0 }
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
