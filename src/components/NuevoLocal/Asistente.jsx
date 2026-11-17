import { useEffect, useRef } from 'react'
import { ArrowLeft, ArrowRight, X } from 'lucide-react'
import TalyGuia from './TalyGuia.jsx'
import './asistente.css'

/* Armazón común de los dos formularios del local (crear y completar): una
   pantalla a foco, sin la barra de la app, un paso cada vez.

   Arriba: cerrar, en qué paso vas y la barra de progreso.
   En medio: el paso.
   Abajo, siempre a mano: Taly con su nube y los botones de atrás/seguir. */

function Asistente({
  titulo,
  pasos,
  paso,
  onCerrar,
  onAtras,
  onSeguir,
  textoSeguir = 'Siguiente',
  seguirDeshabilitado = false,
  enviando = false,
  taly,
  sinPie = false,
  children,
}) {
  const cuerpoRef = useRef(null)
  const total = pasos.length

  /* Al cambiar de paso: arriba del todo y el foco al título, para que el
     lector de pantalla diga dónde se está. */
  useEffect(() => {
    window.scrollTo({ top: 0 })
    cuerpoRef.current?.querySelector('h2')?.focus({ preventScroll: true })
  }, [paso])

  return (
    <section className="asistente" aria-label={titulo}>
      <header className="asistente-top">
        <button type="button" className="asistente-cerrar" onClick={onCerrar} aria-label="Salir">
          <X size={19} strokeWidth={2.3} aria-hidden="true" />
        </button>
        <div className="asistente-top-textos">
          <span className="asistente-top-titulo">{titulo}</span>
          {total > 1 && paso >= 0 && paso < total && (
            <span className="asistente-top-paso">
              Paso {paso + 1} de {total} · {pasos[paso]}
            </span>
          )}
        </div>
      </header>
      {total > 1 && (
        <div
          className="asistente-progreso"
          role="progressbar"
          aria-label="Progreso"
          aria-valuemin={0}
          aria-valuemax={total}
          aria-valuenow={Math.min(paso + 1, total)}
        >
          {pasos.map((nombre, i) => (
            <span key={nombre} className={`asistente-progreso-tramo${i <= paso ? ' asistente-progreso-tramo--hecho' : ''}`} />
          ))}
        </div>
      )}

      <div className="asistente-cuerpo" ref={cuerpoRef}>
        {children}
      </div>

      {!sinPie && (
        <footer className="asistente-pie">
          {taly && (
            <TalyGuia tono={taly.tono} vez={taly.vez} id="asistente-taly">
              {taly.texto}
            </TalyGuia>
          )}
          <div className="asistente-botones">
            {onAtras && (
              <button type="button" className="asistente-atras" onClick={onAtras} aria-label="Paso anterior">
                <ArrowLeft size={19} strokeWidth={2.3} aria-hidden="true" />
              </button>
            )}
            <button
              type="button"
              className="asistente-seguir"
              onClick={onSeguir}
              disabled={seguirDeshabilitado || enviando}
            >
              {enviando ? 'Un momento…' : textoSeguir}
              {!enviando && <ArrowRight size={18} strokeWidth={2.4} aria-hidden="true" />}
            </button>
          </div>
        </footer>
      )}
    </section>
  )
}

export default Asistente
