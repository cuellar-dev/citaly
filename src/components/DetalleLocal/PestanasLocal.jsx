import { useEffect, useState } from 'react'
import './pestanasLocal.css'

/* Pestañas que se quedan pegadas arriba al bajar: llevan a cada sección y
   marcan en cuál estás. La sección activa es la que cruza una línea a un
   tercio de la pantalla, medida con IntersectionObserver (sin escuchar el
   scroll en cada frame). */
function PestanasLocal({ secciones }) {
  const [activa, setActiva] = useState(secciones[0]?.id)

  useEffect(() => {
    const elementos = secciones.map((s) => document.getElementById(s.id)).filter(Boolean)
    if (!elementos.length) return undefined
    const observador = new IntersectionObserver(
      (entradas) => {
        entradas.forEach((e) => {
          if (e.isIntersecting) setActiva(e.target.id)
        })
      },
      { rootMargin: '-32% 0px -60% 0px' },
    )
    elementos.forEach((el) => observador.observe(el))
    return () => observador.disconnect()
  }, [secciones])

  function ir(id) {
    const suave = !window.matchMedia('(prefers-reduced-motion: reduce)').matches
    document.getElementById(id)?.scrollIntoView({ behavior: suave ? 'smooth' : 'auto', block: 'start' })
    setActiva(id)
  }

  return (
    <nav className="local-pestanas" aria-label="Secciones del local">
      {secciones.map((s) => (
        <a
          key={s.id}
          href={`#${s.id}`}
          className={`local-pestana${activa === s.id ? ' local-pestana--activa' : ''}`}
          aria-current={activa === s.id ? 'true' : undefined}
          onClick={(e) => {
            e.preventDefault()
            ir(s.id)
          }}
        >
          {s.label}
          {s.cuenta ? <span className="local-pestana-cuenta">{s.cuenta}</span> : null}
        </a>
      ))}
    </nav>
  )
}

export default PestanasLocal
