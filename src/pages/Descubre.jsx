import { Suspense, lazy, useCallback, useEffect, useMemo, useRef, useState } from 'react'
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
import {
  ColaFotosContext,
  ESPERA_HEROE_MS,
  ESPERA_PRIMERAS_MS,
  PRIMERAS,
} from '../components/Descubre/colaFotos.js'
import LlamadaOpinion from '../components/Ayuda/LlamadaOpinion.jsx'
import { ListaEsqueleto } from '../components/Esqueletos/Esqueletos.jsx'
import { getAllLocales } from '../services/locales.js'
import { getFavoritos, FAVORITOS_EVENTO } from '../services/favoritos.js'
import { construirDescubre } from '../utils/descubre.js'
import { useOcultarAlBajar } from '../hooks/useOcultarAlBajar.js'
import { useScrollInfinito } from '../hooks/useScrollInfinito.js'
import { filtrosIniciales, normalizar } from '../utils/busqueda.js'
import './Descubre.css'

/* El pie (la hoguera de Taly, un canvas con su animación) solo sale cuando se
   acaban los lugares: se descarga entonces y no al abrir Descubre. */
const PieDePagina = lazy(() => import('../components/Pie/PieDePagina.jsx'))

/* Scroll infinito: al abrir se pinta el héroe, el rail de abiertos y el
   primer bloque del feed; el resto entra de dos en dos al acercarse al
   final. Menos DOM al arrancar = la página responde antes (Lighthouse medía
   más de 4.000 elementos y medio segundo de hilo bloqueado). */
const BLOQUES_INICIALES = 1
const BLOQUES_POR_TANDA = 2

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
  const [escribiendo, setEscribiendo] = useState(false)

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
  /* Mientras escribes o hay sugerencias, el buscador no se va. */
  const buscadorOculto = useOcultarAlBajar({ fijo: escribiendo || mostrarSugerencias || filtrosAbiertos })

  /* Feed al estilo Play Store: carrusel de héroes + rail de abiertos + lista
     vertical cortada cada 5 tarjetas por estantas horizontales. Se rehace si
     cambia el catálogo o los favoritos. */
  const { heroLista, abiertos, bloques } = useMemo(
    () => construirDescubre(locales, favoritos),
    [locales, favoritos],
  )

  const [cuantosBloques, setCuantosBloques] = useState(BLOQUES_INICIALES)
  const hayMas = cuantosBloques < bloques.length
  const mostrarMas = useCallback(
    () => setCuantosBloques((n) => Math.min(n + BLOQUES_POR_TANDA, bloques.length)),
    [bloques.length],
  )
  const centinelaRef = useScrollInfinito({ hayMas, alLlegar: mostrarMas, clave: cuantosBloques })

  /* Cola de fotos (colaFotos.js): héroe → primeras tarjetas → segunda foto
     del héroe y el resto. Las "primeras" son las que se ven justo debajo del
     héroe: hasta 2 del rail de abiertos y el resto de la lista "Cerca de ti". */
  const primeras = useMemo(() => {
    const ids = abiertos.slice(0, 2).map((l) => l.id)
    const lista = bloques.find((b) => b.tipo === 'lista')
    for (const l of lista?.items ?? []) {
      if (ids.length >= PRIMERAS) break
      ids.push(l.id)
    }
    return new Set(ids)
  }, [abiertos, bloques])

  const [fase, setFase] = useState(0)
  const cargadasRef = useRef(new Set())
  const avisarHeroe = useCallback(() => setFase((f) => Math.max(f, 1)), [])
  const avisar = useCallback(
    (id) => {
      cargadasRef.current.add(id)
      if ([...primeras].every((p) => cargadasRef.current.has(p))) setFase((f) => Math.max(f, 2))
    },
    [primeras],
  )
  /* Topes: una foto lenta o rota no bloquea a las siguientes. */
  useEffect(() => {
    if (fase >= 2) return undefined
    const espera = fase === 0 ? ESPERA_HEROE_MS : primeras.size ? ESPERA_PRIMERAS_MS : 0
    const id = window.setTimeout(() => setFase((f) => Math.max(f, fase + 1)), espera)
    return () => window.clearTimeout(id)
  }, [fase, primeras])
  const cola = useMemo(() => ({ fase, primeras, avisar, avisarHeroe }), [fase, primeras, avisar, avisarHeroe])

  const saludo = saludoDeLaHora(hora)
  /* La lupa solo busca algo escrito: vacía no lleva a ningún sitio. */
  const hayTexto = query.trim().length > 0
  const buscar = () => {
    if (hayTexto) navigate(`/buscar?q=${encodeURIComponent(query.trim())}`)
  }
  const aplicarFiltros = () => navigate('/buscar', { state: { filtros } })

  return (
    <ColaFotosContext.Provider value={cola}>
    <section className="descubre">
      <FondoDescubre />

      <div className="descubre-contenido">
        <div className={`descubre-search-wrap${buscadorOculto ? ' descubre-search-wrap--oculto' : ''}`}>
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
              onFocus={() => setEscribiendo(true)}
              onBlur={() => setEscribiendo(false)}
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
            <button className="search-submit" type="submit" aria-label="Buscar" disabled={!hayTexto}>
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

          {bloques.slice(0, cuantosBloques).map((bloque) =>
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

          {/* Centinela del scroll infinito: cuando se acerca a la pantalla
              entra la siguiente tanda. Lleva tarjetas-esqueleto por si la
              persona baja más rápido de lo que se pinta (y, con backend,
              mientras llega la página siguiente). */}
          {hayMas ? (
            <div ref={centinelaRef} className="descubre-centinela">
              <ListaEsqueleto cantidad={2} />
            </div>
          ) : null}
        </div>

        {!hayMas ? (
          <div className="descubre-opinion">
            <LlamadaOpinion />
          </div>
        ) : null}
      </div>

      {/* Cuando se acaban los locales: Taly descansa en la hoguera. */}
      {!hayMas ? (
        <Suspense fallback={null}>
          <PieDePagina />
        </Suspense>
      ) : null}

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
    </ColaFotosContext.Provider>
  )
}

export default Descubre
