import { useEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import { useGSAP } from '@gsap/react'
import { X } from 'lucide-react'
import Modal from '../Modal/Modal.jsx'
import './modalNegocio.css'

gsap.registerPlugin(useGSAP)

/**
 * Hoja que sube desde abajo para el panel del dueño; el contenido lo arma la página según `modal`.
 * Sigue montada mientras se anima la salida, por eso lleva su propio `montado`.
 */
function ModalNegocioShell({ abierto, titulo, subtitulo, tono = 'neutro', Icono, vista, onCerrar, children }) {
  const [montado, setMontado] = useState(abierto)
  if (abierto && !montado) setMontado(true)

  const veloRef = useRef(null)
  const hojaRef = useRef(null)
  const cerrarRef = useRef(null)
  const cuerpoRef = useRef(null)

  useEffect(() => {
    if (cuerpoRef.current) cuerpoRef.current.scrollTop = 0
  }, [vista])

  useGSAP(
    () => {
      const velo = veloRef.current
      const hoja = hojaRef.current
      if (!montado || !velo || !hoja) return
      const d = window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 1

      if (abierto) {
        /* Solo los primeros bloques entran escalonados: el resto queda debajo del pliegue. */
        const entradas = gsap.utils.toArray('[data-entra]', hoja).slice(0, 5)
        gsap
          .timeline()
          .fromTo(velo, { opacity: 0 }, { opacity: 1, duration: 0.35 * d, ease: 'power1.out' }, 0)
          .fromTo(hoja, { yPercent: 100 }, { yPercent: 0, duration: 0.55 * d, ease: 'expo.out', force3D: true }, 0)
          .from(
            entradas,
            { y: 14, opacity: 0, duration: 0.4 * d, stagger: 0.05 * d, ease: 'power3.out', clearProps: 'transform,opacity' },
            0.12 * d
          )
        return
      }

      gsap
        .timeline({ onComplete: () => setMontado(false) })
        .to(hoja, { yPercent: 100, duration: 0.3 * d, ease: 'power2.in', force3D: true }, 0)
        .to(velo, { opacity: 0, duration: 0.28 * d }, 0.02 * d)
    },
    { dependencies: [abierto, montado] }
  )

  useEffect(() => {
    if (!abierto) return
    cerrarRef.current?.focus({ preventScroll: true })
    const alTeclear = (e) => {
      if (e.key === 'Escape') onCerrar()
    }
    const overflowPrevio = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', alTeclear)
    return () => {
      window.removeEventListener('keydown', alTeclear)
      document.body.style.overflow = overflowPrevio
    }
  }, [abierto, onCerrar])

  return (
    <Modal abierto={montado} onCerrar={onCerrar} className="modal-backdrop--hoja" veloRef={veloRef}>
      <div
        ref={hojaRef}
        className={`modal-negocio modal-negocio--${tono}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-negocio-titulo"
      >
        <span className="modal-negocio-asa" aria-hidden="true" />
        <header className="modal-negocio-cabecera">
          {Icono && (
            <span className="modal-negocio-icono" aria-hidden="true">
              <Icono size={18} strokeWidth={2.25} />
            </span>
          )}
          <div className="modal-negocio-titulos">
            <h2 id="modal-negocio-titulo" className="modal-negocio-titulo">
              {titulo}
            </h2>
            {subtitulo && <p className="modal-negocio-subtitulo">{subtitulo}</p>}
          </div>
          <button ref={cerrarRef} type="button" className="modal-negocio-cerrar" onClick={onCerrar} aria-label="Cerrar">
            <X size={18} strokeWidth={2.25} />
          </button>
        </header>
        <div className="modal-negocio-cuerpo" ref={cuerpoRef}>
          <div key={vista} className="modal-negocio-vista">
            {children}
          </div>
        </div>
      </div>
    </Modal>
  )
}

export default ModalNegocioShell
