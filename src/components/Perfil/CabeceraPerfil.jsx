import { Mail, Pencil, Phone } from 'lucide-react'
import { digitos, fotoCuadrada, iniciales } from '../../utils/fichaLocal.js'
import './cabeceraPerfil.css'

function handleDe(usuario) {
  const nick = String(usuario || '').trim().replace(/^@/, '')
  return nick ? `@${nick}` : ''
}

function CabeceraPerfil({ nombre, usuario, foto, correo, telefono, ciudad, onEditar, onFoto }) {
  const tel = digitos(telefono)
  const handle = handleDe(usuario)
  const avatar = foto ? fotoCuadrada(foto, 400) : ''
  const fondo = foto ? fotoCuadrada(foto, 900) : ''

  return (
    <header
      className={`cabecera-perfil${foto ? ' cabecera-perfil--con-foto' : ''}`}
      style={fondo ? { '--perfil-fondo': `url("${fondo}")` } : undefined}
    >
      <div className="cabecera-perfil-barra">
        <button
          type="button"
          className="cabecera-perfil-editar"
          onClick={onEditar}
          disabled={!onEditar}
        >
          <Pencil size={15} strokeWidth={2.25} aria-hidden="true" />
          Editar
        </button>
      </div>

      <div className="cabecera-perfil-quien">
        {foto ? (
          <button type="button" className="cabecera-perfil-foto" onClick={onFoto} aria-label={`Ver la foto de ${nombre}`}>
            <img src={avatar} alt="" />
          </button>
        ) : (
          <div className="cabecera-perfil-foto">
            <span className="cabecera-perfil-iniciales" aria-hidden="true">
              {iniciales(nombre)}
            </span>
          </div>
        )}
        <h2 className="cabecera-perfil-nombre">{nombre}</h2>
        {handle && <p className="cabecera-perfil-usuario">{handle}</p>}
        {ciudad && <p className="cabecera-perfil-meta">{ciudad}</p>}
      </div>

      <ul className="cabecera-perfil-datos">
        {telefono && (
          <li>
            {tel ? (
              <a href={`tel:+${tel}`}>
                <Phone size={13} strokeWidth={2.25} aria-hidden="true" />
                {telefono}
              </a>
            ) : (
              <span>
                <Phone size={13} strokeWidth={2.25} aria-hidden="true" />
                {telefono}
              </span>
            )}
          </li>
        )}
        {correo && (
          <li>
            <a href={`mailto:${correo}`}>
              <Mail size={13} strokeWidth={2.25} aria-hidden="true" />
              {correo}
            </a>
          </li>
        )}
      </ul>
    </header>
  )
}

export default CabeceraPerfil
