import { useMemo, useState } from 'react'
import { Search, Store } from 'lucide-react'
import { Seccion } from '../Negocio/modales/piezas.jsx'
import { getAllLocales } from '../../services/locales.js'
import { solicitarTrabajo } from '../../services/trabajo.js'
import { fotoAncho } from '../../utils/fichaLocal.js'
import './solicitarTrabajo.css'

function normalizar(texto) {
  return String(texto || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
}

function opcionesTrabajo(local) {
  if (local.lugar) {
    return ['En la cocina', 'Mesero/a', 'Barra', 'Caja', 'Limpieza', 'Anfitrión/a']
  }
  const nombres = [...new Set((local.servicios ?? []).map((s) => s.nombre).filter(Boolean))]
  if (nombres.length) return nombres
  return ['Estilista', 'Barbero', 'Manicurista', 'Recepcionista']
}

function SolicitarTrabajo({ usuarioId, excluirLocalId, ocupados = [], onListo }) {
  const [q, setQ] = useState('')
  const [local, setLocal] = useState(null)
  const [preset, setPreset] = useState('')
  const [detalle, setDetalle] = useState('')
  const [desde, setDesde] = useState('')
  const [aviso, setAviso] = useState('')

  const bloqueados = useMemo(() => new Set([excluirLocalId, ...ocupados.map((o) => o.id)].filter(Boolean)), [excluirLocalId, ocupados])

  const resultados = useMemo(() => {
    const n = normalizar(q)
    if (n.length < 2) return []
    return getAllLocales()
      .filter((l) => !bloqueados.has(l.id) && (normalizar(l.localName).includes(n) || normalizar(l.categoria).includes(n) || normalizar(l.direccion).includes(n)))
      .slice(0, 8)
  }, [q, bloqueados])

  const opciones = local ? opcionesTrabajo(local) : []

  const enviar = (e) => {
    e.preventDefault()
    if (!local) return
    const texto = detalle.trim()
    if (!preset && !texto) {
      setAviso('Elige una opción o escríbelo tú.')
      return
    }
    if (!desde) {
      setAviso('Di desde cuándo trabajas ahí.')
      return
    }
    const res = solicitarTrabajo(local.id, usuarioId, {
      oficio: preset || texto,
      oficioDetalle: preset && texto ? texto : '',
      desdeCuando: desde,
    })
    if (!res.ok) {
      setAviso(res.motivo)
      return
    }
    onListo()
  }

  if (!local) {
    return (
      <div className="modal-negocio-stack">
        <label className="solicitar-buscador">
          <Search size={18} strokeWidth={2.25} aria-hidden="true" />
          <input
            type="search"
            className="modal-negocio-input"
            value={q}
            placeholder="Nombre del local, categoría o barrio"
            aria-label="Buscar un local"
            autoComplete="off"
            enterKeyHint="search"
            onChange={(e) => setQ(e.target.value)}
          />
        </label>
        {normalizar(q).length < 2 ? (
          <p className="modal-negocio-nota">
            Busca el local donde trabajas. El dueño verá la petición en su equipo y decide si es verdad.
          </p>
        ) : resultados.length === 0 ? (
          <p className="modal-negocio-nota">Ningún local coincide con «{q.trim()}».</p>
        ) : (
          <ul className="solicitar-lista">
            {resultados.map((l) => (
              <li key={l.id}>
                <button
                  type="button"
                  className="solicitar-fila"
                  onClick={() => {
                    setLocal(l)
                    setPreset('')
                    setDetalle('')
                    setDesde('')
                    setAviso('')
                  }}
                >
                  <span className="solicitar-foto" style={{ backgroundImage: `url(${fotoAncho(l.url, 200)})` }}>
                    {!l.url && <Store size={16} />}
                  </span>
                  <span className="solicitar-fila-textos">
                    <span>{l.localName}</span>
                    <small>{[l.categoria, l.direccion].filter(Boolean).join(' · ')}</small>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    )
  }

  return (
    <form className="modal-negocio-stack" onSubmit={enviar} noValidate>
      <button type="button" className="solicitar-elegido" onClick={() => setLocal(null)}>
        <span className="solicitar-foto" style={{ backgroundImage: `url(${fotoAncho(local.url, 200)})` }} />
        <span className="solicitar-fila-textos">
          <span>{local.localName}</span>
          <small>Cambiar local</small>
        </span>
      </button>

      <Seccion titulo="De qué trabajas">
        <div className="solicitar-chips" role="group" aria-label="Puesto">
          {opciones.map((op) => (
            <button
              key={op}
              type="button"
              className={`solicitar-chip${preset === op ? ' solicitar-chip--on' : ''}`}
              aria-pressed={preset === op}
              onClick={() => setPreset(preset === op ? '' : op)}
            >
              {op}
            </button>
          ))}
        </div>
        <label className="modal-negocio-campo solicitar-campo">
          <span>O escríbelo tú</span>
          <input
            className="modal-negocio-input"
            value={detalle}
            maxLength={60}
            placeholder={local.lugar ? 'Ej. ayudante de cocina' : 'Ej. colorista'}
            onChange={(e) => setDetalle(e.target.value)}
          />
        </label>
      </Seccion>

      <Seccion titulo="Desde cuándo">
        <label className="modal-negocio-campo">
          <span>Mes y año</span>
          <input
            type="month"
            className="modal-negocio-input"
            value={desde}
            onChange={(e) => setDesde(e.target.value)}
          />
        </label>
      </Seccion>

      {aviso && (
        <p className="solicitar-error" role="alert">
          {aviso}
        </p>
      )}

      <button type="submit" className="modal-negocio-accion-principal">
        Mandar petición
      </button>
    </form>
  )
}

export default SolicitarTrabajo
