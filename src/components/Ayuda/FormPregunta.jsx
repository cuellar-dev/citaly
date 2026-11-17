import { useEffect, useId, useState } from 'react'
import { Hourglass, Send } from 'lucide-react'
import TalyPixel from './TalyPixel.jsx'
import {
  LIMITE,
  anotarEnvio,
  enviosRecientes,
  esperaRestante,
  guardarMensaje,
  textoEspera,
  ultimoTexto,
} from '../../utils/limiteEnvios.js'
import './formPregunta.css'

/* El formulario de siempre al pie de las preguntas frecuentes: si tu duda
   no estaba, nos la mandas. Sin ánimos ni interruptor (eso vive en la
   página de Opinión): pregunta, correo para contestarte y enviar.

   Taly asoma pensativo, con el ala en la barbilla y un interrogante encima. */

const CLAVE = 'citaly_preguntas'
const CLAVE_ENVIOS = 'citaly_preguntas_envios'
const MINIMO = 10

function FormPregunta() {
  const [texto, setTexto] = useState('')
  const [correo, setCorreo] = useState('')
  const [error, setError] = useState('')
  const [enviada, setEnviada] = useState(false)
  const [espera, setEspera] = useState(() => esperaRestante(CLAVE_ENVIOS))
  const id = useId()

  useEffect(() => {
    if (!espera) return undefined
    const t = window.setInterval(() => setEspera(esperaRestante(CLAVE_ENVIOS)), 1000)
    return () => window.clearInterval(t)
  }, [espera])

  const frenado = espera > 0
  const quedan = LIMITE - enviosRecientes(CLAVE_ENVIOS).length

  const enviar = (e) => {
    e.preventDefault()
    const restante = esperaRestante(CLAVE_ENVIOS)
    if (restante) {
      setEspera(restante)
      return
    }
    const limpio = texto.trim()
    if (limpio.length < MINIMO) {
      setError(`Escribe tu pregunta con un poco más de detalle (al menos ${MINIMO} letras).`)
      return
    }
    if (limpio === ultimoTexto(CLAVE)) {
      setError('Esta pregunta ya nos llegó. Te contestamos pronto.')
      return
    }
    guardarMensaje(CLAVE, { texto: limpio, correo: correo.trim() || null, enviadaEn: new Date().toISOString() })
    anotarEnvio(CLAVE_ENVIOS)
    setEspera(esperaRestante(CLAVE_ENVIOS))
    setEnviada(true)
  }

  const otra = () => {
    setTexto('')
    setError('')
    setEnviada(false)
  }

  const freno = frenado && (
    <p className="pregunta-freno" role="status">
      <Hourglass size={15} strokeWidth={2.4} aria-hidden="true" />
      Ya nos mandaste {LIMITE} seguidas. Podrás enviar otra en {textoEspera(espera)}.
    </p>
  )

  return (
    <div className="pregunta-form-marco">
      <span className="pregunta-taly">
        <TalyPixel estado="pregunta" />
      </span>

      <h2 className="pregunta-titulo">¿No estaba tu pregunta ahí?</h2>
      <p className="pregunta-ayuda">Envíanosla en este formulario y te respondemos. Si es de las que se repiten, la sumamos a la lista.</p>

      {enviada ? (
        <div className="pregunta-enviada" role="status">
          <strong>¡Pregunta enviada!</strong>
          <span>
            {correo.trim() ? `Te contestamos a ${correo.trim()} en cuanto podamos.` : 'Sin correo no podemos contestarte directamente, pero la leemos.'}
          </span>
          {freno || (
            <button type="button" className="pregunta-boton pregunta-boton--suave" onClick={otra}>
              Hacer otra pregunta
            </button>
          )}
        </div>
      ) : (
        <form className="pregunta-form" onSubmit={enviar} noValidate>
          <label className="pregunta-campo" htmlFor={`${id}-texto`}>
            Tu pregunta
          </label>
          <textarea
            id={`${id}-texto`}
            value={texto}
            onChange={(e) => {
              setTexto(e.target.value)
              if (error) setError('')
            }}
            placeholder="¿Cómo puedo…?"
            rows={4}
            maxLength={600}
            aria-invalid={Boolean(error)}
            aria-describedby={error ? `${id}-error` : undefined}
          />
          {error && (
            <span className="pregunta-error" id={`${id}-error`}>
              {error}
            </span>
          )}

          <label className="pregunta-campo" htmlFor={`${id}-correo`}>
            Tu correo <span>(para responderte)</span>
          </label>
          <input
            id={`${id}-correo`}
            type="email"
            value={correo}
            onChange={(e) => setCorreo(e.target.value)}
            placeholder="tu@correo.com"
            autoComplete="email"
            inputMode="email"
          />

          {freno || (quedan === 1 && <p className="pregunta-aviso">Te queda 1 pregunta en estos 5 minutos.</p>)}

          <button type="submit" className="pregunta-boton" disabled={frenado}>
            <Send size={16} strokeWidth={2.4} aria-hidden="true" />
            Enviar pregunta
          </button>
        </form>
      )}
    </div>
  )
}

export default FormPregunta
