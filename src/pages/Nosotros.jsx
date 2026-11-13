import { useEffect, useLayoutEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { ScrollTrigger, gsap, useGSAP } from '../components/Nosotros/gsapNosotros.js'
import EscenaTinta3D from '../components/Nosotros/EscenaTinta3D.jsx'
import HeroNosotros from '../components/Nosotros/HeroNosotros.jsx'
import HistoriaNosotros from '../components/Nosotros/HistoriaNosotros.jsx'
import PasosNosotros from '../components/Nosotros/PasosNosotros.jsx'
import ValoresNosotros from '../components/Nosotros/ValoresNosotros.jsx'
import EquipoNosotros from '../components/Nosotros/EquipoNosotros.jsx'
import CierreNosotros from '../components/Nosotros/CierreNosotros.jsx'
import TalyPluma from '../components/Taly/TalyPluma.jsx'
import './nosotros.css'

/* Sobre nosotros, a pantalla completa y fuera del Layout: sin header ni
   barra de abajo, solo el viaje. Es la versión a tope (3D, pins, filtros
   vivos); la de móviles modestos se hará aparte. */

function Nosotros() {
  const navigate = useNavigate()
  const hiloRef = useRef(null)

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
    <main className="nosotros">
      <EscenaTinta3D />

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
        <HeroNosotros />
        <HistoriaNosotros />
        <PasosNosotros />
        <ValoresNosotros />
        <EquipoNosotros />
        <CierreNosotros />
      </div>
    </main>
  )
}

export default Nosotros
