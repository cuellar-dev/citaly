import { useNavigate } from 'react-router-dom'
import TalyMomento from '../components/Taly/TalyMomento.jsx'
import './PagePlaceholder.css'

function Perfil() {
  const navigate = useNavigate()

  return (
    <section className='page-placeholder'>
      <TalyMomento
        escena='hero'
        titulo='Tu perfil llega pronto'
        texto='Aquí podrás ver tus datos y preferencias. Mientras, Taly cuida el resto.'
        accion='Ver mis citas'
        onAccion={() => navigate('/citas')}
      />
    </section>
  )
}

export default Perfil
