import { useEffect, useState } from 'react'
import { Heart } from 'lucide-react'
import { esFavorito, FAVORITOS_EVENTO, toggleFavorito } from '../../services/favoritos.js'
import './botonFavorito.css'

function BotonFavorito({ id, className = '', tamano = 20 }) {
  const [on, setOn] = useState(() => esFavorito(id))

  useEffect(() => {
    const sync = () => setOn(esFavorito(id))
    window.addEventListener(FAVORITOS_EVENTO, sync)
    window.addEventListener('storage', sync)
    return () => {
      window.removeEventListener(FAVORITOS_EVENTO, sync)
      window.removeEventListener('storage', sync)
    }
  }, [id])

  return (
    <button
      type="button"
      className={`boton-favorito${on ? ' boton-favorito--on' : ''}${className ? ` ${className}` : ''}`}
      aria-pressed={on}
      aria-label={on ? 'Quitar de favoritos' : 'Marcar como favorito'}
      onClick={(e) => {
        e.preventDefault()
        e.stopPropagation()
        setOn(toggleFavorito(id).includes(id))
      }}
    >
      <Heart size={tamano} strokeWidth={2.2} fill={on ? 'currentColor' : 'none'} aria-hidden="true" />
    </button>
  )
}

export default BotonFavorito
