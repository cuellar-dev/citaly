import { useMemo, useState } from 'react'
import { ArrowLeft, Search, X } from 'lucide-react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import TarjetaLocal from '../components/TarjetaLocal/TarjetaLocal.jsx'
import TalyMomento from '../components/Taly/TalyMomento.jsx'
import talySinResultados from '../components/Taly/taly-sin-resultados-animado.svg'
import { getAllLocales } from '../services/locales.js'
import { buscarLocales } from '../utils/busqueda.js'
import { leerSeccion } from '../utils/seccionDescubre.js'
import './Busqueda.css'

/* Lo que abre el «+» de una fila de Descubre: TODOS los locales que cumplen
   la condición de esa fila («Puedes ir ahora mismo», «Nuevos en Citaly»…),
   en el mismo orden, con un buscador para afinar dentro de ellos. Tiene la
   cara de Búsqueda para que se sienta parte de ella. */
function SeccionDescubre() {
  const { clave } = useParams()
  const location = useLocation()
  const navigate = useNavigate()
  const [query, setQuery] = useState('')

  const seccion = useMemo(() => leerSeccion(clave, location.state?.seccion), [clave, location.state])
  const locales = useMemo(() => {
    if (!seccion) return []
    const porId = new Map(getAllLocales().map((l) => [String(l.id), l]))
    return seccion.ids.map((id) => porId.get(String(id))).filter(Boolean)
  }, [seccion])

  const texto = query.trim()
  const visibles = useMemo(() => (texto ? buscarLocales(locales, texto) : locales), [locales, texto])

  if (!seccion) {
    return (
      <section className="busqueda">
        <div className="busqueda-estado">
          <TalyMomento
            ilustracion={<img src={talySinResultados} alt="" />}
            titulo="Esta lista ya no está"
            texto="Vuelve a Descubre y toca otra vez el «+» de la fila."
            accion="Ir a Descubre"
            onAccion={() => navigate('/')}
          />
        </div>
      </section>
    )
  }

  return (
    <section className="busqueda">
      <header className="busqueda-header">
        <button className="busqueda-volver" type="button" onClick={() => navigate(-1)} aria-label="Volver">
          <ArrowLeft size={19} strokeWidth={2.2} />
        </button>
        <div className="busqueda-header-textos">
          <span className="busqueda-eyebrow">{seccion.nota || 'Desde Descubre'}</span>
          <h1>{seccion.titulo}</h1>
        </div>
      </header>

      <div className="busqueda-barra-wrap">
        <form className="busqueda-barra" onSubmit={(e) => e.preventDefault()}>
          <Search size={18} strokeWidth={2.2} className="busqueda-barra-lupa" aria-hidden="true" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar en esta lista"
            aria-label={`Buscar en ${seccion.titulo}`}
            enterKeyHint="search"
          />
          {query ? (
            <button className="busqueda-limpiar" type="button" onClick={() => setQuery('')} aria-label="Borrar lo escrito">
              <X size={16} strokeWidth={2.4} />
            </button>
          ) : null}
        </form>
      </div>

      <div className="busqueda-cuerpo">
        <section className="busqueda-resultados">
          <header className="busqueda-seccion-cabecera">
            <div>
              <span className="busqueda-eyebrow">{texto ? `Con “${texto}”` : 'Todos los que cumplen'}</span>
              <h2>{texto ? 'Lo que encontramos' : 'La lista entera'}</h2>
            </div>
            <span className="busqueda-cuenta">{visibles.length}</span>
          </header>
          {visibles.length ? (
            <div className="busqueda-grid">
              {visibles.map((local) => (
                <TarjetaLocal key={local.id} {...local} />
              ))}
            </div>
          ) : (
            <div className="busqueda-estado">
              <TalyMomento
                ilustracion={<img src={talySinResultados} alt="" />}
                titulo={`Nada con “${texto}”`}
                texto="En esta lista no hay nada con ese nombre."
                accion="Ver la lista entera"
                onAccion={() => setQuery('')}
              />
            </div>
          )}
        </section>
      </div>
    </section>
  )
}

export default SeccionDescubre
