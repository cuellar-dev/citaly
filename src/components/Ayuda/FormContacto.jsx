import { useEffect, useId, useRef, useState } from 'react'
import { Heart, Hourglass, Lightbulb, Megaphone, Send } from 'lucide-react'
import TalyPixel from './TalyPixel.jsx'
import {
  LIMITE,
  anotarEnvio as anotar,
  enviosRecientes as recientes,
  esperaRestante as restanteDe,
  guardarMensaje,
  textoEspera,
  ultimoTexto as ultimoDe,
} from '../../utils/limiteEnvios.js'
import './formContacto.css'

/* Formulario para escribirnos: una idea, algo que te gustó o una queja.

   Los tres tipos son el mismo formulario con distinto ánimo. El interruptor
   de arriba lo cambia, y con él cambian el color de todo (marco, foco,
   botón), los textos y la cara del Taly pixelado que asoma por la esquina.
   La queja pide además el local, que es lo primero que hace falta para
   poder mirarla.

   Todavía no hay servidor: el envío se guarda en localStorage para que se
   vea el flujo completo. */

const CLAVE = 'citaly_mensajes_soporte'
const MINIMO = 10
/* Como mucho 3 mensajes cada 5 minutos (utils/limiteEnvios.js). */
const CLAVE_ENVIOS = 'citaly_soporte_envios'
const enviosRecientes = () => recientes(CLAVE_ENVIOS)
const anotarEnvio = () => anotar(CLAVE_ENVIOS)
const esperaRestante = () => restanteDe(CLAVE_ENVIOS)
const ultimoTexto = () => ultimoDe(CLAVE)

const ESTADOS = [
  {
    id: 'sugerencia',
    label: 'Idea',
    Icono: Lightbulb,
    titulo: 'Tengo una idea',
    ayuda: '¿Qué echas de menos en Citaly? Lo leemos todo.',
    placeholder: 'Estaría genial poder…',
    boton: 'Enviar idea',
  },
  {
    id: 'bien',
    label: 'Me gusta',
    Icono: Heart,
    titulo: 'Algo que te gustó',
    ayuda: 'Cuéntanos qué funcionó. Nos alegra el día, de verdad.',
    placeholder: 'Me encantó que…',
    boton: 'Enviar',
  },
  {
    id: 'queja',
    label: 'Queja',
    Icono: Megaphone,
    titulo: 'Algo salió mal',
    ayuda: 'Cuéntanos qué pasó y lo miramos. Si fue con un local, dinos cuál.',
    placeholder: 'Tuve un problema con…',
    boton: 'Enviar queja',
  },
]

const guardar = (mensaje) => guardarMensaje(CLAVE, mensaje)

function FormContacto() {
  const [estado, setEstado] = useState('sugerencia')
  const [texto, setTexto] = useState('')
  const [correo, setCorreo] = useState('')
  const [local, setLocal] = useState('')
  const [error, setError] = useState('')
  const [enviado, setEnviado] = useState(false)
  const [espera, setEspera] = useState(() => esperaRestante())
  const opcionesRef = useRef([])
  const id = useId()

  /* Mientras hay que esperar, la cuenta atrás baja sola cada segundo. */
  useEffect(() => {
    if (!espera) return undefined
    const t = window.setInterval(() => setEspera(esperaRestante()), 1000)
    return () => window.clearInterval(t)
  }, [espera])

  const frenado = espera > 0
  const quedan = LIMITE - enviosRecientes().length

  const indice = ESTADOS.findIndex((e) => e.id === estado)
  const actual = ESTADOS[indice]

  /* Flechas izquierda y derecha mueven el interruptor, como un radio. */
  const alTeclear = (e) => {
    const paso = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0
    if (!paso) return
    e.preventDefault()
    const siguiente = (indice + paso + ESTADOS.length) % ESTADOS.length
    setEstado(ESTADOS[siguiente].id)
    opcionesRef.current[siguiente]?.focus()
  }

  const enviar = (e) => {
    e.preventDefault()
    const restante = esperaRestante()
    if (restante) {
      setEspera(restante)
      return
    }
    if (texto.trim().length < MINIMO) {
      setError(`Cuéntanos un poco más (al menos ${MINIMO} letras).`)
      return
    }
    if (texto.trim() === ultimoTexto()) {
      setError('Este mensaje ya nos llegó. Si quieres añadir algo, cámbialo un poco.')
      return
    }
    anotarEnvio()
    setEspera(esperaRestante())
    guardar({
      tipo: estado,
      texto: texto.trim(),
      correo: correo.trim() || null,
      local: estado === 'queja' ? local.trim() || null : null,
      enviadoEn: new Date().toISOString(),
    })
    setEnviado(true)
  }

  const otraVez = () => {
    setTexto('')
    setLocal('')
    setError('')
    setEnviado(false)
  }

  return (
    <div className={`contacto contacto--${estado}`}>
      <span className="contacto-taly">
        <TalyPixel estado={enviado ? 'bien' : estado} />
      </span>

      <div
        className="contacto-switch"
        role="radiogroup"
        aria-label="Qué nos quieres contar"
        style={{ '--indice': indice }}
        onKeyDown={alTeclear}
      >
        <span className="contacto-switch-pomo" aria-hidden="true" />
        {ESTADOS.map((op, i) => (
          <button
            key={op.id}
            ref={(el) => {
              opcionesRef.current[i] = el
            }}
            type="button"
            role="radio"
            aria-checked={estado === op.id}
            tabIndex={estado === op.id ? 0 : -1}
            className={`contacto-switch-op${estado === op.id ? ' contacto-switch-op--activa' : ''}`}
            onClick={() => setEstado(op.id)}
            disabled={enviado}
          >
            <op.Icono size={15} strokeWidth={2.4} aria-hidden="true" />
            {op.label}
          </button>
        ))}
      </div>

      {enviado ? (
        <div className="contacto-enviado" role="status">
          <h3 className="contacto-titulo">¡Recibido!</h3>
          <p className="contacto-ayuda">
            Gracias por escribirnos. {correo.trim() ? 'Te contestamos a tu correo en cuanto podamos.' : 'Lo leemos todo, aunque no nos dejes correo.'}
          </p>
          {frenado ? (
            <p className="contacto-freno" role="status">
              <Hourglass size={15} strokeWidth={2.4} aria-hidden="true" />
              Ya nos mandaste {LIMITE} seguidos. Podrás escribir otra vez en {textoEspera(espera)}.
            </p>
          ) : (
            <button type="button" className="contacto-enviar contacto-enviar--suave" onClick={otraVez}>
              Escribir otra cosa
            </button>
          )}
        </div>
      ) : (
        <form className="contacto-form" onSubmit={enviar} noValidate>
          {/* La key reinicia el fundido de los textos al cambiar de ánimo. */}
          <div className="contacto-cabeza" key={estado} aria-live="polite">
            <h3 className="contacto-titulo">{actual.titulo}</h3>
            <p className="contacto-ayuda">{actual.ayuda}</p>
          </div>

          {estado === 'queja' && (
            <label className="contacto-campo contacto-campo--entra">
              <span className="contacto-etiqueta">¿Con qué local? (opcional)</span>
              <input
                type="text"
                value={local}
                onChange={(e) => setLocal(e.target.value)}
                placeholder="Nombre del local"
                autoComplete="off"
              />
            </label>
          )}

          <label className="contacto-campo">
            <span className="contacto-etiqueta">Tu mensaje</span>
            <textarea
              value={texto}
              onChange={(e) => {
                setTexto(e.target.value)
                if (error) setError('')
              }}
              placeholder={actual.placeholder}
              rows={5}
              maxLength={1000}
              aria-invalid={Boolean(error)}
              aria-describedby={error ? `${id}-error` : undefined}
            />
            {error && (
              <span className="contacto-error" id={`${id}-error`}>
                {error}
              </span>
            )}
          </label>

          <label className="contacto-campo">
            <span className="contacto-etiqueta">Tu correo (si quieres respuesta)</span>
            <input
              type="email"
              value={correo}
              onChange={(e) => setCorreo(e.target.value)}
              placeholder="tu@correo.com"
              autoComplete="email"
              inputMode="email"
            />
          </label>

          {frenado ? (
            <p className="contacto-freno" role="status">
              <Hourglass size={15} strokeWidth={2.4} aria-hidden="true" />
              Ya nos mandaste {LIMITE} mensajes seguidos. Podrás enviar otro en {textoEspera(espera)}; lo que escribas no se pierde.
            </p>
          ) : (
            quedan === 1 && <p className="contacto-aviso">Te queda 1 mensaje en estos 5 minutos.</p>
          )}

          <button type="submit" className="contacto-enviar" disabled={frenado}>
            <Send size={16} strokeWidth={2.4} aria-hidden="true" />
            {actual.boton}
          </button>
        </form>
      )}
    </div>
  )
}

export default FormContacto
