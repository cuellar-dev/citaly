import { Suspense, lazy, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { ScrollTrigger, gsap, useGSAP } from '../components/Nosotros/gsapNosotros.js'
import FondoPapel from '../components/Nosotros/FondoPapel.jsx'
import { ModoLigero } from '../components/Nosotros/tinta.js'
import HeroNosotros from '../components/Nosotros/HeroNosotros.jsx'
import HistoriaNosotros from '../components/Nosotros/HistoriaNosotros.jsx'
import PasosNosotros from '../components/Nosotros/PasosNosotros.jsx'
import ValoresNosotros from '../components/Nosotros/ValoresNosotros.jsx'
import EquipoNosotros from '../components/Nosotros/EquipoNosotros.jsx'
import CierreNosotros from '../components/Nosotros/CierreNosotros.jsx'
import TalyPluma from '../components/Taly/TalyPluma.jsx'
import './nosotros.css'

/* Three.js solo se descarga si de verdad se va a usar el modo completo. */
const EscenaTinta3D = lazy(() => import('../components/Nosotros/EscenaTinta3D.jsx'))

const CLAVE_MODO = 'citaly-nosotros-ligero'

/* ¿Es un móvil? Sin backend: primero la pista del navegador (userAgentData),
   luego el user agent de siempre y, por último, pantalla táctil y estrecha. */
function esMovil() {
  if (typeof navigator === 'undefined') return false
  if (navigator.userAgentData?.mobile) return true
  if (/Android|iPhone|iPad|iPod|Mobile|Silk|Kindle/i.test(navigator.userAgent)) return true
  return window.matchMedia('(pointer: coarse) and (max-width: 1024px)').matches
}

/* Si la persona ya eligió, manda su elección; si no, ligero en móviles. */
function modoInicial() {
  try {
    const guardado = localStorage.getItem(CLAVE_MODO)
    if (guardado === '1' || guardado === '0') return guardado === '1'
  } catch {
    /* sin almacenamiento: se decide por el dispositivo */
  }
  return esMovil()
}

/* Sobre nosotros, a pantalla completa y fuera del Layout: sin header ni
   barra de abajo, solo el viaje. Tiene dos modos: el completo (3D, línea viva) y el ligero
   (papel con dibujos), que es el de serie en móviles. Las animaciones de
   scroll son las mismas en los dos. */

function Nosotros() {
  const navigate = useNavigate()
  const hiloRef = useRef(null)
  const [ligero, setLigero] = useState(modoInicial)

  const cambiarModo = (valor) => {
    setLigero(valor)
    try {
      localStorage.setItem(CLAVE_MODO, valor ? '1' : '0')
    } catch {
      /* da igual: el cambio vale para esta visita */
    }
  }

  /* El fondo cambia pero las medidas no; aun así se recalcula por si acaso. */
  useEffect(() => {
    const id = requestAnimationFrame(() => ScrollTrigger.refresh())
    return () => cancelAnimationFrame(id)
  }, [ligero])

  /* Se entra siempre por arriba, venga de donde venga. */
  useLayoutEffect(() => {
    window.scrollTo(0, 0)
  }, [])

  /* Las letras cambian de tamaño cuando carga la fuente: recalcula pins. */
  useEffect(() => {
    let vivo = true
    document.fonts?.ready.then(() => vivo && ScrollTrigger.refresh())
    return () => {
      vivo = false
    }
  }, [])

  /* Hilo de progreso: una puntada vertical con el Taly pequeño trepando. */
  useGSAP(
    () => {
      const hilo = hiloRef.current
      const taly = hilo.querySelector('[data-hilo-taly]')
      const lleno = hilo.querySelector('[data-hilo-lleno]')
      const subir = gsap.quickTo(taly, 'y', { duration: 0.45, ease: 'power3.out' })
      const llenar = gsap.quickTo(lleno, 'scaleY', { duration: 0.45, ease: 'power3.out' })
      gsap.set(lleno, { scaleY: 0, transformOrigin: '50% 0%' })

      const alScroll = () => {
        const max = document.documentElement.scrollHeight - window.innerHeight
        const p = max > 0 ? window.scrollY / max : 0
        subir(p * (hilo.clientHeight - taly.clientHeight))
        llenar(p)
      }
      alScroll()
      window.addEventListener('scroll', alScroll, { passive: true })
      return () => window.removeEventListener('scroll', alScroll)
    },
    { scope: hiloRef },
  )

  const volver = () => (window.history.length > 1 ? navigate(-1) : navigate('/'))

  return (
    <ModoLigero.Provider value={ligero}>
    <main className={`nosotros${ligero ? ' nosotros--ligero' : ''}`}>
      {ligero ? (
        <FondoPapel />
      ) : (
        <Suspense fallback={<div className="nosotros-esperando-3d" aria-hidden="true" />}>
          <EscenaTinta3D />
        </Suspense>
      )}

      <button type="button" className="nosotros-volver" onClick={volver} aria-label="Volver">
        <ArrowLeft size={22} aria-hidden="true" />
      </button>

      <div className="nosotros-hilo" ref={hiloRef} aria-hidden="true">
        <span className="nosotros-hilo-guia" />
        <span className="nosotros-hilo-lleno" data-hilo-lleno />
        <span className="nosotros-hilo-taly" data-hilo-taly>
          <TalyPluma tamano={26} />
        </span>
      </div>

      <div className="nosotros-contenido">
        <HeroNosotros ligero={ligero} onCambiarModo={cambiarModo} />
        <HistoriaNosotros />
        <PasosNosotros />
        <ValoresNosotros />
        <EquipoNosotros />
        <CierreNosotros />
      </div>
    </main>
    </ModoLigero.Provider>
  )
}

export default Nosotros
