import { useEffect, useState } from 'react'
import { KeyRound, LogOut, Mail, MonitorSmartphone, Smartphone, Trash2 } from 'lucide-react'
import { hayApi } from '../../services/api.js'
import { cerrarEnTodos, cerrarSesion, eliminarCuenta, tieneContrasena } from '../../services/auth.js'
import { CambiarClave, CambiarCorreo, Dispositivos } from './SeguridadCuenta.jsx'

/* Tu sesión: cambiar la contraseña o el correo, ver los dispositivos, salir
   de este o de todos, o borrar la cuenta.

   Borrar pide confirmar en dos pasos: escribir la contraseña (si la cuenta
   tiene; las de Google no) y pulsar el botón rojo. El backend además exige
   una sesión reciente y no deja borrar al único dueño de un local
   (backend-citaly-main/Services/CuentaService.js). */

function Accion({ Icono, titulo, valor, onClick, peligro = false, disabled = false }) {
  return (
    <button
      type="button"
      className={`perfil-sesion-accion${peligro ? ' perfil-sesion-accion--peligro' : ''}`}
      onClick={onClick}
      disabled={disabled}
    >
      <span className={`perfil-fila-icono${peligro || Icono === LogOut ? ' perfil-fila-icono--rojo' : ''}`}>
        <Icono size={17} strokeWidth={2.15} aria-hidden="true" />
      </span>
      <span className="perfil-fila-textos">
        <span className="perfil-fila-titulo">{titulo}</span>
        <span className="perfil-fila-valor">{valor}</span>
      </span>
    </button>
  )
}

function ConfirmarBorrado({ onCancelar, onBorrado }) {
  const [conClave, setConClave] = useState(true)
  const [clave, setClave] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    let vivo = true
    tieneContrasena()
      .then((si) => vivo && setConClave(si))
      .catch(() => {})
    return () => {
      vivo = false
    }
  }, [])

  const borrar = async (e) => {
    e.preventDefault()
    if (enviando) return
    if (conClave && !clave) {
      setError('Escribe tu contraseña para confirmar.')
      return
    }
    setEnviando(true)
    setError('')
    try {
      await eliminarCuenta({ contrasena: conClave ? clave : undefined })
      onBorrado()
    } catch (err) {
      setError(err?.message || 'No pudimos borrar la cuenta. Prueba otra vez.')
      setEnviando(false)
    }
  }

  return (
    <form className="perfil-borrar" onSubmit={borrar} noValidate>
      <p className="perfil-borrar-titulo">¿Seguro que quieres borrar tu cuenta?</p>
      <ul className="perfil-borrar-lista">
        <li>Se cancelan tus citas que aún no han llegado.</li>
        <li>Se borran tus favoritos, avisos y ajustes.</li>
        <li>Tus opiniones se quedan, pero sin tu nombre.</li>
        <li>No se puede deshacer.</li>
      </ul>
      {conClave ? (
        <label className="modal-negocio-campo">
          <span>Tu contraseña</span>
          <input
            type="password"
            className="modal-negocio-input"
            autoComplete="current-password"
            value={clave}
            onChange={(e) => setClave(e.target.value)}
          />
        </label>
      ) : (
        <p className="modal-negocio-nota">Entras con Google: si hace más de un día que iniciaste sesión, te pediremos entrar otra vez.</p>
      )}
      {error && (
        <p className="editar-perfil-error" role="alert">
          {error}
        </p>
      )}
      <div className="perfil-borrar-botones">
        <button type="button" className="perfil-borrar-no" onClick={onCancelar} disabled={enviando}>
          Mejor no
        </button>
        <button type="submit" className="perfil-borrar-si" disabled={enviando}>
          {enviando ? 'Borrando…' : 'Borrar mi cuenta'}
        </button>
      </div>
    </form>
  )
}

function PanelSesion({ onSalir, correo = '', verificado = true }) {
  const [vista, setVista] = useState('menu')
  const [conClave, setConClave] = useState(true)
  const [ocupado, setOcupado] = useState(false)
  const [error, setError] = useState('')

  const hacer = async (accion, motivo) => {
    if (ocupado) return
    setOcupado(true)
    setError('')
    try {
      await accion()
      onSalir(motivo)
    } catch (err) {
      setError(err?.message || 'No se pudo completar.')
      setOcupado(false)
    }
  }

  /* Las cuentas que entran solo con Google no tienen contraseña que cambiar. */
  useEffect(() => {
    let vivo = true
    tieneContrasena()
      .then((si) => vivo && setConClave(si))
      .catch(() => {})
    return () => {
      vivo = false
    }
  }, [])

  const volver = () => setVista('menu')
  const pantallas = {
    borrar: <ConfirmarBorrado onCancelar={volver} onBorrado={() => onSalir('borrar')} />,
    clave: <CambiarClave onVolver={volver} />,
    correo: <CambiarCorreo correoActual={correo} verificado={verificado} onVolver={volver} />,
    dispositivos: <Dispositivos onVolver={volver} />,
  }
  if (pantallas[vista]) return <div className="modal-negocio-stack">{pantallas[vista]}</div>

  return (
    <div className="modal-negocio-stack">
      {!hayApi && (
        <p className="modal-negocio-nota">Modo demo: al salir, «Iniciar sesión» te devuelve a la cuenta de Laura.</p>
      )}
      {conClave && (
        <Accion
          Icono={KeyRound}
          titulo="Cambiar la contraseña"
          valor="Cierra la sesión en los demás dispositivos"
          onClick={() => setVista('clave')}
          disabled={ocupado}
        />
      )}
      <Accion
        Icono={Mail}
        titulo="Cambiar el correo"
        valor={correo || 'Con el que entras'}
        onClick={() => setVista('correo')}
        disabled={ocupado}
      />
      <Accion
        Icono={MonitorSmartphone}
        titulo="Dispositivos"
        valor="Dónde tienes la sesión abierta"
        onClick={() => setVista('dispositivos')}
        disabled={ocupado}
      />
      <Accion
        Icono={LogOut}
        titulo="Cerrar sesión"
        valor="Sales de este dispositivo"
        onClick={() => hacer(cerrarSesion, 'cerrar')}
        disabled={ocupado}
      />
      <Accion
        Icono={Smartphone}
        titulo="Cerrar en todos lados"
        valor="Sales del móvil, del ordenador y de cualquier otro sitio"
        onClick={() => hacer(cerrarEnTodos, 'cerrar')}
        disabled={ocupado}
      />
      <Accion
        Icono={Trash2}
        titulo="Eliminar la cuenta"
        valor="Borra tu cuenta y tus datos"
        onClick={() => setVista('borrar')}
        peligro
        disabled={ocupado}
      />
      {error && (
        <p className="editar-perfil-error" role="alert">
          {error}
        </p>
      )}
    </div>
  )
}

export default PanelSesion
