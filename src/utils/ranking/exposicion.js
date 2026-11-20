/* Resumen de las impresiones por local: cuántas veces se vio y cuándo salió
   por última vez arriba. Con backend sería la tabla `local_exposicion`; aquí
   sale de las impresiones de ESTE usuario.

   Solo cuenta lo anterior a `antesDe` (el inicio del día de Descubre). Si no,
   ver una tarjeta cambiaría su novedad al instante y el orden se movería
   mientras el usuario mira, que es justo lo que la semilla evita. */

/* "Arriba": el héroe o los 3 primeros de cualquier bloque. */
const esTop = (e) => e.bloque === 'heroe' || Number(e.posicion) < 3

export function exposicionDe(eventos, antesDe) {
  const limite = antesDe ? new Date(antesDe).getTime() : Infinity
  const porLocal = new Map()
  for (const e of eventos) {
    if (e.tipo !== 'vista') continue
    const t = new Date(e.en).getTime()
    if (!(t < limite)) continue
    const actual = porLocal.get(e.localId) ?? { vistas: 0, ultimaVezTop: null }
    actual.vistas += 1
    if (esTop(e) && (!actual.ultimaVezTop || t > actual.ultimaVezTop)) actual.ultimaVezTop = t
    porLocal.set(e.localId, actual)
  }
  return porLocal
}
