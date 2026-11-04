import { useEffect, useMemo, useState } from 'react'
import { ArrowRight, Search, SlidersHorizontal, X } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import TarjetaLocal from '../components/TarjetaLocal/TarjetaLocal.jsx'
import PanelFiltros from '../components/Filtros/PanelFiltros.jsx'
import { getAllLocales } from '../services/locales.js'
import './Descubre.css'

const normalizar = (value) =>
  value
    .toLocaleLowerCase('es')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')

const filtrosIniciales = { zona: 'Todas', categoria: 'Todas', abiertos: false, rating: '0' }

function Descubre() {
  const navigate = useNavigate()
  const locales = useMemo(() => getAllLocales(), [])
  const [query, setQuery] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')
  const [filtros, setFiltros] = useState(filtrosIniciales)
  const [filtrosAbiertos, setFiltrosAbiertos] = useState(false)

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedQuery(query.trim())
    }, 500)
    return () => window.clearTimeout(timer)
  }, [query])
  const buscando = query.trim() !== debouncedQuery

  const sugerencias = useMemo(() => {
    if (debouncedQuery.length < 2) return []
    const texto = normalizar(debouncedQuery)
    return locales.filter((local) => normalizar(local.localName).includes(texto)).slice(0, 3)
  }, [debouncedQuery, locales])
  const mostrarSugerencias = query.trim().length >= 2

  const buscar = () => navigate(`/buscar?q=${encodeURIComponent(query.trim())}`)
  const aplicarFiltros = () => navigate('/buscar', { state: { filtros } })

  return (
    <section className="descubre">
      <div className="descubre-search-wrap">
        <form className="descubre-search" onSubmit={(event) => { event.preventDefault(); buscar() }}>
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="¿Qué estás buscando?" aria-label="Buscar lugares" />
          {query && <button className="search-clear" type="button" onClick={() => setQuery('')} aria-label="Borrar búsqueda"><X size={17} /></button>}
          <button className="search-submit" type="submit" aria-label="Buscar"><Search size={20} /></button>
          <button className="search-filter" type="button" onClick={() => setFiltrosAbiertos(true)} aria-label="Abrir filtros"><SlidersHorizontal size={19} /></button>
        </form>
        {mostrarSugerencias && (
          <div className="sugerencias" aria-live="polite">
            {buscando && <p className="sugerencias-state">Buscando lugares...</p>}
            {!buscando && sugerencias.map((local) => (
              <button key={local.id} className="sugerencia" type="button" onClick={() => navigate(`/local/${local.id}`)}>
                <span><strong>{local.localName}</strong><small>{local.categoria} · {local.direccion}</small></span>
                <ArrowRight size={17} />
              </button>
            ))}
            {!buscando && <button className="ver-todo" type="button" onClick={buscar}>Ver todos los resultados <ArrowRight size={17} /></button>}
          </div>
        )}
      </div>
      <div className="descubre-heading">
        <span className="eyebrow">Cerca de ti</span>
        <h1>Lugares para descubrir</h1>
      </div>
      <div className="tarjeta-container">
        {locales.map((local) => <TarjetaLocal key={local.id} {...local} />)}
      </div>
      {filtrosAbiertos && <PanelFiltros filtros={filtros} setFiltros={setFiltros} locales={locales} onClose={() => setFiltrosAbiertos(false)} onApply={aplicarFiltros} />}
    </section>
  )
}

export default Descubre
