import './listaCitas.css'

/**
 * Lista de tarjetas de cita con scroll propio. El dedo, la rueda y el teclado
 * hacen scroll normal; el snap evita que una tarjeta quede a medias y
 * scroll-behavior deja suave el salto de teclado (flechas, AvPág, Inicio/Fin).
 *
 * Sin GSAP, sin 3D y sin paralaje: lo único que se mueve es el scrollTop, que
 * el navegador resuelve en el compositor.
 *
 * renderCita(cita, indice) devuelve la tarjeta (<CitaServicio/> o <CitaLugar/>).
 */
function ListaCitas({ citas, renderCita }) {
  return (
    <ol
      className="lista-citas"
      tabIndex={0}
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
