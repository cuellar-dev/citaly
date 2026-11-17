import { useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import FormContacto from '../components/Ayuda/FormContacto.jsx'
import './ayuda.css'
import './opinion.css'

/* Tu opinión: el formulario de los tres ánimos (idea, me gusta, queja).
   Se llega desde el menú, desde el final de Descubre y desde la tarjeta de
   «Citaly está en pañales» de Ayuda. */
function Opinion() {
  const navigate = useNavigate()

  const volver = () => {
    if (window.history.state?.idx > 0) navigate(-1)
    else navigate('/')
  }

  return (
    <section className="ayuda opinion" aria-labelledby="opinion-titulo">
      <header className="ayuda-barra">
        <button type="button" className="ayuda-volver" onClick={volver} aria-label="Volver">
          <ArrowLeft size={19} strokeWidth={2.25} aria-hidden="true" />
        </button>
        <h1 className="ayuda-barra-titulo" id="opinion-titulo">
          Tu opinión
        </h1>
      </header>

      <div className="opinion-intro">
        <span className="opinion-sello">Versión temprana</span>
        <h2 className="opinion-titulo">Ayúdanos a hacer Citaly</h2>
        <p className="opinion-texto">
          Estamos empezando y cada mensaje cuenta. Una idea, algo que te gustó o algo que salió mal: lo leemos todo y
          decide lo próximo que hacemos.
        </p>
      </div>

      <FormContacto />
    </section>
  )
}

export default Opinion
