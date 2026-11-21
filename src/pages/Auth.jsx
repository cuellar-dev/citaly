import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { ArrowLeft, Eye, EyeOff, MailCheck } from 'lucide-react'
import {
  MIN_CLAVE,
  entrarConGoogle,
  iniciarSesion,
  mensajeErrorGoogle,
  pedirRecuperacion,
  problemaClave,
  reenviarVerificacion,
  registrarse,
  restablecerContrasena,
  rutaSegura,
} from '../services/auth.js'
import talyAMano from '../components/Taly/taly-a-mano.svg'
import talyPapel from '../components/Taly/taly-papel.svg'
import talyCrayon from '../components/Taly/taly-crayon.svg'
import talyCrayon2 from '../components/Taly/taly-crayon-dormido.svg'
import Logotipo from '../components/Logotipo/Logotipo.jsx'
import './auth.css'

/* Entrar, registrarse y recuperar la contraseña. Un solo sitio, cambiando
   de «modo» con ?modo=:

     (nada)       entrar con correo o con Google
     registro     crear cuenta
     recuperar    pedir el correo de «olvidé mi contraseña»
     restablecer  llega del enlace del correo con ?token=; elegir la nueva
     verificado   llega del enlace de verificación del correo
     revisa       tras registrarse, si el backend pide confirmar el correo
     correo       vuelve de un enlace del cambio de correo

   ?volver=/ruta lleva ahí al entrar (solo rutas internas).
   ?error=      lo pone el backend al volver de Google o de un enlace malo. */

const TITULOS = {
  login: 'Bienvenido de nuevo',
  registro: 'Crea tu cuenta',
  recuperar: '¿Olvidaste tu contraseña?',
  restablecer: 'Elige una contraseña nueva',
  verificado: '¡Correo confirmado!',
  revisa: 'Revisa tu correo',
  correo: 'Cambio de correo',
}

function LogoGoogle() {
  return (
    <svg viewBox="0 0 48 48" width="18" height="18" aria-hidden="true" focusable="false">
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3 0 5.8 1.1 7.9 3l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z" />
      <path fill="#FF3D00" d="m6.3 14.7 6.6 4.8C14.7 15.1 19 12 24 12c3 0 5.8 1.1 7.9 3l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
      <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z" />
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z" />
    </svg>
  )
}

function CampoClave({ etiqueta, valor, onCambio, ver, onVer, autoComplete, nombre, ayuda }) {
  return (
    <label className="auth-campo">
      <span>{etiqueta}</span>
      <span className="auth-clave">
        <input
          className="auth-input"
          type={ver ? 'text' : 'password'}
          name={nombre}
          autoComplete={autoComplete}
          value={valor}
          maxLength={128}
          onChange={(e) => onCambio(e.target.value)}
        />
        {onVer && (
          <button type="button" className="auth-ojo" onClick={onVer} aria-label={ver ? 'Ocultar contraseña' : 'Mostrar contraseña'}>
            {ver ? <EyeOff size={18} strokeWidth={2.1} /> : <Eye size={18} strokeWidth={2.1} />}
          </button>
        )}
      </span>
      {ayuda && <small className="auth-ayuda">{ayuda}</small>}
    </label>
  )
}

function Auth() {
  const navigate = useNavigate()
  const [params, setParams] = useSearchParams()
  const modo = TITULOS[params.get('modo')] ? params.get('modo') : 'login'
  const volver = rutaSegura(params.get('volver'))
  const token = params.get('token') ?? ''
  const errorUrl = params.get('error')

  const [nombre, setNombre] = useState('')
  const [correo, setCorreo] = useState('')
  const [contrasena, setContrasena] = useState('')
  const [repetir, setRepetir] = useState('')
  const [verClave, setVerClave] = useState(false)
  const [enviando, setEnviando] = useState(false)
  const [error, setError] = useState('')
  const [aviso, setAviso] = useState('')
  const [hecho, setHecho] = useState(false)

  /* El error que trae la URL (Google, enlace caducado) se enseña una vez. */
  const errorDeUrl =
    !error && errorUrl
      ? modo === 'restablecer' || modo === 'verificado' || modo === 'correo'
        ? 'El enlace ya no vale o caducó. Pide uno nuevo.'
        : mensajeErrorGoogle(errorUrl)
      : ''

  const irA = (nuevo) => {
    setError('')
    setAviso('')
    setHecho(false)
    setContrasena('')
    setRepetir('')
    const siguiente = {}
    if (nuevo) siguiente.modo = nuevo
    if (params.get('volver')) siguiente.volver = volver
    setParams(siguiente, { replace: true })
  }

  const conEnvio = async (accion) => {
    if (enviando) return
    setError('')
    setAviso('')
    setEnviando(true)
    try {
      await accion()
    } catch (err) {
      setError(err?.message || 'No se pudo completar. Inténtalo de nuevo.')
    } finally {
      setEnviando(false)
    }
  }

  const enviar = (e) => {
    e.preventDefault()
    if (modo === 'registro' && contrasena !== repetir) {
      setError('Las contraseñas no coinciden.')
      return
    }
    if (modo === 'restablecer' && contrasena !== repetir) {
      setError('Las contraseñas no coinciden.')
      return
    }
    conEnvio(async () => {
      if (modo === 'registro') {
        const { sesion } = await registrarse({ nombre, correo, contrasena })
        if (sesion) navigate(volver, { replace: true })
        else irA('revisa')
      } else if (modo === 'recuperar') {
        await pedirRecuperacion(correo)
        setHecho(true)
      } else if (modo === 'restablecer') {
        await restablecerContrasena({ token, contrasena })
        setHecho(true)
      } else {
        try {
          await iniciarSesion({ correo, contrasena })
        } catch (err) {
          if (err?.code === 'EMAIL_NOT_VERIFIED') {
            setAviso('Te mandamos otra vez el enlace para confirmar tu correo.')
          }
          throw err
        }
        navigate(volver, { replace: true })
      }
    })
  }

  const conGoogle = () =>
    conEnvio(async () => {
      const r = await entrarConGoogle({ volver })
      if (r.demo) navigate(volver, { replace: true })
    })

  const reenviar = () =>
    conEnvio(async () => {
      await reenviarVerificacion(correo)
      setAviso('Listo. Si no lo ves en unos minutos, mira en «Spam».')
    })

  const problema = modo === 'registro' || modo === 'restablecer' ? (contrasena ? problemaClave(contrasena, correo) : null) : null
  const mensajeError = error || errorDeUrl

  /* ---------- Pantallas sin formulario ---------- */

  let cuerpo
  if (modo === 'verificado' && !errorUrl) {
    cuerpo = (
      <div className="auth-final">
        <MailCheck size={40} strokeWidth={1.8} aria-hidden="true" />
        <p>Tu correo ya está confirmado. Si algún día olvidas la contraseña, te llegará ahí el enlace para cambiarla.</p>
        <button type="button" className="auth-enviar" onClick={() => navigate('/perfil', { replace: true })}>
          Ir a mi perfil
        </button>
      </div>
    )
  } else if (modo === 'correo' && !errorUrl) {
    cuerpo = (
      <div className="auth-final">
        <MailCheck size={40} strokeWidth={1.8} aria-hidden="true" />
        <p>
          Paso hecho. Si el cambio lo aprobaste desde tu correo de antes, ahora te llega otro enlace al correo nuevo: ábrelo para
          terminar. Si ya era el del correo nuevo, tu cuenta ya usa ese correo.
        </p>
        <button type="button" className="auth-enviar" onClick={() => navigate('/perfil', { replace: true })}>
          Ir a mi perfil
        </button>
      </div>
    )
  } else if (modo === 'revisa') {
    cuerpo = (
      <div className="auth-final">
        <MailCheck size={40} strokeWidth={1.8} aria-hidden="true" />
        <p>
          Te mandamos un enlace{correo ? ` a ${correo}` : ''}. Ábrelo para confirmar el correo y entrar. Si no llega en unos
          minutos, mira en «Spam».
        </p>
        {correo && (
          <button type="button" className="auth-secundario" onClick={reenviar} disabled={enviando}>
            Mandar el enlace otra vez
          </button>
        )}
        {aviso && <p className="auth-aviso" role="status">{aviso}</p>}
        {error && <p className="auth-error" role="alert">{error}</p>}
        <button type="button" className="auth-enlace" onClick={() => irA(null)}>
          Volver a iniciar sesión
        </button>
      </div>
    )
  } else if (hecho && modo === 'recuperar') {
    cuerpo = (
      <div className="auth-final">
        <MailCheck size={40} strokeWidth={1.8} aria-hidden="true" />
        <p>
          Si hay una cuenta con <b>{correo}</b>, te llegará un enlace para cambiar la contraseña. Vale 1 hora. Mira también en
          «Spam».
        </p>
        <button type="button" className="auth-enlace" onClick={() => irA(null)}>
          Volver a iniciar sesión
        </button>
      </div>
    )
  } else if (hecho && modo === 'restablecer') {
    cuerpo = (
      <div className="auth-final">
        <MailCheck size={40} strokeWidth={1.8} aria-hidden="true" />
        <p>Contraseña cambiada. Por seguridad cerramos tu sesión en todos los dispositivos: entra con la nueva.</p>
        <button type="button" className="auth-enviar" onClick={() => irA(null)}>
          Iniciar sesión
        </button>
      </div>
    )
  } else if ((modo === 'restablecer' && (!token || errorUrl)) || ((modo === 'verificado' || modo === 'correo') && errorUrl)) {
    cuerpo = (
      <div className="auth-final">
        <p className="auth-error" role="alert">
          El enlace ya no vale o caducó. Los enlaces duran 1 hora y solo sirven una vez.
        </p>
        <button type="button" className="auth-enviar" onClick={() => (modo === 'restablecer' ? irA('recuperar') : navigate('/perfil'))}>
          {modo === 'restablecer' ? 'Pedir otro enlace' : 'Ir a mi perfil'}
        </button>
      </div>
    )
  }

  const conGoogleVisible = modo === 'login' || modo === 'registro'

  return (
    <section className="auth" aria-label={TITULOS[modo]}>
      <div className="auth-fondo" aria-hidden="true">
        <img className="auth-taly auth-taly--papel" src={talyPapel} alt="" />
        <img className="auth-taly auth-taly--crayon" src={talyCrayon} alt="" />
        <img className="auth-taly auth-taly--crayon-2" src={talyCrayon2} alt="" />
        <img className="auth-taly auth-taly--mano" src={talyAMano} alt="" />
        <img className="auth-taly auth-taly--mano-2" src={talyAMano} alt="" />
        <img className="auth-taly auth-taly--mano-3" src={talyAMano} alt="" />
      </div>

      <header className="auth-top">
        {modo === 'recuperar' || modo === 'restablecer' ? (
          <button type="button" className="auth-volver" onClick={() => irA(null)} aria-label="Volver a iniciar sesión">
            <ArrowLeft size={18} strokeWidth={2.25} />
          </button>
        ) : (
          <Link to="/perfil" className="auth-volver" aria-label="Volver al perfil">
            <ArrowLeft size={18} strokeWidth={2.25} />
          </Link>
        )}
      </header>

      <div className="auth-cuerpo">
        <Logotipo className="auth-marca" />
        <h1 className="auth-titulo">{TITULOS[modo]}</h1>
        {modo === 'recuperar' && !hecho && (
          <p className="auth-lead">Pon el correo de tu cuenta y te mandamos un enlace para elegir una contraseña nueva.</p>
        )}

        {cuerpo ?? (
          <>
            {conGoogleVisible && (
              <>
                <button type="button" className="auth-google" onClick={conGoogle} disabled={enviando}>
                  <LogoGoogle />
                  Continuar con Google
                </button>
                <p className="auth-separador">
                  <span>o con tu correo</span>
                </p>
              </>
            )}

            <form className={`auth-form${conGoogleVisible ? ' auth-form--tras-google' : ''}`} onSubmit={enviar} noValidate>
              {modo === 'registro' && (
                <label className="auth-campo">
                  <span>Nombre</span>
                  <input
                    className="auth-input"
                    name="nombre"
                    autoComplete="name"
                    value={nombre}
                    maxLength={60}
                    onChange={(e) => setNombre(e.target.value)}
                  />
                </label>
              )}

              {modo !== 'restablecer' && (
                <label className="auth-campo">
                  <span>Correo</span>
                  <input
                    className="auth-input"
                    type="email"
                    name="email"
                    autoComplete="email"
                    inputMode="email"
                    value={correo}
                    maxLength={254}
                    onChange={(e) => setCorreo(e.target.value)}
                  />
                </label>
              )}

              {modo !== 'recuperar' && (
                <CampoClave
                  etiqueta={modo === 'restablecer' ? 'Contraseña nueva' : 'Contraseña'}
                  nombre="password"
                  valor={contrasena}
                  onCambio={setContrasena}
                  ver={verClave}
                  onVer={() => setVerClave((v) => !v)}
                  autoComplete={modo === 'login' ? 'current-password' : 'new-password'}
                  ayuda={
                    modo === 'login' ? null : problema ?? (contrasena ? 'Buena contraseña.' : `Al menos ${MIN_CLAVE} caracteres.`)
                  }
                />
              )}

              {(modo === 'registro' || modo === 'restablecer') && (
                <CampoClave
                  etiqueta="Repetir contraseña"
                  nombre="password-confirm"
                  valor={repetir}
                  onCambio={setRepetir}
                  ver={verClave}
                  autoComplete="new-password"
                />
              )}

              {modo === 'login' && (
                <button type="button" className="auth-enlace auth-olvide" onClick={() => irA('recuperar')}>
                  ¿Olvidaste tu contraseña?
                </button>
              )}

              {mensajeError && (
                <p className="auth-error" role="alert">
                  {mensajeError}
                </p>
              )}
              {aviso && (
                <p className="auth-aviso" role="status">
                  {aviso}
                </p>
              )}

              <button type="submit" className="auth-enviar" disabled={enviando}>
                {enviando
                  ? 'Un momento…'
                  : {
                      registro: 'Crear cuenta',
                      recuperar: 'Mandarme el enlace',
                      restablecer: 'Guardar contraseña',
                      login: 'Iniciar sesión',
                    }[modo]}
              </button>

              {modo === 'registro' && (
                <p className="auth-legal">
                  Al crear la cuenta aceptas las <Link to="/ayuda">normas de Citaly</Link>. Tu contraseña se guarda cifrada: ni
                  nosotros podemos verla.
                </p>
              )}
            </form>

            {(modo === 'login' || modo === 'registro') && (
              <p className="auth-cambio">
                {modo === 'registro' ? (
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
            )}
          </>
        )}
      </div>
    </section>
  )
}

export default Auth
