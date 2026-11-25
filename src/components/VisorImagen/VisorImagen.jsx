import { useRef, useState } from 'react'
import './visorimagen.css'
import { XIcon } from 'lucide-react'
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch'

/* Foto en grande. Se cierra de tres maneras:
   - la X;
   - tocando lo negro (cualquier sitio que no sea la foto);
   - arrastrando la foto hacia cualquier lado (sin zoom): sigue al dedo, el
     fondo se aclara y, pasado un trozo o con un gesto rápido, se va. Si no
     llega, vuelve a su sitio. Antes se quedaba donde la soltabas.
   Con zoom puesto, arrastrar mueve la foto ampliada (para mirar detalles) y
   no cierra. */

const UMBRAL_PX = 90
const VELOCIDAD = 0.5 // px/ms
const MOVIO_PX = 6

function VisorImagen({ url, alt, onClose }) {
  const [desliz, setDesliz] = useState({ x: 0, y: 0, soltando: false, saliendo: false })
  const [conZoom, setConZoom] = useState(false)
  const escala = useRef(1)
  const gesto = useRef(null)
  const punteros = useRef(new Set())
  const movio = useRef(false)

  const cerrar = () => onClose?.()

  const alBajar = (e) => {
    punteros.current.add(e.pointerId)
    movio.current = false
    /* Dos dedos = pellizco para zoom: eso no es deslizar. */
    if (punteros.current.size > 1 || escala.current > 1.01) {
      gesto.current = null
      setDesliz((d) => ({ ...d, x: 0, y: 0, soltando: true }))
      return
    }
    gesto.current = { x0: e.clientX, y0: e.clientY, t0: performance.now() }
  }

  const alMover = (e) => {
    const g = gesto.current
    if (!g) return
    const x = e.clientX - g.x0
    const y = e.clientY - g.y0
    if (Math.hypot(x, y) > MOVIO_PX) movio.current = true
    setDesliz({ x, y, soltando: false, saliendo: false })
  }

  const alSoltar = (e) => {
    punteros.current.delete(e.pointerId)
    const g = gesto.current
    gesto.current = null
    if (!g) return
    const x = e.clientX - g.x0
    const y = e.clientY - g.y0
    const distancia = Math.hypot(x, y)
    const rapido = distancia / Math.max(1, performance.now() - g.t0) > VELOCIDAD && distancia > 30
    if (distancia > UMBRAL_PX || rapido) {
      /* Sale en la misma dirección en que se lanzó. */
      const factor = (Math.max(window.innerWidth, window.innerHeight) * 1.2) / Math.max(distancia, 1)
      setDesliz({ x: x * factor, y: y * factor, soltando: true, saliendo: true })
      setTimeout(cerrar, 200)
    } else {
      setDesliz({ x: 0, y: 0, soltando: true, saliendo: false })
    }
  }

  const alCancelar = (e) => {
    punteros.current.delete(e.pointerId)
    gesto.current = null
    setDesliz({ x: 0, y: 0, soltando: true, saliendo: false })
  }

  /* Tocar fuera de la foto cierra; tocar la foto (o soltar tras arrastrar) no. */
  const imgRef = useRef(null)
  const alTocar = (e) => {
    if (movio.current) return
    if (e.target.closest('.visor-imagen-close')) return
    /* La librería del zoom no deja que la <img> reciba el toque (el destino
       es su contenedor, que ocupa casi toda la pantalla), así que se mira si
       el dedo cayó dentro del rectángulo de la foto. */
    const caja = imgRef.current?.getBoundingClientRect()
    const dentro =
      caja && e.clientX >= caja.left && e.clientX <= caja.right && e.clientY >= caja.top && e.clientY <= caja.bottom
    if (!dentro) cerrar()
  }

  const distancia = Math.hypot(desliz.x, desliz.y)
  const opacidadFondo = desliz.saliendo ? 0 : Math.max(0.25, 1 - distancia / 400)

  return (
    <div
      className="visor-imagen-back tema-oscuro-fijo"
      onClick={alTocar}
      style={{ '--visor-fondo': opacidadFondo }}
    >
      <button type="button" className="visor-imagen-close" onClick={cerrar} aria-label="Cerrar">
        <XIcon size={30} />
      </button>

      <div
        className={`visor-imagen-zoom${desliz.soltando ? ' visor-imagen-zoom--soltando' : ''}`}
        style={{ transform: `translate(${desliz.x}px, ${desliz.y}px)` }}
        onPointerDown={alBajar}
        onPointerMove={alMover}
        onPointerUp={alSoltar}
        onPointerCancel={alCancelar}
      >
        <TransformWrapper
          initialScale={1}
          minScale={1}
          maxScale={3}
          centerOnInit
          wheel={{ step: 0.01 }}
          doubleClick={{ mode: 'zoomIn', step: 3 }}
          pinch={{ step: 5 }}
          /* Sin zoom, el arrastre es nuestro (deslizar para cerrar). */
          panning={{ disabled: !conZoom }}
          disablePadding
          onTransformed={(_, estado) => {
            escala.current = estado.scale
            const ahora = estado.scale > 1.01
            if (ahora !== conZoom) setConZoom(ahora)
          }}
        >
          <TransformComponent
            wrapperClass="visor-imagen-transform-wrapper"
            contentClass="visor-imagen-transform-content"
          >
            <img ref={imgRef} src={url} alt={alt} className="visor-imagen" draggable={false} />
          </TransformComponent>
        </TransformWrapper>
      </div>
    </div>
  )
}

export default VisorImagen
