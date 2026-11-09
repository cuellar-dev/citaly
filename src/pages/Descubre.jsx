import { useEffect, useMemo, useState } from 'react'
import { ArrowRight, Search, SlidersHorizontal, X } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import TarjetaLocal from '../components/TarjetaLocal/TarjetaLocal.jsx'
import PanelFiltros from '../components/Filtros/PanelFiltros.jsx'
import CieloDescubre from '../components/Descubre/CieloDescubre.jsx'
import HeroeLocal from '../components/Descubre/HeroeLocal.jsx'
import RailDescubre from '../components/Descubre/RailDescubre.jsx'
import TarjetaLocalCompacta from '../components/Descubre/TarjetaLocalCompacta.jsx'
import { getAllLocales } from '../services/locales.js'
import { estaAbierto } from '../utils/fichaLocal.js'
import { notaLocal } from '../utils/descubre.js'
import { filtrosIniciales, normalizar } from '../utils/busqueda.js'
import './Descubre.css'

/* El saludo cambia con la hora: lo primero que se lee no es igual por la
   mañana que de noche, y eso solo ya hace que la pantalla no se sienta
   siempre la misma. */
function saludoDeLaHora(hora) {
  if (hora < 6) return { eyebrow: 'De madrugada', titulo: 'Lo que sigue abierto' }
  if (hora < 12) return { eyebrow: 'Buenos días', titulo: '¿Por dónde empezamos?' }
  if (hora < 19) return { eyebrow: 'Buenas tardes', titulo: 'Lugares para descubrir' }
  return { eyebrow: 'Buenas noches', titulo: '¿Qué hacemos hoy?' }
}

function Descubre() {
  const navigate = useNavigate()
  const locales = useMemo(() => getAllLocales(), [])
  const [query, setQuery] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')
  const [filtros, setFiltros] = useState(filtrosIniciales)
  const [filtrosAbiertos, setFiltrosAbiertos] = useState(false)
  const [hora, setHora] = useState(() => new Date().getHours())

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedQuery(query.trim()), 500)
    return () => window.clearTimeout(timer)
  }, [query])

  useEffect(() => {
    const id = setInterval(() => setHora(new Date().getHours()), 300000)
    return () => clearInterval(id)
  }, [])

  const buscando = query.trim() !== debouncedQuery

  const sugerencias = useMemo(() => {
    if (debouncedQuery.length < 2) return []
    const texto = normalizar(debouncedQuery)
    return locales.filter((local) => normalizar(local.localName).includes(texto)).slice(0, 3)
  }, [debouncedQuery, locales])
  const mostrarSugerencias = query.trim().length >= 2

  /* Tres lecturas del mismo catálogo. Cada sección ordena por un criterio
     distinto, así la misma lista se recorre de tres maneras sin repetirse. */
  const { heroe, abiertos, cerca, otroDia } = useMemo(() => {
    const conDatos = locales.map((local) => ({
      local,
      abierto: estaAbierto(local),
      nota: notaLocal(local).nota,
      metros: Number(local.metros) || 0,
    }))

    const porNota = [...conDatos].sort((a, b) => b.nota - a.nota)
    const destacado = porNota.find((x) => x.abierto) ?? porNota[0] ?? null
    const resto = conDatos.filter((x) => x.local.id !== destacado?.local.id)

    return {
      heroe: destacado?.local ?? null,
      heroeAbierto: destacado?.abierto ?? false,
      abiertos: resto
        .filter((x) => x.abierto)
        .sort((a, b) => b.nota - a.nota)
        .map((x) => x.local),
      cerca: [...resto].sort((a, b) => a.metros - b.metros).map((x) => x.local),
      otroDia: resto
        .filter((x) => !x.abierto)
        .sort((a, b) => b.nota - a.nota)
        .map((x) => x.local),
    }
  }, [locales])

  const saludo = saludoDeLaHora(hora)
  const buscar = () => navigate(`/buscar?q=${encodeURIComponent(query.trim())}`)
  const aplicarFiltros = () => navigate('/buscar', { state: { filtros } })

  return (
    <section className="descubre">
      <CieloDescubre />

      <div className="descubre-contenido">
        <div className="descubre-search-wrap">
          <form
            className="descubre-search"
            onSubmit={(event) => {
              event.preventDefault()
              buscar()
            }}
          >
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="¿Qué estás buscando?"
              aria-label="Buscar lugares"
            />
            {query && (
              <button
                className="search-clear"
                type="button"
                onClick={() => setQuery('')}
                aria-label="Borrar búsqueda"
              >
                <X size={17} />
              </button>
            )}
            <button className="search-submit" type="submit" aria-label="Buscar">
              <Search size={20} />
            </button>
            <button
              className="search-filter"
              type="button"
              onClick={() => setFiltrosAbiertos(true)}
              aria-label="Abrir filtros"
            >
              <SlidersHorizontal size={19} />
            </button>
          </form>

          {mostrarSugerencias && (
            <div className="sugerencias" aria-live="polite">
              {buscando && <p className="sugerencias-state">Buscando lugares...</p>}
              {!buscando &&
                sugerencias.map((local) => (
                  <button
                    key={local.id}
                    className="sugerencia"
                    type="button"
                    onClick={() => navigate(`/local/${local.id}`)}
                  >
                    <span>
                      <strong>{local.localName}</strong>
                      <small>
                        {local.categoria} · {local.direccion}
                      </small>
                    </span>
                    <ArrowRight size={17} />
                  </button>
                ))}
              {!buscando && (
                <button className="ver-todo" type="button" onClick={buscar}>
                  Ver todos los resultados <ArrowRight size={17} />
                </button>
              )}
            </div>
          )}
        </div>

        <div className="descubre-heading">
          <span className="eyebrow">{saludo.eyebrow}</span>
          <h1>{saludo.titulo}</h1>
        </div>

        <div className="descubre-secciones">
          <HeroeLocal
            local={heroe}
            etiqueta={heroe && estaAbierto(heroe) ? 'Abierto ahora' : 'El mejor valorado'}
          />

          {abiertos.length > 0 && (
            <RailDescubre titulo="Puedes ir ahora mismo" nota={`${abiertos.length} abiertos`}>
              {abiertos.map((local) => (
                <TarjetaLocalCompacta key={local.id} local={local} />
              ))}
            </RailDescubre>
          )}

          <section className="descubre-lista">
            <header className="descubre-lista-cabecera">
              <h2>Cerca de ti</h2>
              <span>Del más cercano al más lejos</span>
            </header>
            <div className="descubre-lista-items">
              {cerca.map((local) => (
                <TarjetaLocal key={local.id} {...local} />
              ))}
            </div>
          </section>

          {otroDia.length > 0 && (
            <RailDescubre titulo="Para otro día" nota="Hoy están cerrados">
              {otroDia.map((local) => (
                <TarjetaLocalCompacta key={local.id} local={local} />
              ))}
            </RailDescubre>
          )}
        </div>
      </div>

      {filtrosAbiertos && (
        <PanelFiltros
          filtros={filtros}
          setFiltros={setFiltros}
          locales={locales}
          onClose={() => setFiltrosAbiertos(false)}
          onApply={aplicarFiltros}
        />
      )}
    </section>
  )
}

export default Descubre
