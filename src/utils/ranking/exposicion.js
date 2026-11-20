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

/**
 * Suma lo que sabe el backend de TODOS los usuarios (local_exposicion, viene en
 * el resumen como ultimaVezTopGlobal y vistas24h). La "última vez arriba"
 * global también solo cuenta si fue antes de `antesDe`, por lo mismo: que el
 * orden no se mueva durante el día.
 */
export function conExposicionGlobal(porLocal, locales, antesDe) {
  const limite = antesDe ? new Date(antesDe).getTime() : Infinity
  const resultado = new Map(porLocal)
  for (const l of locales) {
    if (!l.deApi) continue
    const actual = resultado.get(l.id) ?? { vistas: 0, ultimaVezTop: null }
    const global = l.ultimaVezTopGlobal ? new Date(l.ultimaVezTopGlobal).getTime() : null
    const ultimaVezTop =
      global && global < limite && (!actual.ultimaVezTop || global > actual.ultimaVezTop) ? global : actual.ultimaVezTop
    resultado.set(l.id, { vistas: actual.vistas + (l.vistas24h || 0), ultimaVezTop })
  }
  return resultado
}
