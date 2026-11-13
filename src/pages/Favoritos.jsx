import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Compass } from 'lucide-react'
import TarjetaFavorito from '../components/Favoritos/TarjetaFavorito.jsx'
import Taly from '../components/Taly/Taly.jsx'
import { getLocalById } from '../services/locales.js'
import { FAVORITOS_EVENTO, getFavoritos } from '../services/favoritos.js'
import { estadoApertura } from '../utils/descubre.js'
import './favoritos.css'

/* Favoritos: los sitios que guardaste con el corazón, como un tablero de
   polaroids. Se entra desde el cartel de los tres puntos.

   La lista que se pinta es la de cuando entraste MÁS los que vayas
   añadiendo. Si quitas uno, su polaroid se queda apagada hasta que te vas:
   así un toque sin querer se deshace con otro, sin un aviso aparte. */

const FILTROS = [
  { id: 'todos', label: 'Todos' },
  { id: 'abiertos', label: 'Abiertos ahora' },
]

function Favoritos() {
  const navigate = useNavigate()
  const [vivos, setVivos] = useState(getFavoritos)
  const [vistos, setVistos] = useState(getFavoritos)
  const [filtro, setFiltro] = useState('todos')

  useEffect(() => {
    const sync = () => {
      const ahora = getFavoritos()
      setVivos(ahora)
      /* Los nuevos entran delante; los quitados se quedan en su sitio. */
      setVistos((antes) => [...ahora.filter((id) => !antes.includes(id)), ...antes])
    }
    window.addEventListener(FAVORITOS_EVENTO, sync)
    window.addEventListener('storage', sync)
    return () => {
      window.removeEventListener(FAVORITOS_EVENTO, sync)
      window.removeEventListener('storage', sync)
    }
  }, [])

  const locales = useMemo(
    () =>
      vistos
        .map((id) => getLocalById(id))
        .filter(Boolean)
        .map((local) => ({ local, abierto: estadoApertura(local).abierto })),
    [vistos],
  )

  const guardados = locales.filter(({ local }) => vivos.includes(local.id))
  const abiertos = guardados.filter((l) => l.abierto).length
  const lista = filtro === 'abiertos' ? locales.filter((l) => l.abierto) : locales

  /* Venir de un enlace directo deja el historial vacío: entonces "Volver"
     lleva a Descubre en vez de sacar de la app. */
  const volver = () => {
    if (window.history.state?.idx > 0) navigate(-1)
    else navigate('/')
  }

  return (
    <section className="favs" aria-labelledby="favs-titulo">
      <header className="favs-barra">
        <button type="button" className="favs-volver" onClick={volver} aria-label="Volver">
          <ArrowLeft size={19} strokeWidth={2.25} aria-hidden="true" />
        </button>
        <h1 className="favs-barra-titulo" id="favs-titulo">
          Favoritos
        </h1>
      </header>

      {locales.length === 0 ? (
        <div className="favs-vacio">
          <Taly escena="vacio" tamano={64} encuadre="compacto" />
          <h2>Todavía no guardas ningún sitio</h2>
          <p>Toca el corazón de un local que te guste y lo tendrás aquí, a mano para la próxima vez.</p>
          <button type="button" className="favs-vacio-boton" onClick={() => navigate('/')}>
            <Compass size={18} strokeWidth={2.3} aria-hidden="true" />
            Ir a Descubre
          </button>
        </div>
      ) : (
        <>
          <div className="favs-cabecera">
            <span className="eyebrow">Tu rincón</span>
            <h2 className="favs-titulo">Los sitios que te gustan</h2>
            <p className="favs-resumen">
              {guardados.length} {guardados.length === 1 ? 'guardado' : 'guardados'}
              {abiertos > 0 && (
                <>
                  <span className="favs-resumen-punto" aria-hidden="true" />
                  <span className="favs-resumen-abiertos">
                    {abiertos} {abiertos === 1 ? 'abierto' : 'abiertos'} ahora
                  </span>
                </>
              )}
            </p>

            <div className="favs-filtros" role="radiogroup" aria-label="Filtrar favoritos">
              {FILTROS.map((f) => (
                <button
                  key={f.id}
                  type="button"
                  role="radio"
                  aria-checked={filtro === f.id}
                  className={`favs-filtro${filtro === f.id ? ' favs-filtro--activo' : ''}`}
                  onClick={() => setFiltro(f.id)}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {lista.length === 0 ? (
            <p className="favs-nada">Ahora mismo no hay ninguno abierto. Prueba un poco más tarde.</p>
          ) : (
            /* La key del tablero reinicia la caída de las fotos al filtrar. */
            <div className="favs-tablero" key={filtro}>
              {lista.map(({ local }, i) => (
                <TarjetaFavorito key={local.id} local={local} indice={i} quitada={!vivos.includes(local.id)} />
              ))}
            </div>
          )}
        </>
      )}
    </section>
  )
}

export default Favoritos
