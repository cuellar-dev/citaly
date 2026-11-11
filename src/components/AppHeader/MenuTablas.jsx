import { useEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import { useGSAP } from '@gsap/react'
import { CircleHelp, Info, LogOut, Settings, Share2 } from 'lucide-react'
import './menuTablas.css'

gsap.registerPlugin(useGSAP)

/* Cartel de tablas de madera colgado del botón de los tres puntos.

   Las opciones son las que le faltan a la app y no están en la barra de
   abajo. Notificaciones no entra: va a tener su propio botón fuera.

   Cada tabla lleva su chispa de mostaza, y arriba, en el borde del header,
   está Taly posado: la idea es que el cartel cuelga de donde él está. */

const OPCIONES = [
  { id: 'compartir', label: 'Compartir Citaly', Icono: Share2, giro: '-1.2deg', chispa: [168, 17, 1] },
  { id: 'ajustes', label: 'Ajustes', Icono: Settings, giro: '0.8deg', chispa: [186, 39, 0.78] },
  { id: 'ayuda', label: 'Ayuda', Icono: CircleHelp, giro: '-0.6deg', chispa: [174, 20, 0.9] },
  { id: 'sobre', label: 'Sobre Citaly', Icono: Info, giro: '1.1deg', chispa: [190, 36, 0.72] },
  { id: 'salir', label: 'Cerrar sesión', Icono: LogOut, giro: '-0.9deg', chispa: [166, 18, 0.85] },
]

/* Tabla recortada a mano. El contorno es el mismo para todas; lo que cambia
   es la semilla del temblor, así que cada una sale astillada distinto sin
   tener que dibujar cinco. */
const MADERA =
  'M5 9 C5 7 6 6 8 6 L217 4 C219 4 220 5 220 7 L221 48 C221 50 220 51 218 51 L6 52 C4 52 3 51 3 49 Z'
const VETA_A = 'M20 19 C72 17 152 21 204 18'
const VETA_B = 'M22 39 C82 41 142 37 202 40'

function chispaPath(x, y, s) {
  return `M${x} ${y - 9 * s} C${x + 1.5 * s} ${y - 2.5 * s} ${x + 2.5 * s} ${y - 1.5 * s} ${x + 9 * s} ${y} C${x + 2.5 * s} ${y + 1.5 * s} ${x + 1.5 * s} ${y + 2.5 * s} ${x} ${y + 9 * s} C${x - 1.5 * s} ${y + 2.5 * s} ${x - 2.5 * s} ${y + 1.5 * s} ${x - 9 * s} ${y} C${x - 2.5 * s} ${y - 1.5 * s} ${x - 1.5 * s} ${y - 2.5 * s} ${x} ${y - 9 * s} Z`
}

function TablaFondo({ semilla, chispa }) {
  const id = `menu-tabla-pulso-${semilla}`
  return (
    <svg className="menu-tabla-fondo" viewBox="0 0 224 56" aria-hidden="true" focusable="false">
      <defs>
        <filter id={id} x="-8%" y="-14%" width="116%" height="128%">
          <feTurbulence type="fractalNoise" baseFrequency="0.05" numOctaves="2" seed={semilla * 7 + 3} result="r" />
          <feDisplacementMap in="SourceGraphic" in2="r" scale="3.2" xChannelSelector="R" yChannelSelector="G" />
        </filter>
      </defs>

      <g filter={`url(#${id})`}>
        <path d={MADERA} fill="#4a3f33" />
        <path d={MADERA} fill="none" stroke="#5d5042" strokeWidth="1.4" />
        <path d={VETA_A} fill="none" stroke="#3b3128" strokeWidth="1.6" strokeLinecap="round" opacity="0.8" />
        <path d={VETA_B} fill="none" stroke="#3b3128" strokeWidth="1.3" strokeLinecap="round" opacity="0.6" />
      </g>

      {/* Los clavos van fuera del filtro: son de metal, no de madera, y si
          tiemblan dejan de parecer clavos. */}
      <circle cx="15" cy="28" r="3.4" fill="#00c2ad" />
      <circle cx="15" cy="28" r="1.3" fill="#06463d" />
      <circle cx="209" cy="28" r="3.4" fill="#00c2ad" />
      <circle cx="209" cy="28" r="1.3" fill="#06463d" />
    </svg>
  )
}

function MenuTablas({ abierto, onCerrar, anclaRef }) {
  const [montado, setMontado] = useState(abierto)
  const cajaRef = useRef(null)
  if (abierto && !montado) setMontado(true)

  useGSAP(
    () => {
      const caja = cajaRef.current
      if (!montado || !caja) return
      const tablas = gsap.utils.toArray('[data-tabla]', caja)
      const cuerdas = gsap.utils.toArray('[data-cuerda]', caja)
      const suave = window.matchMedia('(prefers-reduced-motion: reduce)').matches

      if (abierto) {
        /* Movimiento reducido: se queda solo el fundido, sin caída ni
           balanceo, y sin escalonar. */
        if (suave) {
          gsap.fromTo(caja, { opacity: 0 }, { opacity: 1, duration: 0.18, ease: 'power2.out' })
          gsap.set([...tablas, ...cuerdas], { clearProps: 'all' })
          return
        }

        gsap.set(caja, { opacity: 1 })
        /* Las cuerdas se descuelgan primero: sin ellas las tablas caerían
           de la nada. */
        gsap.fromTo(
          cuerdas,
          { scaleY: 0 },
          { scaleY: 1, duration: 0.26, ease: 'power3.out', transformOrigin: '50% 0%' },
        )
        gsap.fromTo(
          tablas,
          { y: -26, opacity: 0, rotate: (i) => (i % 2 ? 6 : -6) },
          {
            y: 0,
            opacity: 1,
            rotate: 0,
            duration: 0.34,
            /* back.out da el rebote corto de una tabla que cae y se queda
               colgando de sus dos cuerdas. */
            ease: 'back.out(1.5)',
            stagger: 0.055,
            transformOrigin: '50% 0%',
            clearProps: 'rotate',
          },
        )
        return
      }

      if (suave) {
        gsap.to(caja, { opacity: 0, duration: 0.14, onComplete: () => setMontado(false) })
        return
      }

      /* Se recogen de abajo hacia arriba, como si tiraran de la cuerda. */
      gsap
        .timeline({ onComplete: () => setMontado(false) })
        .to(tablas, {
          y: -18,
          opacity: 0,
          duration: 0.18,
          ease: 'power2.in',
          stagger: { each: 0.03, from: 'end' },
        })
        .to(cuerdas, { scaleY: 0, duration: 0.14, ease: 'power2.in', transformOrigin: '50% 0%' }, 0.06)
    },
    { dependencies: [abierto, montado] },
  )

  useEffect(() => {
    if (!abierto) return undefined
    const alTeclear = (e) => {
      if (e.key === 'Escape') onCerrar()
    }
    const alTocar = (e) => {
      if (cajaRef.current?.contains(e.target)) return
      if (anclaRef?.current?.contains(e.target)) return
      onCerrar()
    }
    window.addEventListener('keydown', alTeclear)
    document.addEventListener('pointerdown', alTocar)
    return () => {
      window.removeEventListener('keydown', alTeclear)
      document.removeEventListener('pointerdown', alTocar)
    }
  }, [abierto, onCerrar, anclaRef])

  if (!montado) return null

  return (
    <div className="menu-tablas" ref={cajaRef} role="menu" aria-label="Más opciones">
      <span className="menu-tablas-cuerda menu-tablas-cuerda--izq" data-cuerda aria-hidden="true" />
      <span className="menu-tablas-cuerda menu-tablas-cuerda--der" data-cuerda aria-hidden="true" />

      <ul className="menu-tablas-lista">
        {OPCIONES.map((op, i) => (
          <li key={op.id} className="menu-tablas-item" data-tabla>
            <button
              type="button"
              role="menuitem"
              className="menu-tabla"
              style={{ '--giro': op.giro }}
              onClick={onCerrar}
            >
              <TablaFondo semilla={i} chispa={op.chispa} />
              <op.Icono className="menu-tabla-icono" size={17} strokeWidth={2.2} aria-hidden="true" />
              <span className="menu-tabla-texto">{op.label}</span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}

export default MenuTablas
