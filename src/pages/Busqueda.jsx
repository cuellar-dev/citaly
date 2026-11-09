import { useEffect, useMemo, useState } from 'react'
import { ArrowLeft, ArrowRight, Filter, Search, SlidersHorizontal, X } from 'lucide-react'
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import TarjetaLocal from '../components/TarjetaLocal/TarjetaLocal.jsx'
import CarruselLocales from '../components/Busqueda/CarruselLocales.jsx'
import PanelFiltros from '../components/Filtros/PanelFiltros.jsx'
import { getAllLocales } from '../services/locales.js'
import { coincideFiltros, filtrosIniciales, normalizar } from '../utils/busqueda.js'
import talyBuscando from '../components/Taly/taly-buscando-animado.svg'
import talySinResultados from '../components/Taly/taly-sin-resultados-animado.svg'
import './Busqueda.css'
import './Descubre.css'

function Busqueda() {
  const navigate = useNavigate()
  const location = useLocation()
  const [params, setParams] = useSearchParams()
  const locales = useMemo(() => getAllLocales(), [])
  const [query, setQuery] = useState(params.get('q') || '')
  const [busqueda, setBusqueda] = useState(params.get('q') || '')
  const filtrosInicialesRuta = location.state?.filtros || filtrosIniciales
  const [filtros, setFiltros] = useState(filtrosInicialesRuta)
  const [filtrosAplicados, setFiltrosAplicados] = useState(filtrosInicialesRuta)
  const [filtrosAbiertos, setFiltrosAbiertos] = useState(false)

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setBusqueda(query.trim())
      setParams(query.trim() ? { q: query.trim() } : {}, { replace: true })
    }, 500)
    return () => window.clearTimeout(timer)
  }, [query, setParams])
  const cargando = query.trim() !== busqueda

  const filtrados = useMemo(() => {
    const texto = normalizar(busqueda)
    return locales.filter((local) => coincideFiltros(local, filtrosAplicados) && (!texto || normalizar(local.localName).includes(texto)))
  }, [locales, busqueda, filtrosAplicados])
  const similares = useMemo(() => locales.filter((local) => local.localName !== busqueda).slice(0, 8), [locales, busqueda])
  const promocionados = useMemo(() => locales.filter((local) => local.lugar).slice(0, 4), [locales])
  const aplicarFiltros = () => {
    setFiltrosAplicados(filtros)
    setFiltrosAbiertos(false)
  }

  return (
    <section className="busqueda-page">
      <header className="busqueda-header">
        <button className="busqueda-back" type="button" onClick={() => navigate(-1)} aria-label="Volver"><ArrowLeft size={22} /></button>
        <div>
          <span className="eyebrow">Explora Citaly</span>
          <h1>Buscar lugares</h1>
        </div>
        <button className="busqueda-filter-button" type="button" onClick={() => setFiltrosAbiertos(true)} aria-label="Abrir filtros"><SlidersHorizontal size={21} /></button>
      </header>
      <div className="busqueda-input-wrap">
        <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="¿Qué estás buscando?" aria-label="Buscar lugares" />
        {query && <button type="button" onClick={() => setQuery('')} aria-label="Borrar búsqueda"><X size={17} /></button>}
        <button className="busqueda-search-button" type="button" onClick={() => setBusqueda(query.trim())} aria-label="Buscar"><Search size={19} /></button>
        <button className="busqueda-filter-inline" type="button" onClick={() => setFiltrosAbiertos(true)} aria-label="Abrir filtros"><SlidersHorizontal size={19} /></button>
      </div>
      <div className="busqueda-content">
        <section className="resultados-section">
          <div className="section-title"><div><span className="eyebrow">{busqueda ? `Resultados para “${busqueda}”` : 'Encuentra tu próximo plan'}</span><h2>Lugares para ti</h2></div><span className="result-count">{filtrados.length}</span></div>
          {cargando ? (
            <div className="busqueda-state"><img className="busqueda-taly" src={talyBuscando} alt="Taly buscando" /><p>Buscando lugares...</p></div>
          ) : filtrados.length ? (
            <div className="resultados-grid">{filtrados.map((local) => <TarjetaLocal key={local.id} {...local} />)}</div>
          ) : (
            <div className="busqueda-state busqueda-empty">
              <img className="busqueda-taly busqueda-taly--empty" src={talySinResultados} alt="Taly sin resultados" />
              <h2>No hay lugares con ese nombre</h2>
              <p>Prueba con otro o ajusta los filtros que tengas activos.</p>
              <button type="button" onClick={() => setFiltrosAbiertos(true)}><Filter size={16} /> Ver filtros</button>
            </div>
          )}
        </section>
        <section className="similares-section">
          <div className="section-title"><div><span className="eyebrow">Ideas para ti</span><h2>Lugares similares</h2></div><span className="section-title-mark">Desliza <ArrowRight size={15} /></span></div>
          <CarruselLocales locales={similares} onSelect={(local) => navigate(`/local/${local.id}`)} etiqueta="Lugares similares" />
        </section>
        {promocionados.length > 0 && (
          <section className="promos-section">
            <div className="section-title"><div><span className="eyebrow">Recomendados por la comunidad</span><h2>Tienes que ver</h2></div><span className="section-title-mark">Desliza <ArrowRight size={15} /></span></div>
            <CarruselLocales locales={promocionados} onSelect={(local) => navigate(`/local/${local.id}`)} etiqueta="Lugares recomendados" />
          </section>
        )}
      </div>
      {filtrosAbiertos && <PanelFiltros filtros={filtros} setFiltros={setFiltros} locales={locales} onClose={() => setFiltrosAbiertos(false)} onApply={aplicarFiltros} />}
    </section>
  )
}

export default Busqueda
