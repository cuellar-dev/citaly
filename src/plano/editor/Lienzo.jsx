import { useRef, useState } from 'react'
import Plano from '../Plano.jsx'
import { caja, dimensiones } from '../modelo.js'

/* El plano del editor: tocar elige una pieza y arrastrar la mueve.

   - Pointer Events (ratón, dedo y lápiz con el mismo código). Mientras se
     arrastra, la pieza va donde el dedo; al soltar se ajusta a la casilla
     más cercana (cada casilla son 25 cm). Nunca se sale del lienzo.
   - Un toque sin mover (menos de 4 px) solo elige la pieza.
   - Teclado: con una pieza elegida, flechas mueven una casilla (Mayús: 4),
     R gira, Supr la quita, Esc suelta la selección.
   - El movimiento en curso no entra en el historial: solo se guarda el
     resultado al soltar (un "deshacer" por movimiento). */

const UMBRAL_PX = 4

export default function Lienzo({
  plano,
  piso,
  activa,
  onActivar,
  onMover,
  onGirar,
  onQuitar,
  problemas,
  estados,
  elegidas,
  onMesa,
  modoMesas = false,
}) {
  const svgRef = useRef(null)
  const arrastre = useRef(null)
  const fondo = useRef(null)
  const [vivo, setVivo] = useState(null)
  const { ancho, alto } = dimensiones(plano)

  const aPlano = (e) => {
    const svg = svgRef.current
    const m = svg?.getScreenCTM()
    if (!m) return { x: 0, y: 0 }
    const p = new DOMPoint(e.clientX, e.clientY).matrixTransform(m.inverse())
    return { x: p.x, y: p.y }
  }

  /* Que la caja girada no se salga del lienzo. */
  const encajar = (pieza, x, y) => {
    const c = caja({ ...pieza, x, y })
    const dx = c.x < 0 ? -c.x : c.x + c.w > ancho ? ancho - (c.x + c.w) : 0
    const dy = c.y < 0 ? -c.y : c.y + c.h > alto ? alto - (c.y + c.h) : 0
    return { x: Math.round(x + dx), y: Math.round(y + dy) }
  }

  const alBajar = (e, pieza) => {
    if (modoMesas) return
    if (e.button > 0) return
    e.stopPropagation()
    onActivar(pieza.id)
    const inicio = aPlano(e)
    arrastre.current = { id: pieza.id, pieza, inicio, px: e.clientX, py: e.clientY, movido: false, pointerId: e.pointerId }
    e.currentTarget.ownerSVGElement?.setPointerCapture?.(e.pointerId)
  }

  const alMover = (e) => {
    const a = arrastre.current
    if (!a || a.pointerId !== e.pointerId) return
    if (!a.movido && Math.hypot(e.clientX - a.px, e.clientY - a.py) < UMBRAL_PX) return
    a.movido = true
    const p = aPlano(e)
    const sitio = encajar(a.pieza, a.pieza.x + (p.x - a.inicio.x), a.pieza.y + (p.y - a.inicio.y))
    setVivo({ id: a.id, ...sitio })
  }

  const alSoltar = (e) => {
    const a = arrastre.current
    if (!a || a.pointerId !== e.pointerId) return
    arrastre.current = null
    if (a.movido && vivo && (vivo.x !== a.pieza.x || vivo.y !== a.pieza.y)) onMover(a.id, vivo.x, vivo.y)
    setVivo(null)
  }

  /* Tocar el suelo suelta la pieza elegida, pero solo si fue un toque: con
     el dedo, arrastrar sobre el suelo desplaza la página (no la suelta). */
  const alBajarFondo = (e) => {
    fondo.current = { x: e.clientX, y: e.clientY, pointerId: e.pointerId }
  }

  const alSoltarFondo = (e) => {
    const f = fondo.current
    fondo.current = null
    if (f && f.pointerId === e.pointerId && Math.hypot(e.clientX - f.x, e.clientY - f.y) < UMBRAL_PX * 2) onActivar(null)
  }

  const alTeclado = (e) => {
    if (!activa || modoMesas) return
    const pieza = plano.piezas.find((p) => p.id === activa)
    if (!pieza) return
    const paso = e.shiftKey ? 4 : 1
    const mover = { ArrowLeft: [-paso, 0], ArrowRight: [paso, 0], ArrowUp: [0, -paso], ArrowDown: [0, paso] }[e.key]
    if (mover) {
      e.preventDefault()
      const sitio = encajar(pieza, pieza.x + mover[0], pieza.y + mover[1])
      onMover(pieza.id, sitio.x, sitio.y)
    } else if (e.key === 'r' || e.key === 'R') {
      e.preventDefault()
      onGirar(pieza.id)
    } else if (e.key === 'Delete' || e.key === 'Backspace') {
      e.preventDefault()
      onQuitar(pieza.id)
    } else if (e.key === 'Escape') {
      onActivar(null)
    }
  }

  /* Elegir con el teclado: al enfocar una pieza queda elegida. */
  const alEnfocar = (e) => {
    const id = e.target?.closest?.('[data-pieza]')?.getAttribute('data-pieza')
    if (id && id !== activa && !modoMesas) onActivar(id)
  }

  const planoVista = vivo
    ? { ...plano, piezas: plano.piezas.map((p) => (p.id === vivo.id ? { ...p, x: vivo.x, y: vivo.y } : p)) }
    : plano

  return (
    <div
      className={`lienzo${vivo ? ' lienzo--arrastrando' : ''}`}
      onPointerMove={alMover}
      onPointerUp={(e) => {
        alSoltar(e)
        alSoltarFondo(e)
      }}
      onPointerCancel={(e) => {
        alSoltar(e)
        fondo.current = null
      }}
      onKeyDown={alTeclado}
      onFocus={alEnfocar}
    >
      <Plano
        ref={svgRef}
        plano={planoVista}
        piso={piso}
        modo={modoMesas ? 'ver' : 'editar'}
        activa={modoMesas ? null : activa}
        problemas={problemas}
        estados={estados}
        elegidas={elegidas}
        onMesa={onMesa}
        tocarTodas={modoMesas}
        onPiezaDown={alBajar}
        onFondoDown={alBajarFondo}
        titulo="Tu sala"
      />
    </div>
  )
}
