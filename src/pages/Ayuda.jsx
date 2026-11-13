import { useId, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Plus } from 'lucide-react'
import Taly from '../components/Taly/Taly.jsx'
import FormContacto from '../components/Ayuda/FormContacto.jsx'
import './ayuda.css'

/* Preguntas frecuentes y, debajo, el formulario para escribirnos.

   Las preguntas se abren de una en una: al abrir otra se cierra la
   anterior, para que la página no se convierta en un muro de texto.

   OJO: las respuestas cuentan cómo funciona hoy la demo. Hay que revisarlas
   cuando haya cuentas, pagos o reglas de cancelación de verdad. */

const PREGUNTAS = [
  {
    p: '¿Cómo reservo una cita o una mesa?',
    r: 'Busca el local en Descubre o con el buscador, entra en su ficha y toca Reservar. Eliges el servicio, el día y la hora (y la mesa, si el local tiene su mapa). La reserva queda pendiente hasta que el local la acepte.',
  },
  {
    p: '¿Cómo sé si el local aceptó mi reserva?',
    r: 'En Mis Citas la verás como pendiente hasta que respondan. Cuando el local la acepte cambia su sello y te llega un aviso a la campana. Si activas “WhatsApp al aceptar” en tu perfil, también te llega por ahí.',
  },
  {
    p: '¿Puedo cancelar o cambiar la hora?',
    r: 'Puedes cancelar desde Mis Citas, tocando la cita. Para cambiar la hora, por ahora cancélala y reserva otra. Hazlo con tiempo: así el local puede darle ese hueco a otra persona.',
  },
  {
    p: '¿Me recordáis la cita?',
    r: 'Sí. En Mi Perfil eliges cuándo: 30 minutos, 1 hora o 2 horas antes. Taly te avisa a la hora que pongas.',
  },
  {
    p: '¿Tengo que pagar algo al reservar?',
    r: 'No. Reservar en Citaly no cuesta nada: pagas en el local como siempre, al precio que ves en su ficha.',
  },
  {
    p: '¿Para qué sirven los favoritos?',
    r: 'Toca el corazón de un local para guardarlo. Los tienes todos en el menú de los tres puntos, en Favoritos, y Descubre te enseña sitios parecidos a los que guardaste.',
  },
  {
    p: 'Tengo un negocio, ¿cómo lo pongo en Citaly?',
    r: 'Ve a Mi Negocio y completa la ficha: fotos, horario y servicios. Luego comparte tu enlace o imprime el cartel con el código QR para que tus clientes reserven desde ahí.',
  },
  {
    p: '¿Quién ve mis datos?',
    r: 'Solo el local con el que reservas ve tu nombre y tu teléfono, y solo para esa cita. En las opiniones decides cómo sale tu nombre desde Mi Perfil.',
  },
]

function Pregunta({ p, r, abierta, onAlternar }) {
  const id = useId()
  return (
    <li className={`faq-item${abierta ? ' faq-item--abierta' : ''}`}>
      <h3 className="faq-pregunta-titulo">
        <button
          type="button"
          className="faq-pregunta"
          aria-expanded={abierta}
          aria-controls={`${id}-r`}
          id={`${id}-p`}
          onClick={onAlternar}
        >
          <span>{p}</span>
          <span className="faq-mas" aria-hidden="true">
            <Plus size={18} strokeWidth={2.5} />
          </span>
        </button>
      </h3>
      {/* La respuesta crece con grid-template-rows: anima la altura real sin
          medirla, y se puede interrumpir a mitad. */}
      <div className="faq-respuesta" id={`${id}-r`} role="region" aria-labelledby={`${id}-p`}>
        <div className="faq-respuesta-dentro">
          <p>{r}</p>
        </div>
      </div>
    </li>
  )
}

function Ayuda() {
  const navigate = useNavigate()
  const [abierta, setAbierta] = useState(null)

  const volver = () => {
    if (window.history.state?.idx > 0) navigate(-1)
    else navigate('/')
  }

  return (
    <section className="ayuda" aria-labelledby="ayuda-titulo">
      <header className="ayuda-barra">
        <button type="button" className="ayuda-volver" onClick={volver} aria-label="Volver">
          <ArrowLeft size={19} strokeWidth={2.25} aria-hidden="true" />
        </button>
        <h1 className="ayuda-barra-titulo" id="ayuda-titulo">
          Ayuda
        </h1>
      </header>

      <div className="ayuda-heroe">
        {/* Taly se lo piensa: además de su escena de duda, ladea la cabeza. */}
        <div className="ayuda-taly">
          <Taly escena="duda" tamano={70} titulo="Taly, pensativo" />
        </div>
        <div className="ayuda-heroe-textos">
          <span className="eyebrow">Preguntas frecuentes</span>
          <h2 className="ayuda-titulo">¿En qué te echamos una mano?</h2>
        </div>
      </div>

      <ul className="faq">
        {PREGUNTAS.map((item, i) => (
          <Pregunta
            key={item.p}
            {...item}
            abierta={abierta === i}
            onAlternar={() => setAbierta((a) => (a === i ? null : i))}
          />
        ))}
      </ul>

      <section className="ayuda-contacto" aria-labelledby="ayuda-contacto-titulo">
        <h2 className="ayuda-contacto-titulo" id="ayuda-contacto-titulo">
          ¿No está tu pregunta?
        </h2>
        <p className="ayuda-contacto-texto">
          Escríbenos. Una idea, algo que te gustó o algo que salió mal: todo nos sirve.
        </p>
        <FormContacto />
      </section>
    </section>
  )
}

export default Ayuda
