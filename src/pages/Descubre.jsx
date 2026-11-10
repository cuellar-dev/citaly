import { useEffect, useMemo, useState } from 'react'
import { ArrowRight, Search, SlidersHorizontal, X } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import TarjetaLocal from '../components/TarjetaLocal/TarjetaLocal.jsx'
import PanelFiltros from '../components/Filtros/PanelFiltros.jsx'
// El cielo anterior (CieloDescubre) se retiró; en su lugar va una franja
// superior con el mundo de Taly dibujado a mano, a tinta. El componente viejo
// y su CSS siguen existiendo por si hiciera falta recuperarlos.
import FondoDescubre from '../components/Descubre/FondoDescubre.jsx'
import CarruselHeroe from '../components/Descubre/CarruselHeroe.jsx'
import RailDescubre from '../components/Descubre/RailDescubre.jsx'
import TarjetaLocalCompacta from '../components/Descubre/TarjetaLocalCompacta.jsx'
import { getAllLocales } from '../services/locales.js'
import { getFavoritos, FAVORITOS_EVENTO } from '../services/favoritos.js'
import { construirDescubre } from '../utils/descubre.js'
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
  const [favoritos, setFavoritos] = useState(getFavoritos)

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedQuery(query.trim()), 500)
    return () => window.clearTimeout(timer)
  }, [query])

  /* Los favoritos alimentan la estanta "Porque guardaste X": si cambian, el
     feed se rehace para que aparezca o se actualice en el acto. */
  useEffect(() => {
    const sync = () => setFavoritos(getFavoritos())
    window.addEventListener(FAVORITOS_EVENTO, sync)
    window.addEventListener('storage', sync)
    return () => {
      window.removeEventListener(FAVORITOS_EVENTO, sync)
      window.removeEventListener('storage', sync)
    }
  }, [])

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

  /* Feed al estilo Play Store: carrusel de héroes + rail de abiertos + lista
     vertical cortada cada 5 tarjetas por estantas horizontales. Se rehace si
     cambia el catálogo o los favoritos. */
  const { heroLista, abiertos, bloques } = useMemo(
    () => construirDescubre(locales, favoritos),
    [locales, favoritos],
  )

  const saludo = saludoDeLaHora(hora)
  const buscar = () => navigate(`/buscar?q=${encodeURIComponent(query.trim())}`)
  const aplicarFiltros = () => navigate('/buscar', { state: { filtros } })

  return (
    <section className="descubre">
      <FondoDescubre />

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
          <CarruselHeroe locales={heroLista} />

          {abiertos.length > 0 && (
            <RailDescubre titulo="Puedes ir ahora mismo" nota={`${abiertos.length} abiertos`}>
              {abiertos.map((local) => (
                <TarjetaLocalCompacta key={local.id} local={local} />
              ))}
            </RailDescubre>
          )}

          {bloques.map((bloque) =>
            bloque.tipo === 'lista' ? (
              <section className="descubre-lista" key={bloque.clave}>
                {bloque.titulo && (
                  <header className="descubre-lista-cabecera">
                    <h2>{bloque.titulo}</h2>
                    {bloque.subtitulo && <span>{bloque.subtitulo}</span>}
                  </header>
                )}
                <div className="descubre-lista-items">
                  {bloque.items.map((local) => (
                    <TarjetaLocal key={local.id} {...local} />
                  ))}
                </div>
              </section>
            ) : (
              <RailDescubre key={bloque.clave} titulo={bloque.titulo} nota={bloque.nota}>
                {bloque.items.map((local) => (
                  <TarjetaLocalCompacta key={local.id} local={local} />
                ))}
              </RailDescubre>
            ),
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
