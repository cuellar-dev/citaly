import { useId, useState } from 'react'
import { Send, Star } from 'lucide-react'
import Opiniones from '../Opiniones/Opiniones.jsx'
import CaraRating, { ETIQUETAS_PUNTUACION } from '../CaraRating/CaraRating.jsx'
import TalyMomento from '../Taly/TalyMomento.jsx'
import TalyPluma from '../Taly/TalyPluma.jsx'
import talyBuscando from '../Taly/taly-buscando-animado.svg'
import './opinionesLocal.css'

/* Cuántas opiniones se ven antes de "Ver todas". */
const VISIBLES = 3
const NOTAS = [5, 4, 3, 2, 1]

const notaDe = (c) => Math.round(Number(c.calificacion) || 0)

/* Opiniones con su resumen arriba. Según Baymard, la gente se fía más de la
   distribución de notas que de los comentarios sueltos, y espera tocar una
   barra para ver solo esas: por eso cada barra es un filtro. */
function OpinionesLocal({
  comentarios,
  nota,
  cantidad,
  opinionPedida,
  comentarioNuevoId,
  puedeOpinar,
  onPublicar,
}) {
  const [filtro, setFiltro] = useState(null)
  /* Si la notificación apunta a una opinión que queda fuera de las primeras,
     la lista sale entera para que se pueda bajar hasta ella. */
  const [verTodas, setVerTodas] = useState(
    () => comentarios.findIndex((c) => c.id === opinionPedida) >= VISIBLES,
  )
  const [abierta, setAbierta] = useState(opinionPedida)

  const conteo = NOTAS.map((n) => ({ n, total: comentarios.filter((c) => notaDe(c) === n).length }))
  const filtradas = filtro ? comentarios.filter((c) => notaDe(c) === filtro) : comentarios
  const lista = verTodas || filtro ? filtradas : filtradas.slice(0, VISIBLES)
  const ocultas = filtradas.length - lista.length

  return (
    <div className="local-opiniones">
      {cantidad ? (
        <div className="local-opiniones-resumen">
          <div className="local-opiniones-media">
            <strong className="local-opiniones-nota">{nota}</strong>
            <span className="local-opiniones-estrellas" aria-hidden="true">
              {NOTAS.slice().reverse().map((n) => (
                <Star key={n} size={14} className={n <= Math.round(nota) ? 'local-opiniones-estrella--on' : ''} />
              ))}
            </span>
            <span className="local-opiniones-total">
              {cantidad} {cantidad === 1 ? 'opinión' : 'opiniones'}
            </span>
          </div>

          <div className="local-opiniones-barras" role="group" aria-label="Filtrar opiniones por estrellas">
            {conteo.map(({ n, total }) => (
              <button
                key={n}
                type="button"
                className={`local-opiniones-barra${filtro === n ? ' local-opiniones-barra--activa' : ''}`}
                aria-pressed={filtro === n}
                aria-label={`${n} ${n === 1 ? 'estrella' : 'estrellas'}: ${total} ${total === 1 ? 'opinión' : 'opiniones'}`}
                disabled={!total}
                onClick={() => setFiltro((prev) => (prev === n ? null : n))}
              >
                <span className="local-opiniones-barra-n">{n}</span>
                <Star size={11} aria-hidden="true" className="local-opiniones-barra-estrella" />
                <span className="local-opiniones-barra-pista" aria-hidden="true">
                  <span style={{ width: `${(total / cantidad) * 100}%` }} />
                </span>
                <span className="local-opiniones-barra-total">{total}</span>
              </button>
            ))}
          </div>
        </div>
      ) : (
        <TalyMomento
          className="local-opiniones-vacio"
          ilustracion={<img src={talyBuscando} alt="" />}
          titulo="Aún nadie ha opinado"
          texto="Cuando alguien venga y cuente cómo le fue, lo verás aquí."
        />
      )}

      {filtro ? (
        <p className="local-opiniones-filtro" aria-live="polite">
          Mostrando {filtradas.length} de {filtro} {filtro === 1 ? 'estrella' : 'estrellas'} ·{' '}
          <button type="button" onClick={() => setFiltro(null)}>
            Ver todas
          </button>
        </p>
      ) : null}

      {lista.length ? (
        <div className="local-opiniones-lista">
          {lista.map((c) => (
            <Opiniones
              key={c.id}
              id={`opinion-${c.id}`}
              destacada={c.id === opinionPedida}
              reciente={c.id === comentarioNuevoId}
              nombre={c.nombre}
              fecha={c.fecha}
              calificacion={c.calificacion}
              comentario={c.comentario}
              imagenPerfil={c.imagenPerfil}
              respuesta={c.respuesta}
              expandido={abierta === c.id}
              onToggle={() => setAbierta((prev) => (prev === c.id ? null : c.id))}
            />
          ))}
        </div>
      ) : null}

      {ocultas > 0 ? (
        <button type="button" className="local-opiniones-mas" onClick={() => setVerTodas(true)}>
          Ver las {filtradas.length} opiniones
        </button>
      ) : null}

      {puedeOpinar ? (
        <FormOpinion onPublicar={onPublicar} />
      ) : (
        <p className="local-opiniones-aviso">
          <TalyPluma tamano={30} />
          <span>Podrás opinar después de tu primera cita aquí.</span>
        </p>
      )}
    </div>
  )
}

/* Puntuar es un grupo de radios con aspecto de estrellas: se puede usar con
   teclado (flechas) y el lector de pantalla dice cuántas son y qué significan. */
function FormOpinion({ onPublicar }) {
  const grupo = useId()
  const idTexto = useId()
  const [texto, setTexto] = useState('')
  const [puntos, setPuntos] = useState(0)
  const [error, setError] = useState('')
  const [enviada, setEnviada] = useState(false)

  function enviar(e) {
    e.preventDefault()
    const comentario = texto.trim()
    if (!puntos) {
      setError('Elige de 1 a 5 estrellas.')
      return
    }
    if (!comentario) {
      setError('Escribe tu opinión antes de enviarla.')
      return
    }
    onPublicar({ comentario, calificacion: puntos })
    setTexto('')
    setPuntos(0)
    setError('')
    setEnviada(true)
  }

  return (
    <form className="local-opinar" onSubmit={enviar} noValidate>
      <h3 className="local-opinar-titulo">¿Cómo te fue?</h3>

      <fieldset className="local-opinar-puntos">
        <legend className="sr-only">Tu puntuación</legend>
        {[1, 2, 3, 4, 5].map((n) => (
          <label key={n} className={`local-opinar-estrella${puntos >= n ? ' local-opinar-estrella--on' : ''}`}>
            <input
              type="radio"
              name={grupo}
              value={n}
              checked={puntos === n}
              onChange={() => {
                setPuntos(n)
                setError('')
                setEnviada(false)
              }}
              className="sr-only"
            />
            <Star size={26} aria-hidden="true" />
            <span className="sr-only">
              {n} {n === 1 ? 'estrella' : 'estrellas'}: {ETIQUETAS_PUNTUACION[n]}
            </span>
          </label>
        ))}
        <CaraRating nivel={puntos} size={24} className="local-opinar-cara" />
        <span className="local-opinar-etiqueta" aria-hidden="true">
          {ETIQUETAS_PUNTUACION[puntos] ?? ''}
        </span>
      </fieldset>

      <label className="local-opinar-label" htmlFor={idTexto}>
        Cuéntales cómo te fue
      </label>
      <div className="local-opinar-caja">
        <textarea
          id={idTexto}
          className="local-opinar-texto"
          value={texto}
          rows={2}
          maxLength={600}
          placeholder="Lo que más te gustó, lo que mejorarías…"
          onChange={(e) => {
            setTexto(e.target.value)
            setError('')
            setEnviada(false)
          }}
        />
        <button type="submit" className="local-opinar-enviar" aria-label="Publicar opinión">
          <Send size={19} />
        </button>
      </div>

      {error ? (
        <p className="local-opinar-error" role="alert">
          {error}
        </p>
      ) : null}
      {enviada ? (
        <p className="local-opinar-gracias" role="status">
          ¡Gracias! Tu opinión ya está publicada.
        </p>
      ) : null}
    </form>
  )
}

export default OpinionesLocal
