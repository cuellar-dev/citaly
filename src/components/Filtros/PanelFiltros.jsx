import { useId, useEffect } from 'react'
import { Filter, X } from 'lucide-react'
import Modal from '../Modal/Modal.jsx'
import FiltroSelect from './FiltroSelect.jsx'
import FiltroSwitch from './FiltroSwitch.jsx'
import './panelFiltros.css'

function obtenerOpciones(valores) {
  return ['Todas', ...new Set(valores.filter(Boolean))].map((valor) => ({
    value: valor,
    label: valor,
  }))
}

function PanelFiltros({ filtros, setFiltros, locales, onClose, onApply }) {
  const zonaId = useId()
  const categoriaId = useId()
  const abiertosId = useId()
  const ratingId = useId()
  const tituloId = useId()
  const zonas = obtenerOpciones(locales.map((local) => local.direccion?.split(',').pop()?.trim()))
  const categorias = obtenerOpciones(locales.map((local) => local.categoria))
  const ratings = [
    { value: '0', label: 'Cualquier valoración' },
    { value: '4', label: '4 estrellas o más' },
    { value: '4.5', label: '4.5 estrellas o más' },
  ]

  useEffect(() => {
    const overflowPrevio = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    return () => {
      document.body.style.overflow = overflowPrevio
    }
  }, [])

  const actualizarFiltro = (campo, valor) => {
    setFiltros((actuales) => ({ ...actuales, [campo]: valor }))
  }

  return (
    <Modal abierto onCerrar={onClose} className="modal-backdrop--hoja">
      <section
        className="filtros-sheet"
        role="dialog"
        aria-modal="true"
        aria-labelledby={tituloId}
      >
        <div className="filtros-handle" />
        <div className="filtros-heading">
          <div>
            <span className="eyebrow">Descubre a tu manera</span>
            <h2 id={tituloId}>Filtrar lugares</h2>
          </div>
          <button className="icon-button" type="button" onClick={onClose} aria-label="Cerrar filtros">
            <X size={21} />
          </button>
        </div>
        <div className="filtros-heading-icon" aria-hidden="true">
          <Filter size={18} />
          Elige cómo descubrir
        </div>
        <FiltroSelect
          id={zonaId}
          label="Zona"
          value={filtros.zona}
          options={zonas}
          onChange={(value) => actualizarFiltro('zona', value)}
        />
        <FiltroSelect
          id={categoriaId}
          label="Tipo de lugar"
          value={filtros.categoria}
          options={categorias}
          onChange={(value) => actualizarFiltro('categoria', value)}
        />
        <FiltroSwitch
          id={abiertosId}
          label="Solo abiertos ahora"
          checked={filtros.abiertos}
          onChange={(value) => actualizarFiltro('abiertos', value)}
        />
        <FiltroSelect
          id={ratingId}
          label="Valoración mínima"
          value={filtros.rating}
          options={ratings}
          onChange={(value) => actualizarFiltro('rating', value)}
        />
        <button className="filtros-apply" type="button" onClick={onApply}>
          Mostrar lugares
        </button>
      </section>
    </Modal>
  )
}

export default PanelFiltros
