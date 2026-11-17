import './listaCitas.css'

/**
 * Lista de tarjetas de cita. Ya no tiene scroll propio: debajo de las citas
 * van las suscripciones y el resumen, así que hace scroll la página entera.
 *
 * renderCita(cita, indice) devuelve la tarjeta (<CitaServicio/> o <CitaLugar/>).
 */
function ListaCitas({ citas, renderCita }) {
  return (
    <ol
      className="lista-citas"
      aria-label={`Tus citas, ${citas.length} en total`}
    >
      {citas.map((cita, i) => (
        <li key={cita.id} className="lista-citas-item">
          {renderCita(cita, i)}
        </li>
      ))}
    </ol>
  )
}

export default ListaCitas
