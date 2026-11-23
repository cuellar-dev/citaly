import { useEffect, useState } from 'react'
import { Check, Mail, Trash2 } from 'lucide-react'
import TalyPixel from '../../Ayuda/TalyPixel.jsx'
import { getTipo } from '../../../data/tiposLocal.js'
import { hayApi } from '../../../services/api.js'
import { SEGUNDOS_REVISION_DEMO, aprobarMiLocal, borrarMiLocal, sincronizarMisLocales } from '../../../services/misLocales.js'
import '../../NuevoLocal/asistente.css'
import './miLocal.css'

/* Mi Negocio mientras el local está en revisión: qué está pasando, cuánto
   suele tardar y qué viene después. En la demo se aprueba solo a los pocos
   segundos (o con el botón), porque no hay nadie revisando de verdad. */

function restantes(local) {
  const pasado = (Date.now() - new Date(local.creadoEn).getTime()) / 1000
  return Math.max(0, Math.ceil(SEGUNDOS_REVISION_DEMO - pasado))
}

function EstadoRevision({ local, onCambio }) {
  const [quedan, setQuedan] = useState(() => restantes(local))
  const [retirando, setRetirando] = useState(false)
  const tipo = getTipo(local.tipo)

  const [errorRetirar, setErrorRetirar] = useState(null)

  useEffect(() => {
    /* Con backend: se pregunta al servidor cada poco si ya lo aprobaron. */
    if (hayApi) {
      const reloj = window.setInterval(() => {
        sincronizarMisLocales()
          .then(() => onCambio())
          .catch(() => {})
      }, 10000)
      return () => window.clearInterval(reloj)
    }
    const reloj = window.setInterval(() => {
      const r = restantes(local)
      setQuedan(r)
      if (r === 0) {
        window.clearInterval(reloj)
        aprobarMiLocal(local.id)
        onCambio()
      }
    }, 1000)
    return () => window.clearInterval(reloj)
  }, [local, onCambio])

  const aprobarYa = () => {
    aprobarMiLocal(local.id)
    onCambio()
  }

  const retirar = async () => {
    setErrorRetirar(null)
    try {
      await borrarMiLocal(local.id)
      onCambio({ eliminado: true })
    } catch (error) {
      setErrorRetirar(error?.message || 'No se pudo retirar. Prueba otra vez.')
    }
  }

  return (
    <section className="mi-local-estado" aria-labelledby="mi-local-revision-titulo">
      <div className="mi-local-estado-cabeza">
        <span className="mi-local-estado-taly" aria-hidden="true">
          <TalyPixel estado="pregunta" />
        </span>
        <span className="mi-local-estado-sello mi-local-estado-sello--amarillo">En revisión</span>
        <h2 id="mi-local-revision-titulo" className="mi-local-estado-titulo">
          Estamos revisando {local.localName}
        </h2>
        <p className="mi-local-estado-texto">
          Una persona del equipo comprueba que el local existe y que los datos tienen sentido. Mientras, no sale en
          Citaly.
        </p>
      </div>

      <ol className="linea-tiempo">
        <li data-estado="hecho">
          <span className="linea-tiempo-punto">
            <Check size={14} strokeWidth={3.2} aria-hidden="true" />
          </span>
          <p>
            <strong>Enviado</strong>
            <span>Recibimos tus datos.</span>
          </p>
        </li>
        <li data-estado="ahora">
          <span className="linea-tiempo-punto" />
          <p>
            <strong>Revisión humana</strong>
            <span>Suele tardar menos de 48 horas. Puede que te escribamos al WhatsApp {local.whatsapp} para confirmar.</span>
          </p>
        </li>
        <li>
          <span className="linea-tiempo-punto" />
          <p>
            <strong>Te avisamos</strong>
            <span>
              Al correo <b>{local.correoContacto}</b> y aquí mismo.
            </span>
          </p>
        </li>
        <li>
          <span className="linea-tiempo-punto" />
          <p>
            <strong>Completas tu ficha</strong>
            <span>Horario, lo que ofreces, fotos y el punto en el mapa.</span>
          </p>
        </li>
      </ol>

      <dl className="resumen-lista">
        <div className="resumen-fila">
          <dt>Tipo</dt>
          <dd>{tipo?.nombre}</dd>
        </div>
        <div className="resumen-fila">
          <dt>Categoría</dt>
          <dd>{local.categoria}</dd>
        </div>
        <div className="resumen-fila">
          <dt>Dirección</dt>
          <dd>{local.direccion}</dd>
        </div>
      </dl>

      {!hayApi && (
        <div className="mi-local-demo">
          <p>
            <b>Solo en la demo:</b> no hay nadie revisando, así que se aprueba solo en{' '}
            <span className="mi-local-demo-cuenta">{quedan} s</span>.
          </p>
          <button type="button" className="boton-suave boton-suave--verde" onClick={aprobarYa}>
            <Mail size={16} strokeWidth={2.3} aria-hidden="true" />
            Aprobar ya
          </button>
        </div>
      )}

      {retirando ? (
        <div className="mi-local-retirar">
          <p>¿Retiras la solicitud? Se borra lo que enviaste y tendrías que empezar de nuevo.</p>
          {errorRetirar && <p role="alert">{errorRetirar}</p>}
          <div>
            <button type="button" className="boton-suave" onClick={() => setRetirando(false)}>
              No, déjalo
            </button>
            <button type="button" className="boton-suave mi-local-peligro" onClick={retirar}>
              Sí, retirar
            </button>
          </div>
        </div>
      ) : (
        <button type="button" className="mi-local-enlace-peligro" onClick={() => setRetirando(true)}>
          <Trash2 size={15} strokeWidth={2.3} aria-hidden="true" />
          Retirar la solicitud
        </button>
      )}
    </section>
  )
}

export default EstadoRevision
