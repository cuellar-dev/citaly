import { Link } from 'react-router-dom'
import talyEscribe from '../Taly/taly-escribe-fuego.svg'
import '../../pages/perfil.css'
import './sinSesion.css'

/* Mis citas sin sesión: de fondo, Taly con gafas escribe muy serio con un
   lápiz en llamas (estilo plano, tipo Duolingo). Encima, abajo, la tarjeta
   con el texto y los botones. Al entrar vuelve a Mis citas. */
function CitasSinSesion() {
  return (
    <section className="citas-sin-sesion" aria-label="Mis citas sin sesión">
      <img className="citas-sin-sesion-fondo" src={talyEscribe} alt="" aria-hidden="true" />
      <div className="citas-sin-sesion-tarjeta">
        <h2>Tus citas te esperan</h2>
        <p>Inicia sesión para ver tus reservas y confirmar que vas.</p>
        <div className="perfil-auth">
          <Link to="/auth?volver=%2Fcitas" className="perfil-auth-entrar">
            Iniciar sesión
          </Link>
          <Link to="/auth?modo=registro&volver=%2Fcitas" className="perfil-auth-registro">
            Registrarse
          </Link>
        </div>
      </div>
    </section>
  )
}

export default CitasSinSesion
