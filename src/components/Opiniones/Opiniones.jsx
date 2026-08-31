import './opiniones.css'
import { Star, ChevronDown} from 'lucide-react'
function Opiniones({ nombre, fecha, calificacion, comentario, imagenPerfil, onToggle, expandido }) {
  return (
    <div className='opiniones-container'>
      <div className='opiniones-header'>
        <div className='opiniones-header-left'>
          <img src={imagenPerfil} alt={nombre} className='opiniones-imagen-perfil' />
          <div className='opiniones-header-info'>
            <p className='opiniones-nombre'>{nombre}</p>
            <p className='opiniones-fecha'>{fecha}</p>
          </div>
        </div>
        <div className='opiniones-header-right'>
          <div className='opiniones-header-calificacion'>
            <Star size={13} color={calificacion >= 1 ? 'var(--yellow-color)' : 'var(--yellow-color-black)'} fill= {calificacion >= 1 ? 'var(--yellow-color)' : 'none'} className='opiniones-estrella'/>
            <Star size={13} color={calificacion >= 2 ? 'var(--yellow-color)' : 'var(--yellow-color-black)'} fill= {calificacion >= 2 ? 'var(--yellow-color)' : 'none'} className='opiniones-estrella'/>
            <Star size={13} color={calificacion >= 3 ? 'var(--yellow-color)' : 'var(--yellow-color-black)'} fill= {calificacion >= 3 ? 'var(--yellow-color)' : 'none'} className='opiniones-estrella'/>
            <Star size={13} color={calificacion >= 4 ? 'var(--yellow-color)' : 'var(--yellow-color-black)'} fill= {calificacion >= 4 ? 'var(--yellow-color)' : 'none'} className='opiniones-estrella'/>
            <Star size={13} color={calificacion >= 5 ? 'var(--yellow-color)' : 'var(--yellow-color-black)'} fill= {calificacion >= 5 ? 'var(--yellow-color)' : 'none'} className='opiniones-estrella'/>
            <p className='opiniones-calificacion-texto'>{calificacion}</p>
          </div>
        </div>
      </div>
      <div className='opiniones-body'>
        <ChevronDown size={17} 
        color='var(--primary-color)' 
        className='opiniones-arrow-down' 
        onClick={onToggle}
        style={{transform: `rotate(${expandido ? 0 : 180}deg)`,}}
        />
      <p className='opiniones-comentario' style={{lineClamp: expandido ? 999 : 2 ,WebkitLineClamp: expandido ? 999 : 2}}>{comentario}</p>
    </div>
  </div>
)
}
export default Opiniones