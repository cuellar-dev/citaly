import { Link } from 'react-router-dom'
import TalyMomento from '../Taly/TalyMomento.jsx'
import talyCampana from '../Taly/taly-a-mano-campana-animado.svg'
import '../../pages/perfil.css'
import './sinSesion.css'

/* Notificaciones sin sesión: la misma pantalla que Mi Negocio sin cuenta,
   con el Taly dibujado a mano que da toques a la campana amarilla. Al entrar
   o registrarse vuelve a Notificaciones. */
function NotisSinSesion() {
  return (
    <section className="perfil perfil--fuera sin-sesion" aria-label="Notificaciones sin sesión">
      <TalyMomento
        escena="vacio"
        className="taly-momento--grande"
        ilustracion={<img src={talyCampana} alt="" />}
        titulo="Tus avisos te esperan"
        texto="Inicia sesión para enterarte de tus reservas, confirmaciones y de cuándo abre tu sitio favorito."
      />
      <div className="perfil-auth">
        <Link to="/auth?volver=%2Fnotificaciones" className="perfil-auth-entrar">
          Iniciar sesión
        </Link>
        <Link to="/auth?modo=registro&volver=%2Fnotificaciones" className="perfil-auth-registro">
          Registrarse
        </Link>
      </div>
    </section>
  )
}

export default NotisSinSesion
