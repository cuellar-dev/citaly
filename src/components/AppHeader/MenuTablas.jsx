import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import gsap from 'gsap'
import { useGSAP } from '@gsap/react'
import { CircleHelp, Info, Moon, Share2, Sun } from 'lucide-react'
import IconoFavoritos from './IconoFavoritos.jsx'
import SwitchTema from './SwitchTema.jsx'
import { useTema } from '../../hooks/useTema.js'
import { alternarTema } from '../../services/tema.js'
import './menuTablas.css'

gsap.registerPlugin(useGSAP)

/* Cartel de tablas de madera colgado del botón de los tres puntos.

   Las opciones son las que le faltan a la app y no están en la barra de
   abajo. Notificaciones no entra: tiene su campana fuera. Ajustes y Cerrar
   sesión tampoco: ya viven en Mi Perfil.

   Al abrirse, un velo oscuro crece en círculo desde los tres puntos y tapa
   la pantalla: deja claro que el cartel es ahora lo único con lo que se
   habla, y que nace de ese botón. Al cerrar, el círculo vuelve a meterse en
   él. Taly salta desde su rincón a la primera tabla.

   La tabla del tema es distinta a las demás: no navega ni cierra el cartel.
   Se queda abierto para que veas cambiar la app por detrás del velo. */

const OPCIONES = [
  { id: 'tema', tipo: 'tema', giro: '-1.2deg' },
  { id: 'favoritos', label: 'Favoritos', Icono: IconoFavoritos, giro: '0.8deg', ruta: '/favoritos' },
  { id: 'ayuda', label: 'Preguntas frecuentes', Icono: CircleHelp, giro: '-0.6deg', ruta: '/ayuda' },
  { id: 'sobre', label: 'Sobre Citaly', Icono: Info, giro: '1.1deg', ruta: '/nosotros' },
  { id: 'compartir', label: 'Compartir Citaly', Icono: Share2, giro: '-0.9deg', accion: 'compartir' },
]

/* Tabla recortada a mano. El contorno es el mismo para todas; lo que cambia
   es la semilla del temblor, así que cada una sale astillada distinto sin
   tener que dibujar cinco. */
const MADERA =
  'M5 9 C5 7 6 6 8 6 L217 4 C219 4 220 5 220 7 L221 48 C221 50 220 51 218 51 L6 52 C4 52 3 51 3 49 Z'
const VETA_A = 'M20 19 C72 17 152 21 204 18'
const VETA_B = 'M22 39 C82 41 142 37 202 40'

function TablaFondo({ semilla }) {
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
        <path d={MADERA} fill="var(--madera)" />
        <path d={MADERA} fill="none" stroke="var(--madera-filo)" strokeWidth="1.4" />
        <path d={VETA_A} fill="none" stroke="var(--madera-veta)" strokeWidth="1.6" strokeLinecap="round" opacity="0.8" />
        <path d={VETA_B} fill="none" stroke="var(--madera-veta)" strokeWidth="1.3" strokeLinecap="round" opacity="0.6" />
      </g>

      {/* Los clavos van fuera del filtro: son de metal, no de madera, y si
          tiemblan dejan de parecer clavos. */}
      <circle cx="15" cy="28" r="3.2" fill="var(--yellow-color, #ffd166)" />
      <circle cx="15" cy="28" r="1.2" fill="#8a6a22" />
      <circle cx="209" cy="28" r="3.2" fill="var(--yellow-color, #ffd166)" />
      <circle cx="209" cy="28" r="1.2" fill="#8a6a22" />
    </svg>
  )
}

function MenuTablas({ abierto, onCerrar, anclaRef, onCompartir }) {
  const navigate = useNavigate()
  const tema = useTema()
  const claro = tema === 'claro'
  const [montado, setMontado] = useState(abierto)
  const cajaRef = useRef(null)
  const veloRef = useRef(null)
  if (abierto && !montado) setMontado(true)

  /* Mientras el cartel exista (también durante su cierre) el header va por
     encima de todo, para que el velo cubra la barra de abajo. */
  useLayoutEffect(() => {
    const header = cajaRef.current?.closest('.app-header')
    if (!montado || !header) return undefined
    header.classList.add('app-header--menu')
    return () => header.classList.remove('app-header--menu')
  }, [montado])

  useGSAP(
    () => {
      const caja = cajaRef.current
      if (!montado || !caja) return
      const tablas = gsap.utils.toArray('[data-tabla]', caja)
      const cuerdas = gsap.utils.toArray('[data-cuerda]', caja)
      const velo = veloRef.current
      const suave = window.matchMedia('(prefers-reduced-motion: reduce)').matches

      /* El círculo del velo: centro en los tres puntos y radio hasta la
         esquina más lejana de la pantalla, ni un píxel de más. */
      const boton = anclaRef?.current?.getBoundingClientRect()
      const cx = boton ? boton.left + boton.width / 2 : window.innerWidth
      const cy = boton ? boton.top + boton.height / 2 : 0
      const radio = Math.hypot(Math.max(cx, window.innerWidth - cx), Math.max(cy, window.innerHeight - cy))
      const circulo = (r) => `circle(${r}px at ${cx}px ${cy}px)`

      if (velo) {
        if (suave) {
          gsap.set(velo, { clipPath: 'none' })
          gsap.to(velo, { autoAlpha: abierto ? 1 : 0, duration: 0.18, ease: 'power1.out' })
        } else if (abierto) {
          gsap.set(velo, { autoAlpha: 1 })
          gsap.fromTo(velo, { clipPath: circulo(0) }, { clipPath: circulo(radio), duration: 0.46, ease: 'power3.out' })
        } else {
          /* Cerrar es más rápido que abrir: la respuesta va antes que el
             adorno. */
          gsap.to(velo, { clipPath: circulo(0), duration: 0.3, ease: 'power2.in' })
        }
      }

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
    <>
    <div className="menu-velo" ref={veloRef} aria-hidden="true" />
    <div className="menu-tablas" ref={cajaRef} role="menu" aria-label="Más opciones">
      <span className="menu-tablas-cuerda menu-tablas-cuerda--izq" data-cuerda aria-hidden="true" />
      <span className="menu-tablas-cuerda menu-tablas-cuerda--der" data-cuerda aria-hidden="true" />

      <ul className="menu-tablas-lista">
        {OPCIONES.map((op, i) =>
          op.tipo === 'tema' ? (
            <li key={op.id} className="menu-tablas-item" data-tabla>
              <button
                type="button"
                role="menuitemcheckbox"
                aria-checked={claro}
                className="menu-tabla menu-tabla--tema"
                style={{ '--giro': op.giro }}
                onClick={alternarTema}
              >
                <TablaFondo semilla={i} />
                {/* La key reinicia el giro del icono en cada cambio. */}
                <span className="menu-tabla-icono menu-tabla-icono--tema" key={tema} aria-hidden="true">
                  {claro ? <Sun size={17} strokeWidth={2.2} /> : <Moon size={17} strokeWidth={2.2} />}
                </span>
                <span className="menu-tabla-texto">{claro ? 'Modo claro' : 'Modo noche'}</span>
                <SwitchTema claro={claro} />
              </button>
            </li>
          ) : (
            <li key={op.id} className="menu-tablas-item" data-tabla>
              <button
                type="button"
                role="menuitem"
                className={`menu-tabla menu-tabla--${op.id}`}
                style={{ '--giro': op.giro }}
                onClick={() => {
                  /* Compartir llama al menú del sistema aquí mismo, dentro
                     del toque: el navegador solo lo abre si viene de un gesto. */
                  if (op.accion === 'compartir') onCompartir?.()
                  onCerrar()
                  if (op.ruta) navigate(op.ruta)
                }}
              >
                <TablaFondo semilla={i} />
                <op.Icono className="menu-tabla-icono" size={17} strokeWidth={2.2} aria-hidden="true" />
                <span className="menu-tabla-texto">{op.label}</span>
              </button>
            </li>
          ),
        )}
      </ul>
    </div>
    </>
  )
}

export default MenuTablas
