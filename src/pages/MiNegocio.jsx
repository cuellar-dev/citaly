import { useNavigate } from 'react-router-dom'
import TalyMomento from '../components/Taly/TalyMomento.jsx'
import './PagePlaceholder.css'

function MiNegocio() {
  const navigate = useNavigate()

  return (
    <section className='page-placeholder'>
      <TalyMomento
        escena='mensajero'
        titulo='Tu negocio, pronto aquí'
        texto='Taly está preparando el panel del dueño: citas del día y reservas pendientes.'
        accion='Volver a Descubre'
        onAccion={() => navigate('/')}
      />
    </section>
  )
}

export default MiNegocio
