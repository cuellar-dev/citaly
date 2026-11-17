import { Link } from 'react-router-dom'
import { Camera, Check, Clock, FileText, MapPinned, Tag } from 'lucide-react'
import TalyPixel from '../../Ayuda/TalyPixel.jsx'
import '../../NuevoLocal/asistente.css'
import './miLocal.css'

/* Mi Negocio cuando el local ya está aprobado pero le faltan datos: la
   bienvenida y lo que queda, explicado para que nada quede en el aire. */

const OFERTA = {
  servicio: ['Tus servicios', 'Qué haces, cuánto cuesta y lo que tardas.'],
  mesa: ['Tus reservas', 'Si reservar es gratis o tiene precio, y tu sala.'],
  suscripcion: ['Tus planes', 'Lo que paga cada socio al mes y qué incluye.'],
}

function EstadoAprobado({ local }) {
  const hecho = local.pasoCompletar ?? 0
  const [ofertaTitulo, ofertaTexto] = OFERTA[local.tipo] ?? OFERTA.servicio
  const pasos = [
    { Icono: MapPinned, titulo: 'Tu puerta en el mapa', texto: 'Opcional, pero es lo que más ayuda a que lleguen.' },
    { Icono: Clock, titulo: 'Horario', texto: 'Qué días abres y a qué horas se puede reservar.' },
    { Icono: Tag, titulo: ofertaTitulo, texto: ofertaTexto },
    { Icono: Camera, titulo: 'Fotos', texto: 'La portada y las que quieras, hasta 8.' },
    { Icono: FileText, titulo: 'Descripción y comodidades', texto: 'Lo que te hace especial: wifi, climatizado…' },
  ]

  return (
    <section className="mi-local-estado" aria-labelledby="mi-local-aprobado-titulo">
      <div className="mi-local-estado-cabeza">
        <span className="mi-local-estado-taly" aria-hidden="true">
          <TalyPixel estado="llave" />
        </span>
        <span className="mi-local-estado-sello mi-local-estado-sello--verde">Aprobado</span>
        <h2 id="mi-local-aprobado-titulo" className="mi-local-estado-titulo">
          ¡{local.localName} ya forma parte de Citaly!
        </h2>
        <p className="mi-local-estado-texto">
          Te lo contamos también en <b>{local.correoContacto}</b>. Ahora rellena lo que falta para que los clientes puedan
          reservarte. Son 5 pasos cortos y se guardan solos: puedes dejarlo y seguir luego.
        </p>
      </div>

      <ol className="mi-local-pasos">
        {pasos.map(({ Icono, titulo, texto }, i) => (
          <li key={titulo} data-hecho={i < hecho || undefined}>
            <span className="mi-local-pasos-icono" aria-hidden="true">
              {i < hecho ? <Check size={17} strokeWidth={3} /> : <Icono size={17} strokeWidth={2.2} />}
            </span>
            <span>
              <strong>{titulo}</strong>
              <span>{texto}</span>
            </span>
            {i < hecho && <span className="sr-only">(hecho)</span>}
          </li>
        ))}
      </ol>

      <Link to={`/negocio/completar/${local.id}`} className="asistente-seguir mi-local-cta">
        {hecho > 0 ? 'Seguir donde lo dejé' : 'Completar mi local'}
      </Link>
      <p className="mi-local-estado-pie">Hasta que lo termines, tu local no sale en Descubre ni en la búsqueda.</p>
    </section>
  )
}

export default EstadoAprobado
