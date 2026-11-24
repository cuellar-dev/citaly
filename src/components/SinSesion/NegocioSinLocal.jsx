import { Link } from 'react-router-dom'
import TalyMomento from '../Taly/TalyMomento.jsx'
import talyCartel from '../Taly/taly-a-mano-cartel-animado.svg'
import '../../pages/perfil.css'
import './sinSesion.css'

/* Con cuenta pero sin ningún local: Taly dibujado a mano escribe en el cartel de
   su local nuevo. (Tras BORRAR un local se ve otra: SinLocal, con el Taly
   triste frente al local cerrado.) */
function NegocioSinLocal() {
  return (
    <section className="perfil perfil--fuera sin-sesion" aria-label="Todavía no tienes local">
      <TalyMomento
        escena="vacio"
        className="taly-momento--grande"
        ilustracion={<img src={talyCartel} alt="" />}
        titulo="Abre tu local en Citaly"
        texto="En dos minutos: qué tipo de negocio es, dónde está y cómo te contactan. Lo revisamos y sale en Descubre."
      />
      <div className="perfil-auth">
        <Link to="/negocio/nuevo" className="perfil-auth-entrar">
          Crear mi local
        </Link>
      </div>
    </section>
  )
}

export default NegocioSinLocal
