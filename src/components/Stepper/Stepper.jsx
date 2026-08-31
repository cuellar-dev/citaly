
import './stepper.css'

function estadoPaso(paso, index, pasoActual) {
  if (paso.completo) return 'check'
  if (index === pasoActual) return 'alert'
  return 'x'
}

function StepperIcono({ estado }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={30}
      height={30}
      className={`steper-paso-icono ${estado}`}
      aria-hidden="true"
    >
      {/* borde transparente: el "circulo" real es el div contenedor */}
      <circle cx="12" cy="12" r="10" className="steper-paso-borde" />

      {/* check */}
      <g className={`steper-paso-capa ${estado === 'check' ? 'steper-paso-capa--activa' : ''}`}>
        <path d="m9 12 2 2 4-4" className="steper-paso-trazo" />
      </g>

      {/* interrogacion (paso activo) */}
      <g className={`steper-paso-capa ${estado === 'alert' ? 'steper-paso-capa--activa' : ''}`}>
        <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" className="steper-paso-trazo" />
        <path d="M12 17h.01" className="steper-paso-trazo" />
      </g>

      {/* x */}
      <g className={`steper-paso-capa ${estado === 'x' ? 'steper-paso-capa--activa' : ''}`}>
        <path d="m15 9-6 6" className="steper-paso-trazo" />
        <path d="m9 9 6 6" className="steper-paso-trazo" />
      </g>
    </svg>
  )
}

function Stepper({ pasos, pasoActual, visible = true, onPasoClick, texto }) {
  const partes = (Array.isArray(texto) ? texto : [texto])
    .map((t) => String(t ?? '').trim())
    .filter(Boolean)
  const lineaResumen = partes.join('\u00A0 · \u00A0')

  return (
    <div className={`steper-general-container ${visible ? 'steper-general-container--visible' : ''}`}>
      {lineaResumen ? (
        <p className='steper-general-container-texto' title={lineaResumen}>
          {lineaResumen}
        </p>
      ) : null}
      <div className='steper-container'>
        <div className='steper-bar-container'>
          <div className='steper-bar' style={{width: `${((pasoActual + 1) / (pasos.length + 1)) * 100 - (pasoActual === 0 ? 2 : 0)}%`}}></div>
        </div>
        <div className='steper-steps-container'>
          {pasos.map((paso, index) => {
            const estado = estadoPaso(paso, index, pasoActual)
            return (
              <div
                key={paso.id ?? index}
                className='steper-adentro'
                role='button'
                tabIndex={0}
                onClick={() => onPasoClick?.(paso.id)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    onPasoClick?.(paso.id)
                  }
                }}
              >
                <div className='steper-paso'>
                  <div className={`steper-paso-icono-container ${estado}`}>
                    <StepperIcono estado={estado} />
                  </div>
                  <p className={`steper-paso-texto ${estado}`}>{paso.label}</p>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export default Stepper
