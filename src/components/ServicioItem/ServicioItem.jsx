import './servicioitem.css'

function ServicioItem({ nombre, precio, duracion, nota, seleccionado, onSeleccionar }) {
  const precioTexto = precio > 0 ? `${precio} CUP` : 'Gratis / consumo en local'

  return (
    <li 
    className={`servicio-item ${seleccionado ? 'servicio-item-tocado' : ''}`}
    onClick={onSeleccionar}
    >
      <div className="servicio-item-info">
        <h3 className="servicio-item-nombre">{nombre}</h3>
        <p className="servicio-item-meta">
          {duracion}
          {nota ? ` · ${nota}` : ''}
        </p>
      </div>
      <p className="servicio-item-precio">{precioTexto}</p>
    </li>
  )
}

export default ServicioItem
