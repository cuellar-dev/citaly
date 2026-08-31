import './selectPro.css'
import { Check, Flame, ThumbsUp, Sparkles, Smile } from 'lucide-react'

const NIVELES = [
  { min: 4.5, text: 'GOAT', Icono: Flame },
  { min: 4, text: 'Muy buen servicio', Icono: ThumbsUp },
  { min: 3, text: 'Buenas manos', Icono: Sparkles },
  { min: 0, text: 'Buena opción', Icono: Smile },
]

function SelectPro({ url, name, points, seleccionado, onClick }) {
  const rating = Math.min(5, Math.max(0, Number(points) || 0))
  const { text, Icono } = NIVELES.find((nivel) => rating >= nivel.min)

  return (
    <div
      className={`tarjeta-pro-container ${seleccionado ? 'tarjeta-pro-seleccionado' : ''}`}
      onClick={onClick}
      role="button"
      tabIndex={0}
      aria-pressed={seleccionado}
      aria-label={`Profesional ${name}, ${text}`}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onClick?.(e)
        }
      }}
    >
      {seleccionado && (
        <span className="tarjeta-pro-check">
          <Check size={12} strokeWidth={3} />
        </span>
      )}
      <div className="tarjeta-pro-img-container">
        <img src={url} alt={`Foto de ${name}`} className="tarjeta-pro-img" />
      </div>
      <div className="tarjeta-pro-info-container">
        <h3 className="tarjeta-pro-name">{name}</h3>
        <div className="tarjeta-pro-badge">
          <Icono size={12} strokeWidth={2.2} className="tarjeta-pro-badge-icono" />
          <p className="tarjeta-pro-text">{text}</p>
        </div>
      </div>
    </div>
  )
}

export default SelectPro
