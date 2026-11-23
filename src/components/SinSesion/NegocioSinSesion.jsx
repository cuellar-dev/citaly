import { Link } from 'react-router-dom'
import TalyMomento from '../Taly/TalyMomento.jsx'
import talyLlave from '../Taly/taly-plastilina-llave.svg'
import '../../pages/perfil.css'
import './sinSesion.css'

/* Mi Negocio sin sesión: la misma pantalla que Perfil sin cuenta, con el
   Taly de plastilina que mira la llave y el candado de su local. Al entrar
   o registrarse vuelve a Mi Negocio. */
function NegocioSinSesion() {
  return (
    <section className="perfil perfil--fuera sin-sesion" aria-label="Mi Negocio sin sesión">
      <TalyMomento
        escena="vacio"
        className="taly-momento--plastilina"
        ilustracion={<img src={talyLlave} alt="" />}
        titulo="Primero, entra con tu cuenta"
        texto="Para crear tu local o ver el que ya tienes, necesitas iniciar sesión."
      />
      <div className="perfil-auth">
        <Link to="/auth?volver=%2Fnegocio" className="perfil-auth-entrar">
          Iniciar sesión
        </Link>
        <Link to="/auth?modo=registro&volver=%2Fnegocio" className="perfil-auth-registro">
          Registrarse
        </Link>
      </div>
    </section>
  )
}

export default NegocioSinSesion
