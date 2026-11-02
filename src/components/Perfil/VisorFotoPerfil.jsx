import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'
import { TransformComponent, TransformWrapper } from 'react-zoom-pan-pinch'
import './visorFotoPerfil.css'

const UMBRAL = 110

function VisorFotoPerfil({ url, alt, onClose }) {
  const [abierto, setAbierto] = useState(false)
  const [escala, setEscala] = useState(1)
  const [dy, setDy] = useState(0)
  const [arrastrando, setArrastrando] = useState(false)
  const gesto = useRef(null)
  const cerrando = useRef(false)

  useEffect(() => {
    const id = requestAnimationFrame(() => setAbierto(true))
    const antes = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      cancelAnimationFrame(id)
      document.body.style.overflow = antes
    }
  }, [])

  const cerrar = (salida = 0) => {
    if (cerrando.current) return
    cerrando.current = true
    setArrastrando(false)
    setAbierto(false)
    if (salida) setDy(salida)
    window.setTimeout(onClose, salida ? 220 : 260)
  }

  const alBajar = (e) => {
    if (escala > 1.02 || e.button > 0) return
    gesto.current = { id: e.pointerId, y: e.clientY, x: e.clientX, activo: false }
  }

  const alMover = (e) => {
    const g = gesto.current
    if (!g || e.pointerId !== g.id || escala > 1.02) return
    const mx = e.clientX - g.x
    const my = e.clientY - g.y
    if (!g.activo) {
      if (Math.hypot(mx, my) < 8) return
      if (Math.abs(mx) > Math.abs(my)) {
        gesto.current = null
        return
      }
      g.activo = true
      setArrastrando(true)
    }
    setDy(my)
  }

  const alSoltar = (e) => {
    const g = gesto.current
    if (!g || e.pointerId !== g.id) return
    gesto.current = null
    if (!g.activo) return
    const my = e.clientY - g.y
    if (Math.abs(my) > UMBRAL) cerrar(my > 0 ? window.innerHeight : -window.innerHeight)
    else {
      setArrastrando(false)
      setDy(0)
    }
  }

  const velo = Math.max(0.25, 1 - Math.abs(dy) / 420)

  return createPortal(
    <div
      className={`visor-foto${abierto ? ' visor-foto--abierto' : ''}${arrastrando ? ' visor-foto--arrastrando' : ''}`}
      style={{ '--dy': `${dy}px`, '--velo': abierto ? velo : 0 }}
      role="dialog"
      aria-modal="true"
      aria-label={alt}
      onPointerDown={alBajar}
      onPointerMove={alMover}
      onPointerUp={alSoltar}
      onPointerCancel={alSoltar}
    >
      <button type="button" className="visor-foto-cerrar" onClick={() => cerrar(0)} aria-label="Cerrar foto">
        <X size={26} strokeWidth={2.25} />
      </button>
      <div className="visor-foto-lienzo">
        <TransformWrapper
          initialScale={1}
          minScale={1}
          maxScale={4}
          centerOnInit
          panning={{ disabled: escala <= 1.02 }}
          wheel={{ step: 0.08 }}
          doubleClick={{ mode: 'toggle', step: 2 }}
          pinch={{ step: 5 }}
          onTransformed={(ref, state) => {
            const scale = state?.scale ?? ref?.state?.scale ?? 1
            setEscala(scale)
          }}
        >
          <TransformComponent wrapperClass="visor-foto-zoom" contentClass="visor-foto-contenido">
            <img src={url} alt={alt} draggable={false} />
          </TransformComponent>
        </TransformWrapper>
      </div>
    </div>,
    document.body
  )
}

export default VisorFotoPerfil
