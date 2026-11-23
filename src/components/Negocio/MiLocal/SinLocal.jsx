import { useState } from 'react'
import { Link } from 'react-router-dom'
import TalyMomento from '../../Taly/TalyMomento.jsx'
import talySinLocal from '../../Taly/taly-sin-local-animado.svg'
import '../../../pages/perfil.css'
import './miLocal.css'

/* Lo que se ve en Mi Negocio sin local: Taly frente a un local cerrado,
   como el Taly dormido de Perfil cuando no hay sesión. Cada vez, una frase. */

const FRASES = [
  'Aquí había un local…',
  '¿Y el negocio?',
  'Se traspasa',
  'Ni un alma',
  'Cerrado por vacaciones eternas',
  'Tanto espacio libre…',
  '¿Hola? ¿Hay alguien?',
]

function SinLocal({ simulado = false, onVolver }) {
  const [frase] = useState(() => FRASES[Math.floor(Math.random() * FRASES.length)])

  return (
    <section className="perfil perfil--fuera sin-local" aria-label="Sin local">
      <TalyMomento
        escena="vacio"
        ilustracion={<img src={talySinLocal} alt="Taly mira un local cerrado" />}
        titulo={frase}
        texto="No tienes ningún local en Citaly. ¿Abrimos uno?"
      />
      <div className="perfil-auth">
        <Link to="/negocio/nuevo" className="perfil-auth-entrar">
          Crear mi local
        </Link>
        {onVolver && (
          <button type="button" className="perfil-auth-registro" onClick={onVolver}>
            Volver a Mi Negocio
          </button>
        )}
      </div>
      {simulado && <p className="sin-local-nota">Era un local de ejemplo: no se ha borrado nada de verdad.</p>}
    </section>
  )
}

export default SinLocal
