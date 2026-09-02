import Taly from './Taly.jsx'
import './talyMomento.css'

/**
 * Estado ilustrado de la app con Taly.
 * Una sola composición: mascota + título + texto + CTA opcional.
 */
function TalyMomento({
  escena = 'hero',
  pose,
  objetos,
  titulo,
  texto,
  accion,
  onAccion,
  accionSecundaria,
  onAccionSecundaria,
  tamano = 16,
  brillo = true,
  className = '',
}) {
  return (
    <section className={`taly-momento ${className}`.trim()}>
      <div className='taly-momento-figura'>
        <Taly
          escena={escena}
          pose={pose}
          objetos={objetos}
          tamano={tamano}
          brillo={brillo}
          encuadre='compacto'
          titulo={titulo || 'Taly'}
        />
      </div>
      {titulo ? <h2 className='taly-momento-titulo'>{titulo}</h2> : null}
      {texto ? <p className='taly-momento-texto'>{texto}</p> : null}
      {(accion || accionSecundaria) ? (
        <div className='taly-momento-acciones'>
          {accion ? (
            <button type='button' className='taly-momento-boton' onClick={onAccion}>
              {accion}
            </button>
          ) : null}
          {accionSecundaria ? (
            <button
              type='button'
              className='taly-momento-boton taly-momento-boton--suave'
              onClick={onAccionSecundaria}
            >
              {accionSecundaria}
            </button>
          ) : null}
        </div>
      ) : null}
    </section>
  )
}

export default TalyMomento
