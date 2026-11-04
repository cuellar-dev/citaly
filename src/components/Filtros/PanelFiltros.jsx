import { useEffect } from 'react'
import { Filter, X } from 'lucide-react'
import Modal from '../Modal/Modal.jsx'
import './panelFiltros.css'

function PanelFiltros({ filtros, setFiltros, locales, onClose, onApply }) {
  const zonas = [...new Set(locales.map((local) => local.direccion?.split(',').pop()?.trim()).filter(Boolean))]
  const categorias = [...new Set(locales.map((local) => local.categoria).filter(Boolean))]
  useEffect(() => {
    const overflowPrevio = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = overflowPrevio
    }
  }, [])

  return (
    <Modal abierto onCerrar={onClose} className="modal-backdrop--hoja">
      <section className="filtros-sheet" role="dialog" aria-modal="true" aria-labelledby="filtros-titulo">
        <div className="filtros-handle" />
        <div className="filtros-heading">
          <div>
            <span className="eyebrow">Descubre a tu manera</span>
            <h2 id="filtros-titulo">Filtrar lugares</h2>
          </div>
          <button className="icon-button" type="button" onClick={onClose} aria-label="Cerrar filtros"><X size={21} /></button>
        </div>
        <div className="filtros-heading-icon" aria-hidden="true"><Filter size={18} /> Elige cómo descubrir</div>
        <label className="filtro-label" htmlFor="filtro-zona">Zona</label>
        <select id="filtro-zona" value={filtros.zona} onChange={(event) => setFiltros({ ...filtros, zona: event.target.value })}>
          <option>Todas</option>
          {zonas.map((zona) => <option key={zona}>{zona}</option>)}
        </select>
        <label className="filtro-label" htmlFor="filtro-categoria">Tipo de lugar</label>
        <select id="filtro-categoria" value={filtros.categoria} onChange={(event) => setFiltros({ ...filtros, categoria: event.target.value })}>
          <option>Todas</option>
          {categorias.map((categoria) => <option key={categoria}>{categoria}</option>)}
        </select>
        <div className="filtro-row">
          <label className="switch-label" htmlFor="filtro-abiertos">
            <span>Solo abiertos ahora</span>
            <input id="filtro-abiertos" type="checkbox" checked={filtros.abiertos} onChange={(event) => setFiltros({ ...filtros, abiertos: event.target.checked })} />
          </label>
        </div>
        <label className="filtro-label" htmlFor="filtro-rating">Valoración mínima</label>
        <select id="filtro-rating" value={filtros.rating} onChange={(event) => setFiltros({ ...filtros, rating: event.target.value })}>
          <option value="0">Cualquier valoración</option>
          <option value="4">4 estrellas o más</option>
          <option value="4.5">4.5 estrellas o más</option>
        </select>
        <button className="filtros-apply" type="button" onClick={onApply}>Mostrar lugares</button>
      </section>
    </Modal>
  )
}

export default PanelFiltros
