import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { ArrowLeft, Eye, EyeOff } from 'lucide-react'
import { iniciarSesion, registrarse } from '../services/auth.js'
import talyAMano from '../components/Taly/taly-a-mano.svg'
import talyPapel from '../components/Taly/taly-papel.svg'
import talyCrayon from '../components/Taly/taly-crayon.svg'
import talyCrayon2 from '../components/Taly/taly-crayon-dormido.svg'
import './auth.css'

function Auth() {
  const navigate = useNavigate()
  const [params, setParams] = useSearchParams()
  const esRegistro = params.get('modo') === 'registro'

  const [nombre, setNombre] = useState('')
  const [correo, setCorreo] = useState('')
  const [contrasena, setContrasena] = useState('')
  const [repetir, setRepetir] = useState('')
  const [verClave, setVerClave] = useState(false)
  const [enviando, setEnviando] = useState(false)
  const [error, setError] = useState('')

  const irA = (modo) => {
    setError('')
    setParams(modo ? { modo } : {}, { replace: true })
  }

  const enviar = async (e) => {
    e.preventDefault()
    if (enviando) return
    setError('')

    if (esRegistro && contrasena !== repetir) {
      setError('Las contraseñas no coinciden.')
      return
    }

    setEnviando(true)
    try {
      if (esRegistro) {
        await registrarse({ nombre, correo, contrasena })
      } else {
        await iniciarSesion({ correo, contrasena })
      }
      /* Cuando haya sesión real: guardar token/usuario aquí y luego navegar. */
      navigate('/perfil', { replace: true })
    } catch (err) {
      setError(err?.message || 'No se pudo completar. Inténtalo de nuevo.')
    } finally {
      setEnviando(false)
    }
  }

  return (
    <section className="auth" aria-label={esRegistro ? 'Registrarse' : 'Iniciar sesión'}>
      <div className="auth-fondo" aria-hidden="true">
        <img className="auth-taly auth-taly--papel" src={talyPapel} alt="" />
        <img className="auth-taly auth-taly--crayon" src={talyCrayon} alt="" />
        <img className="auth-taly auth-taly--crayon-2" src={talyCrayon2} alt="" />
        <img className="auth-taly auth-taly--mano" src={talyAMano} alt="" />
        <img className="auth-taly auth-taly--mano-2" src={talyAMano} alt="" />
        <img className="auth-taly auth-taly--mano-3" src={talyAMano} alt="" />
      </div>

      <header className="auth-top">
        <Link to="/perfil" className="auth-volver" aria-label="Volver al perfil">
          <ArrowLeft size={18} strokeWidth={2.25} />
        </Link>
      </header>

      <div className="auth-cuerpo">
        <p className="auth-marca">Citaly</p>
        <h1 className="auth-titulo">{esRegistro ? 'Crea tu cuenta' : 'Bienvenido de nuevo'}</h1>
        

        <form className="auth-form" onSubmit={enviar} noValidate>
          {esRegistro && (
            <label className="auth-campo">
              <span>Nombre</span>
              <input
                className="auth-input"
                name="nombre"
                autoComplete="name"
                value={nombre}
                maxLength={40}
                onChange={(e) => setNombre(e.target.value)}
              />
            </label>
          )}

          <label className="auth-campo">
            <span>Correo</span>
            <input
              className="auth-input"
              type="email"
              name="email"
              autoComplete="email"
              inputMode="email"
              value={correo}
              onChange={(e) => setCorreo(e.target.value)}
            />
          </label>

          <label className="auth-campo">
            <span>Contraseña</span>
            <span className="auth-clave">
              <input
                className="auth-input"
                type={verClave ? 'text' : 'password'}
                name="password"
                autoComplete={esRegistro ? 'new-password' : 'current-password'}
                value={contrasena}
                onChange={(e) => setContrasena(e.target.value)}
              />
              <button
                type="button"
                className="auth-ojo"
                onClick={() => setVerClave((v) => !v)}
                aria-label={verClave ? 'Ocultar contraseña' : 'Mostrar contraseña'}
              >
                {verClave ? <EyeOff size={18} strokeWidth={2.1} /> : <Eye size={18} strokeWidth={2.1} />}
              </button>
            </span>
          </label>

          {esRegistro && (
            <label className="auth-campo">
              <span>Repetir contraseña</span>
              <input
                className="auth-input"
                type={verClave ? 'text' : 'password'}
                name="password-confirm"
                autoComplete="new-password"
                value={repetir}
                onChange={(e) => setRepetir(e.target.value)}
              />
            </label>
          )}

          {error && (
            <p className="auth-error" role="alert">
              {error}
            </p>
          )}

          <button type="submit" className="auth-enviar" disabled={enviando}>
            {enviando ? 'Un momento…' : esRegistro ? 'Crear cuenta' : 'Iniciar sesión'}
          </button>
        </form>

        <p className="auth-cambio">
          {esRegistro ? (
            <>
              ¿Ya tienes cuenta?{' '}
              <button type="button" className="auth-enlace" onClick={() => irA(null)}>
                Inicia sesión
              </button>
            </>
          ) : (
            <>
              ¿Nuevo en Citaly?{' '}
              <button type="button" className="auth-enlace" onClick={() => irA('registro')}>
                Regístrate
              </button>
            </>
          )}
        </p>
      </div>
    </section>
  )
}

export default Auth
