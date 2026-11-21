import { useEffect, useState } from 'react'
import { MonitorSmartphone } from 'lucide-react'
import { format, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'
import {
  MIN_CLAVE,
  cambiarContrasena,
  cambiarCorreo,
  cerrarSesionDe,
  listarSesiones,
  problemaClave,
} from '../../services/auth.js'

/* Las tres pantallas de «Tu sesión» que no son salir ni borrar:
   cambiar la contraseña, cambiar el correo y ver los dispositivos. */

function Botones({ onVolver, enviando, texto }) {
  return (
    <div className="perfil-borrar-botones">
      <button type="button" className="perfil-borrar-no" onClick={onVolver} disabled={enviando}>
        Volver
      </button>
      <button type="submit" className="perfil-seguridad-si" disabled={enviando}>
        {enviando ? 'Un momento…' : texto}
      </button>
    </div>
  )
}

function Campo({ etiqueta, ...props }) {
  return (
    <label className="modal-negocio-campo">
      <span>{etiqueta}</span>
      <input className="modal-negocio-input" {...props} />
    </label>
  )
}

function useEnvio() {
  const [enviando, setEnviando] = useState(false)
  const [error, setError] = useState('')
  const [hecho, setHecho] = useState('')
  const enviar = async (accion, textoHecho) => {
    if (enviando) return
    setEnviando(true)
    setError('')
    try {
      await accion()
      setHecho(textoHecho)
    } catch (err) {
      setError(err?.message || 'No se pudo completar.')
    } finally {
      setEnviando(false)
    }
  }
  return { enviando, error, setError, hecho, enviar }
}

function Mensajes({ error, hecho }) {
  return (
    <>
      {error && (
        <p className="editar-perfil-error" role="alert">
          {error}
        </p>
      )}
      {hecho && (
        <p className="perfil-seguridad-hecho" role="status">
          {hecho}
        </p>
      )}
    </>
  )
}

export function CambiarClave({ onVolver }) {
  const [actual, setActual] = useState('')
  const [nueva, setNueva] = useState('')
  const [repetir, setRepetir] = useState('')
  const { enviando, error, setError, hecho, enviar } = useEnvio()

  const guardar = (e) => {
    e.preventDefault()
    if (!actual) return setError('Escribe tu contraseña actual.')
    if (nueva !== repetir) return setError('Las contraseñas nuevas no coinciden.')
    if (nueva === actual) return setError('La nueva tiene que ser distinta de la actual.')
    enviar(async () => {
      await cambiarContrasena({ actual, nueva })
      setActual('')
      setNueva('')
      setRepetir('')
    }, 'Contraseña cambiada. Cerramos tu sesión en los demás dispositivos.')
  }

  const problema = nueva ? problemaClave(nueva) : null
  return (
    <form className="perfil-borrar" onSubmit={guardar} noValidate>
      <p className="perfil-seguridad-titulo">Cambiar la contraseña</p>
      <Campo etiqueta="Contraseña actual" type="password" autoComplete="current-password" value={actual} onChange={(e) => setActual(e.target.value)} />
      <Campo etiqueta="Contraseña nueva" type="password" autoComplete="new-password" maxLength={128} value={nueva} onChange={(e) => setNueva(e.target.value)} />
      <small className="editar-perfil-nota">{problema ?? (nueva ? 'Buena contraseña.' : `Al menos ${MIN_CLAVE} caracteres.`)}</small>
      <Campo etiqueta="Repetir la nueva" type="password" autoComplete="new-password" maxLength={128} value={repetir} onChange={(e) => setRepetir(e.target.value)} />
      <Mensajes error={error} hecho={hecho} />
      <Botones onVolver={onVolver} enviando={enviando} texto="Cambiar" />
    </form>
  )
}

export function CambiarCorreo({ correoActual, verificado, onVolver }) {
  const [nuevo, setNuevo] = useState('')
  const { enviando, error, setError, hecho, enviar } = useEnvio()

  const guardar = (e) => {
    e.preventDefault()
    if (nuevo.trim().toLowerCase() === String(correoActual).toLowerCase()) return setError('Ese ya es tu correo.')
    enviar(
      () => cambiarCorreo(nuevo),
      verificado
        ? `Te mandamos un enlace a ${correoActual} para aprobar el cambio. Después llegará otro a ${nuevo.trim()} para confirmarlo.`
        : `Te mandamos un enlace a ${nuevo.trim()}. El correo cambia cuando lo abras.`,
    )
  }

  return (
    <form className="perfil-borrar" onSubmit={guardar} noValidate>
      <p className="perfil-seguridad-titulo">Cambiar el correo</p>
      <p className="modal-negocio-nota">
        Ahora entras con <b>{correoActual}</b>. Por seguridad, el cambio se confirma por correo: nunca cambia sin que lo apruebes.
      </p>
      <Campo etiqueta="Correo nuevo" type="email" inputMode="email" autoComplete="email" maxLength={254} value={nuevo} onChange={(e) => setNuevo(e.target.value)} />
      <Mensajes error={error} hecho={hecho} />
      <Botones onVolver={onVolver} enviando={enviando} texto="Mandar enlace" />
    </form>
  )
}

function cuando(iso) {
  try {
    return format(parseISO(iso), "d 'de' MMM, h:mm a", { locale: es })
  } catch {
    return ''
  }
}

export function Dispositivos({ onVolver }) {
  const [lista, setLista] = useState(null)
  const [error, setError] = useState('')
  const [cerrando, setCerrando] = useState(null)

  useEffect(() => {
    let vivo = true
    listarSesiones()
      .then((l) => vivo && setLista(l))
      .catch((err) => vivo && setError(err?.message || 'No pudimos cargar tus dispositivos.'))
    return () => {
      vivo = false
    }
  }, [])

  const cerrar = async (s) => {
    setCerrando(s.id)
    setError('')
    try {
      await cerrarSesionDe(s.token)
      setLista((l) => l.filter((x) => x.id !== s.id))
    } catch (err) {
      setError(err?.message || 'No pudimos cerrar esa sesión.')
    } finally {
      setCerrando(null)
    }
  }

  return (
    <div className="perfil-borrar">
      <p className="perfil-seguridad-titulo">Dónde tienes la sesión abierta</p>
      {!lista && !error && <p className="modal-negocio-nota">Cargando…</p>}
      {lista && (
        <ul className="perfil-dispositivos">
          {lista.map((s) => (
            <li key={s.id}>
              <MonitorSmartphone size={18} strokeWidth={2} aria-hidden="true" />
              <span className="perfil-dispositivo-textos">
                <strong>{s.dispositivo}</strong>
                <small>{s.actual ? 'Este dispositivo' : `Último uso: ${cuando(s.desde)}`}</small>
              </span>
              {!s.actual && (
                <button type="button" onClick={() => cerrar(s)} disabled={cerrando === s.id}>
                  {cerrando === s.id ? 'Cerrando…' : 'Cerrar'}
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
      {lista?.length > 1 && <p className="modal-negocio-nota">¿No reconoces alguno? Ciérralo y cambia tu contraseña.</p>}
      <Mensajes error={error} />
      <button type="button" className="perfil-borrar-no" onClick={onVolver}>
        Volver
      </button>
    </div>
  )
}
