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
import { ATAJOS, construirDescubre } from '../utils/ranking/index.js'
import { UBICACION_EVENTO, getUbicacion } from '../services/ubicacion.js'
import LlamadaCerca from '../components/Descubre/LlamadaCerca.jsx'
import { construirPerfil } from '../utils/ranking/perfil.js'
import { conExposicionGlobal, exposicionDe } from '../utils/ranking/exposicion.js'
import { inicioDelDia, semillaDelDia } from '../utils/ranking/semilla.js'
import { getCitas } from '../services/storage.js'
import { getImpresiones } from '../services/impresiones.js'
import { contarFiltro, getUsoFiltros } from '../services/usoFiltros.js'
import { getAnonimoId } from '../services/identidad.js'
import { hayApi } from '../services/api.js'
import { cargarResumen } from '../services/descubreApi.js'
import { useImpresiones } from '../hooks/useImpresiones.js'
import { useOcultarAlBajar } from '../hooks/useOcultarAlBajar.js'
import { useScrollInfinito } from '../hooks/useScrollInfinito.js'
import { filtrosIniciales, normalizar } from '../utils/busqueda.js'
import './Descubre.css'

/* El pie (la hoguera de Taly, un canvas con su animación) solo sale cuando se
   acaban los lugares: se descarga entonces y no al abrir Descubre. */
const PieDePagina = lazy(() => import('../components/Pie/PieDePagina.jsx'))

/* Modo depuración del ranking (?debug=ranking): solo en desarrollo, nunca
   llega a producción. Enseña por qué cada local está donde está. */
const DepuracionRanking = import.meta.env.DEV
  ? lazy(() => import('../components/Descubre/DepuracionRanking.jsx'))
  : null
const DEBUG_RANKING =
  import.meta.env.DEV && new URLSearchParams(window.location.search).get('debug') === 'ranking'

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
  /* De dónde salen los locales: del backend si hay VITE_API_URL, si no (o si
     falla) de los datos de demo, como siempre. Ver services/descubreApi.js. */
  const [fuente, setFuente] = useState(() =>
    hayApi ? { estado: 'cargando', locales: [] } : { estado: 'demo', locales: getAllLocales() },
  )
  useEffect(() => {
    if (!hayApi) return undefined
    let vivo = true
    cargarResumen()
      .then((lista) => {
        if (vivo) setFuente({ estado: lista.length ? 'api' : 'vacio', locales: lista })
      })
      .catch((error) => {
        console.warn('[Descubre] El backend no respondió; uso los datos de demo.', error)
        if (vivo) setFuente({ estado: 'demo', locales: getAllLocales() })
      })
    return () => {
      vivo = false
    }
  }, [])
  const locales = fuente.locales
  const cargando = fuente.estado === 'cargando'
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

  /* El orden de Descubre (utils/ranking): perfil del usuario + semilla del
     día + lo que ya ha visto. La hora se fija al entrar: mientras miras, el
     orden no se mueve; cambia al volver otro día (corte a las 5:00). */
  const [ahora] = useState(() => new Date())
  /* Las citas y favoritos guardan ids de locales; para saber de qué categoría
     son se miran los del feed y, si no están, los de demo. */
  const localesPerfil = useMemo(() => {
    const porId = new Map(getAllLocales().map((l) => [l.id, l]))
    locales.forEach((l) => porId.set(l.id, l))
    return [...porId.values()]
  }, [locales])
  const perfil = useMemo(
    () =>
      construirPerfil({
        citas: getCitas(),
        favoritos,
        filtrosUsados: getUsoFiltros(),
        locales: localesPerfil,
        ahora,
      }),
    [favoritos, localesPerfil, ahora],
  )
  /* Solo lo visto ANTES de hoy: lo que ves hoy no reordena el feed de hoy.
     Con backend se suma lo que vieron todos (local_exposicion). */
  const exposicion = useMemo(
    () => conExposicionGlobal(exposicionDe(getImpresiones(), inicioDelDia(ahora)), locales, inicioDelDia(ahora)),
    [ahora, locales],
  )
  /* Semilla del orden: por persona y día. Sin cuenta real todavía, la persona
     es el id anónimo de este navegador (services/identidad.js). */
  const semilla = useMemo(() => semillaDelDia(getAnonimoId(), ahora), [ahora])

  /* Dónde estás, solo si lo activaste con "Ver lo que tengo cerca". */
  const [ubicacion, setUbicacion] = useState(getUbicacion)
  useEffect(() => {
    const sync = () => setUbicacion(getUbicacion())
    window.addEventListener(UBICACION_EVENTO, sync)
    return () => window.removeEventListener(UBICACION_EVENTO, sync)
  }, [])

  /* Atajo de arriba (Comer, Cuidarte…): rehace el feed solo con eso. */
  const [atajo, setAtajo] = useState(null)
  const resultado = useMemo(
    () =>
      construirDescubre({
        locales,
        perfil,
        ahora,
        semilla,
        exposicion,
        favoritos,
        ubicacion,
        atajo,
      }),
    [locales, perfil, ahora, semilla, exposicion, favoritos, ubicacion, atajo],
  )
  const { heroLista, abiertos, bloques, motivos } = resultado

  const [cuantosBloques, setCuantosBloques] = useState(BLOQUES_INICIALES)
  /* Con otro atajo el feed es otro: se vuelve a empezar por arriba. */
  const elegirAtajo = (id) => {
    setAtajo((actual) => (actual === id ? null : id))
    setCuantosBloques(BLOQUES_INICIALES)
  }
  const hayMas = cuantosBloques < bloques.length
  const mostrarMas = useCallback(
    () => setCuantosBloques((n) => Math.min(n + BLOQUES_POR_TANDA, bloques.length)),
    [bloques.length],
  )
  const centinelaRef = useScrollInfinito({ hayMas, alLlegar: mostrarMas, clave: cuantosBloques })

  /* Qué tarjetas se ven y cuáles se tocan (services/impresiones.js). */
  const seccionesRef = useRef(null)
  useImpresiones(seccionesRef, `${fuente.estado}-${cuantosBloques}`, { semilla })

  /* Cola de fotos (colaFotos.js): héroe → primeras tarjetas → segunda foto
     del héroe y el resto. Las "primeras" son las que se ven justo debajo del
     héroe: hasta 2 del rail de abiertos y el resto de la primera lista. */
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
  const aplicarFiltros = () => {
    if (filtros.categoria !== filtrosIniciales.categoria) contarFiltro(filtros.categoria)
    navigate('/buscar', { state: { filtros } })
  }

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

        {/* Atajos: el feed entero solo con un tipo de sitio. */}
        <div className="descubre-atajos" role="group" aria-label="Ver solo">
          <button
            type="button"
            className={`descubre-atajo${atajo === null ? ' descubre-atajo--activo' : ''}`}
            aria-pressed={atajo === null}
            onClick={() => elegirAtajo(null)}
          >
            Todo
          </button>
          {ATAJOS.map((a) => (
            <button
              key={a.id}
              type="button"
              className={`descubre-atajo${atajo === a.id ? ' descubre-atajo--activo' : ''}`}
              aria-pressed={atajo === a.id}
              onClick={() => elegirAtajo(a.id)}
            >
              {a.etiqueta}
            </button>
          ))}
        </div>

        <div className="descubre-secciones" ref={seccionesRef}>
          {cargando ? <ListaEsqueleto cantidad={3} texto="Buscando lugares…" /> : null}
          {fuente.estado === 'vacio' ? (
            <p className="descubre-vacio">Todavía no hay lugares en tu zona. Vuelve pronto.</p>
          ) : null}

          <CarruselHeroe locales={heroLista} motivos={motivos} />

          {abiertos.length > 0 && (
            <RailDescubre titulo="Puedes ir ahora mismo" nota={`${abiertos.length} abiertos`}>
              {abiertos.map((local, i) => (
                <TarjetaLocalCompacta key={local.id} local={local} imp={{ bloque: 'abiertos', posicion: i }} />
              ))}
            </RailDescubre>
          )}

          {bloques.slice(0, cuantosBloques).map((bloque) =>
            bloque.tipo === 'cerca-cta' ? (
              <LlamadaCerca key={bloque.clave} titulo={bloque.titulo} taly={bloque.taly} />
            ) : bloque.tipo === 'lista' ? (
              <section className="descubre-lista" key={bloque.clave}>
                {bloque.titulo && (
                  <header className="descubre-lista-cabecera">
                    <h2>{bloque.titulo}</h2>
                    {bloque.subtitulo && <span>{bloque.subtitulo}</span>}
                  </header>
                )}
                <div className="descubre-lista-items">
                  {bloque.items.map((local, i) => (
                    <TarjetaLocal
                      key={local.id}
                      {...local}
                      motivo={motivos.get(local.id)}
                      imp={{ bloque: bloque.clave, posicion: i }}
                    />
                  ))}
                </div>
              </section>
            ) : (
              <RailDescubre key={bloque.clave} titulo={bloque.titulo} nota={bloque.nota} taly={bloque.taly}>
                {bloque.items.map((local, i) => (
                  <TarjetaLocalCompacta
                    key={local.id}
                    local={local}
                    etiqueta={bloque.etiquetas?.[local.id]}
                    imp={{ bloque: bloque.clave, posicion: i }}
                  />
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

        {!hayMas && !cargando ? (
          <div className="descubre-opinion">
            <LlamadaOpinion />
          </div>
        ) : null}
      </div>

      {/* Cuando se acaban los locales: Taly descansa en la hoguera. */}
      {!hayMas && !cargando ? (
        <Suspense fallback={null}>
          <PieDePagina />
        </Suspense>
      ) : null}

      {DEBUG_RANKING ? (
        <Suspense fallback={null}>
          <DepuracionRanking resultado={resultado} perfil={perfil} />
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
