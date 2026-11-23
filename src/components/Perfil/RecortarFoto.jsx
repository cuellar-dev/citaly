import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import './recortarFoto.css'

const MARCO = 280
const SALIDA = 640

/* La foto no puede dejar hueco dentro del marco: se limita el arrastre. */
function limitarPos({ w, h }, x, y, s) {
  const maxX = Math.max(0, (w * s) / 2 - MARCO / 2)
  const maxY = Math.max(0, (h * s) / 2 - MARCO / 2)
  return {
    x: Math.min(maxX, Math.max(-maxX, x)),
    y: Math.min(maxY, Math.max(-maxY, y)),
    s,
  }
}

/* Acercar o alejar: entre «la foto justo cubre el marco» y 4 veces eso. */
function zoomPos(nat, pos, factor) {
  if (!nat.w) return null
  const piso = Math.max(MARCO / nat.w, MARCO / nat.h)
  const s = Math.min(piso * 4, Math.max(piso, pos.s * factor))
  return limitarPos(nat, pos.x, pos.y, s)
}

function RecortarFoto({ src, onCancelar, onListo }) {
  const imgRef = useRef(null)
  const escenaRef = useRef(null)
  const gesto = useRef(null)
  const natRef = useRef({ w: 0, h: 0 })
  const posRef = useRef({ x: 0, y: 0, s: 1 })
  const [nat, setNat] = useState({ w: 0, h: 0 })
  const [pos, setPos] = useState({ x: 0, y: 0, s: 1 })
  /* Escape siempre llama al onCancelar más reciente del padre. */
  const cancelarRef = useRef(onCancelar)
  useEffect(() => {
    cancelarRef.current = onCancelar
  })

  useEffect(() => {
    const overflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const escena = escenaRef.current
    const rueda = (e) => {
      e.preventDefault()
      const siguiente = zoomPos(natRef.current, posRef.current, e.deltaY > 0 ? 0.92 : 1.08)
      if (!siguiente) return
      posRef.current = siguiente
      setPos(siguiente)
    }
    escena?.addEventListener('wheel', rueda, { passive: false })
    const alTeclear = (e) => {
      if (e.key !== 'Escape') return
      e.stopImmediatePropagation()
      cancelarRef.current()
    }
    window.addEventListener('keydown', alTeclear, true)
    return () => {
      document.body.style.overflow = overflow
      escena?.removeEventListener('wheel', rueda)
      window.removeEventListener('keydown', alTeclear, true)
    }
  }, [])

  const alCargar = (e) => {
    const w = e.target.naturalWidth
    const h = e.target.naturalHeight
    const siguiente = { x: 0, y: 0, s: Math.max(MARCO / w, MARCO / h) }
    natRef.current = { w, h }
    posRef.current = siguiente
    setNat({ w, h })
    setPos(siguiente)
  }

  const limitar = (x, y, s) => limitarPos(natRef.current, x, y, s)

  const zoom = (factor) => {
    const siguiente = zoomPos(natRef.current, posRef.current, factor)
    if (!siguiente) return
    posRef.current = siguiente
    setPos(siguiente)
  }

  const alBajar = (e) => {
    if (e.button > 0) return
    e.currentTarget.setPointerCapture(e.pointerId)
    gesto.current = { id: e.pointerId, x: e.clientX, y: e.clientY, px: posRef.current.x, py: posRef.current.y }
  }

  const alMover = (e) => {
    const g = gesto.current
    if (!g || e.pointerId !== g.id) return
    const siguiente = limitar(g.px + (e.clientX - g.x), g.py + (e.clientY - g.y), posRef.current.s)
    posRef.current = siguiente
    setPos(siguiente)
  }

  const alSoltar = (e) => {
    if (gesto.current?.id === e.pointerId) gesto.current = null
  }

  const recortar = () => {
    const img = imgRef.current
    if (!img || !nat.w) return
    const size = MARCO / pos.s
    const sx = nat.w / 2 - pos.x / pos.s - size / 2
    const sy = nat.h / 2 - pos.y / pos.s - size / 2
    const canvas = document.createElement('canvas')
    canvas.width = SALIDA
    canvas.height = SALIDA
    const ctx = canvas.getContext('2d')
    ctx.drawImage(img, sx, sy, size, size, 0, 0, SALIDA, SALIDA)
    onListo(canvas.toDataURL('image/jpeg', 0.86))
  }

  return createPortal(
    <div className="recorte tema-oscuro-fijo" role="dialog" aria-modal="true" aria-labelledby="recorte-titulo">
      <header className="recorte-barra">
        <button type="button" onClick={onCancelar}>
          Cancelar
        </button>
        <h2 id="recorte-titulo">Recorta la foto</h2>
        <button type="button" className="recorte-listo" onClick={recortar}>
          Listo
        </button>
      </header>

      <div
        ref={escenaRef}
        className="recorte-escena"
        onPointerDown={alBajar}
        onPointerMove={alMover}
        onPointerUp={alSoltar}
        onPointerCancel={alSoltar}
      >
        <div
          className="recorte-lienzo"
          style={{ transform: `translate(${pos.x}px, ${pos.y}px) scale(${pos.s})` }}
        >
          <img ref={imgRef} src={src} alt="" draggable={false} onLoad={alCargar} />
        </div>
        <div className="recorte-marco" aria-hidden="true" />
      </div>

      <div className="recorte-zoom">
        <button type="button" onClick={() => zoom(0.9)} aria-label="Alejar">
          −
        </button>
        <button type="button" onClick={() => zoom(1.12)} aria-label="Acercar">
          +
        </button>
      </div>
    </div>,
    document.body
  )
}

export default RecortarFoto
