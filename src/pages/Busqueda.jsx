import { useEffect, useMemo, useRef, useState } from 'react'
import { ArrowLeft, Clock, Footprints, Search, SlidersHorizontal, Trophy, X } from 'lucide-react'
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import TarjetaLocal from '../components/TarjetaLocal/TarjetaLocal.jsx'
import CarruselLocales from '../components/Busqueda/CarruselLocales.jsx'
import PanelFiltros from '../components/Filtros/PanelFiltros.jsx'
import TalyMomento from '../components/Taly/TalyMomento.jsx'
import talyBuscando from '../components/Taly/taly-buscando-animado.svg'
import talySinResultados from '../components/Taly/taly-sin-resultados-animado.svg'
import { getAllLocales } from '../services/locales.js'
import { estaAbierto } from '../utils/fichaLocal.js'
import { notaLocal } from '../utils/descubre.js'
import {
  buscarLocales,
  coincideFiltros,
  filtrosIniciales,
  hayFiltrosActivos,
  resumenFiltros,
} from '../utils/busqueda.js'
import './Busqueda.css'

const ESPERA_TECLEO = 400

function Busqueda() {
  const navigate = useNavigate()
  const location = useLocation()
  const [params, setParams] = useSearchParams()
  const locales = useMemo(() => getAllLocales(), [])

  const [query, setQuery] = useState(() => params.get('q') || '')
  const [busqueda, setBusqueda] = useState(() => params.get('q') || '')
  const filtrosDeRuta = location.state?.filtros || filtrosIniciales
  const [filtros, setFiltros] = useState(filtrosDeRuta)
  const [filtrosAplicados, setFiltrosAplicados] = useState(filtrosDeRuta)
  const [filtrosAbiertos, setFiltrosAbiertos] = useState(false)
  const temporizadorRef = useRef(null)

  /* El tecleo espera; la lupa y el Enter no. Antes el botón de buscar hacía lo
     mismo que el debounce y además no lo cancelaba, así que medio segundo
     después el efecto volvía a dispararse encima. */
  useEffect(() => {
    temporizadorRef.current = window.setTimeout(() => {
      setBusqueda(query.trim())
    }, ESPERA_TECLEO)
    return () => window.clearTimeout(temporizadorRef.current)
  }, [query])

  /* La URL sigue a la búsqueda ya confirmada, no a cada tecla. */
  useEffect(() => {
    setParams(busqueda ? { q: busqueda } : {}, { replace: true })
  }, [busqueda, setParams])

  const tecleando = query.trim() !== busqueda

  function buscarYa() {
    window.clearTimeout(temporizadorRef.current)
    setBusqueda(query.trim())
  }

  const resultados = useMemo(() => {
    const porTexto = buscarLocales(locales, busqueda)
    return porTexto.filter((local) => coincideFiltros(local, filtrosAplicados))
  }, [locales, busqueda, filtrosAplicados])

  /* Varias filas con criterios distintos, para que debajo de los resultados
     siga habiendo algo que mirar. Cada local aparece UNA sola vez en toda la
     pantalla: lo que ya salió arriba no se repite abajo, y lo que entra en una
     fila no entra en la siguiente. Antes había dos carruseles que mostraban
     los mismos locales que ya estaban listados. */
  const filas = useMemo(() => {
    const usados = new Set(resultados.map((l) => l.id))
    const libres = () => locales.filter((local) => !usados.has(local.id))

    const tomar = (lista, cuantos = 8) => {
      const elegidos = lista.slice(0, cuantos)
      elegidos.forEach((local) => usados.add(local.id))
      return elegidos
    }

    const mejores = tomar(
      libres()
        .map((local) => ({ local, nota: notaLocal(local).nota }))
        .sort((a, b) => b.nota - a.nota)
        .filter((x) => x.nota > 0)
        .map((x) => x.local),
      6,
    )

    const abiertos = tomar(libres().filter((local) => estaAbierto(local)), 6)

    /* "Te pudieran gustar": del mismo tipo que lo que estás mirando. Si no hay
       búsqueda, los más cercanos, que es la otra razón natural para ir. */
    const categoriasVistas = new Set(resultados.map((l) => l.categoria))
    const afines = categoriasVistas.size
      ? libres().filter((local) => categoriasVistas.has(local.categoria))
      : [...libres()].sort((a, b) => (Number(a.metros) || 0) - (Number(b.metros) || 0))

    const parecidos = tomar(afines, 6)

    return [
      {
        id: 'mejores',
        icono: Trophy,
        eyebrow: 'Los mejores puntuados',
        titulo: 'Los que más gustan',
        locales: mejores,
      },
      {
        id: 'abiertos',
        icono: Clock,
        eyebrow: 'Con las puertas abiertas',
        titulo: 'Puedes ir ahora mismo',
        locales: abiertos,
      },
      {
        id: 'parecidos',
        icono: Footprints,
        eyebrow: categoriasVistas.size ? 'Del mismo estilo' : 'A un paso',
        titulo: 'Te pudieran gustar',
        locales: parecidos,
      },
    ].filter((fila) => fila.locales.length > 0)
  }, [locales, resultados])

  const chips = resumenFiltros(filtrosAplicados)
  const conFiltros = hayFiltrosActivos(filtrosAplicados)

  function quitarChip(chip) {
    const siguiente = { ...filtrosAplicados, [chip.campo]: chip.valor }
    setFiltros(siguiente)
    setFiltrosAplicados(siguiente)
  }

  function limpiarTodo() {
    window.clearTimeout(temporizadorRef.current)
    setFiltros(filtrosIniciales)
    setFiltrosAplicados(filtrosIniciales)
    setQuery('')
    setBusqueda('')
  }

  const aplicarFiltros = () => {
    setFiltrosAplicados(filtros)
    setFiltrosAbiertos(false)
  }

  /* El vacío explica la causa real. Antes decía siempre "no hay lugares con
     ese nombre", aunque no hubieras escrito nada y el problema fueran los
     filtros. */
  const vacio = busqueda
    ? {
        titulo: `Nada con “${busqueda}”`,
        texto: conFiltros
          ? 'No encontramos ese lugar con los filtros que tienes puestos.'
          : 'Probamos con el nombre, la categoría, la zona y los servicios y no hubo suerte.',
      }
    : {
        titulo: 'Ningún lugar pasa esos filtros',
        texto: 'Afloja alguno y vuelve a mirar.',
      }

  return (
    <section className="busqueda">
      <header className="busqueda-header">
        <button
          className="busqueda-volver"
          type="button"
          onClick={() => navigate(-1)}
          aria-label="Volver"
        >
          <ArrowLeft size={19} strokeWidth={2.2} />
        </button>
        <div className="busqueda-header-textos">
          <span className="busqueda-eyebrow">Explora Citaly</span>
          <h1>Buscar lugares</h1>
        </div>
      </header>

      <div className="busqueda-barra-wrap">
        <form
          className="busqueda-barra"
          onSubmit={(e) => {
            e.preventDefault()
            buscarYa()
          }}
        >
          <Search size={18} strokeWidth={2.2} className="busqueda-barra-lupa" aria-hidden="true" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Nombre, tipo de lugar, zona o servicio"
            aria-label="Buscar lugares"
            enterKeyHint="search"
          />
          {query ? (
            <button
              className="busqueda-limpiar"
              type="button"
              onClick={() => setQuery('')}
              aria-label="Borrar lo escrito"
            >
              <X size={16} strokeWidth={2.4} />
            </button>
          ) : null}
          <button
            className={`busqueda-filtros${conFiltros ? ' busqueda-filtros--activos' : ''}`}
            type="button"
            onClick={() => setFiltrosAbiertos(true)}
            aria-label={conFiltros ? `Filtros, ${chips.length} activos` : 'Abrir filtros'}
          >
            <SlidersHorizontal size={17} strokeWidth={2.2} />
            {conFiltros ? <span className="busqueda-filtros-punto" aria-hidden="true" /> : null}
          </button>
        </form>

        {chips.length > 0 && (
          <div className="busqueda-chips" aria-label="Filtros activos">
            {chips.map((chip) => (
              <button
                key={chip.campo}
                type="button"
                className="busqueda-chip"
                onClick={() => quitarChip(chip)}
                aria-label={`Quitar filtro ${chip.texto}`}
              >
                {chip.texto}
                <X size={12} strokeWidth={3} aria-hidden="true" />
              </button>
            ))}
            <button type="button" className="busqueda-chip busqueda-chip--limpiar" onClick={limpiarTodo}>
              Limpiar
            </button>
          </div>
        )}
      </div>

      <div className="busqueda-cuerpo">
        <section className="busqueda-resultados">
          <header className="busqueda-seccion-cabecera">
            <div>
              <span className="busqueda-eyebrow">
                {busqueda ? `Resultados para “${busqueda}”` : 'Todo el catálogo'}
              </span>
              <h2>{busqueda ? 'Lo que encontramos' : 'Lugares para ti'}</h2>
            </div>
            {/* El contador se calla mientras escribes: antes enseñaba el número
                de la búsqueda anterior como si fuera el de la nueva. */}
            {!tecleando ? (
              <span className="busqueda-cuenta">{resultados.length}</span>
            ) : null}
          </header>

          {tecleando ? (
            <div className="busqueda-estado">
              <TalyMomento
                ilustracion={<img src={talyBuscando} alt="" />}
                titulo="Buscando lugares..."
                texto="Un segundo, que Taly revisa los nombres."
              />
            </div>
          ) : resultados.length ? (
            <div className="busqueda-grid">
              {resultados.map((local) => (
                <TarjetaLocal key={local.id} {...local} />
              ))}
            </div>
          ) : (
            <div className="busqueda-estado">
              <TalyMomento
                ilustracion={<img src={talySinResultados} alt="Taly no encontró resultados" />}
                titulo={vacio.titulo}
                texto={vacio.texto}
                accion={conFiltros ? 'Quitar los filtros' : 'Ver todos los lugares'}
                onAccion={limpiarTodo}
                accionSecundaria="Ajustar filtros"
                onAccionSecundaria={() => setFiltrosAbiertos(true)}
              />
            </div>
          )}
        </section>

        {/* Las filas de abajo: cada una con su criterio y sin repetir ningún
            local, ni entre ellas ni con los resultados de arriba. */}
        {filas.map((fila) => (
          <section key={fila.id} className="busqueda-fila">
            <header className="busqueda-seccion-cabecera">
              <div>
                <span className="busqueda-eyebrow">
                  <fila.icono size={12} strokeWidth={2.4} aria-hidden="true" />
                  {fila.eyebrow}
                </span>
                <h2>{fila.titulo}</h2>
              </div>
              <span className="busqueda-cuenta busqueda-cuenta--suave">{fila.locales.length}</span>
            </header>
            <CarruselLocales
              locales={fila.locales}
              onSelect={(local) => navigate(`/local/${local.id}`)}
              etiqueta={fila.titulo}
            />
          </section>
        ))}
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

export default Busqueda
