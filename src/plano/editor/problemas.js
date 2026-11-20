import { CATALOGO, choques, esMesa, fueraDelLocal, mesasDe } from '../modelo.js'

/* Lo que se revisa antes de guardar la sala.
   bloquea = true → no se puede guardar hasta arreglarlo.
   bloquea = false → aviso (se puede guardar igual).
   `ids` → piezas a marcar en rojo en el plano. */

const nombreDe = (p) => (esMesa(p) || p.tipo === 'zona' ? p.nombre : CATALOGO[p.tipo].nombre)

export function problemasDelPlano(plano) {
  const lista = []
  const porId = new Map(plano.piezas.map((p) => [p.id, p]))
  const pisoDe = (p) => (plano.pisos.length > 1 ? ` (${plano.pisos.find((x) => x.id === p.piso)?.nombre})` : '')

  for (const p of plano.piezas) {
    if (fueraDelLocal(plano, p)) {
      lista.push({ id: `fuera-${p.id}`, bloquea: true, ids: [p.id], texto: `${nombreDe(p)}${pisoDe(p)} se sale del local.` })
    }
  }

  for (const [a, b] of choques(plano)) {
    const pa = porId.get(a)
    const pb = porId.get(b)
    lista.push({ id: `choque-${a}-${b}`, bloquea: true, ids: [a, b], texto: `${nombreDe(pa)} y ${nombreDe(pb)} se pisan${pisoDe(pa)}.` })
  }

  const mesas = mesasDe(plano)
  if (!mesas.some((m) => m.online)) {
    lista.push({ id: 'sin-mesas', bloquea: true, ids: [], texto: 'No hay ninguna mesa que se pueda reservar por Citaly.' })
  }

  const vistos = new Map()
  for (const m of mesas) vistos.set(m.nombre, [...(vistos.get(m.nombre) ?? []), m.id])
  for (const [nombre, ids] of vistos) {
    if (ids.length > 1) lista.push({ id: `nombre-${nombre}`, bloquea: true, ids, texto: `Hay ${ids.length} mesas que se llaman «${nombre}».` })
  }

  if (!plano.piezas.some((p) => p.tipo === 'entrada')) {
    lista.push({ id: 'sin-entrada', bloquea: false, ids: [], texto: 'Falta la entrada: ayuda mucho a que el cliente se ubique.' })
  }

  if (plano.pisos.length > 1) {
    for (const piso of plano.pisos) {
      if (!plano.piezas.some((p) => p.piso === piso.id && p.tipo === 'escalera')) {
        lista.push({ id: `escalera-${piso.id}`, bloquea: false, ids: [], texto: `En «${piso.nombre}» no hay escalera.` })
      }
    }
  }

  return lista
}
