import { getAllLocales, getLocalById } from './locales.js'
import { saveFicha } from './storage.js'
import { sinPerfil } from './usuarios.js'

export function formatearMes(ym) {
  if (!ym) return ''
  const [y, m] = String(ym).split('-')
  if (!y || !m) return ym
  const meses = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic']
  return `${meses[Number(m) - 1] ?? m} ${y}`
}

export function trabajoDeUsuario(usuarioId, { excluirLocalId } = {}) {
  if (!usuarioId) return []
  return getAllLocales().flatMap((local) => {
    if (excluirLocalId && local.id === excluirLocalId) return []
    return (local.profesionales ?? [])
      .filter((p) => p.usuarioId === usuarioId)
      .map((p) => ({
        id: local.id,
        localName: local.localName,
        rol: [p.oficio, p.oficioDetalle, p.desdeCuando && `desde ${formatearMes(p.desdeCuando)}`].filter(Boolean).join(' · '),
        estado: p.estado,
        origen: p.origen,
      }))
  })
}

export function solicitarTrabajo(localId, usuarioId, datos) {
  const local = getLocalById(localId)
  if (!local) return { ok: false, motivo: 'Ese local ya no está en Citaly.' }
  const liga = (local.profesionales ?? []).find((p) => p.usuarioId === usuarioId)
  if (liga?.estado === 'pendiente') return { ok: false, motivo: 'El dueño todavía no responde esa petición.' }
  if (liga) return { ok: false, motivo: 'Ya formas parte de ese equipo.' }

  const nuevo = sinPerfil({
    id: `sol-${Date.now()}`,
    usuarioId,
    estado: 'pendiente',
    origen: 'solicito',
    points: null,
    servicios: [],
    oficio: datos.oficio,
    oficioDetalle: datos.oficioDetalle || '',
    desdeCuando: datos.desdeCuando,
    solicitadoEn: new Date().toISOString(),
  })

  const profesionales = [...(local.profesionales ?? []).map(sinPerfil), nuevo]
  saveFicha(localId, { profesionales })
  return { ok: true }
}
