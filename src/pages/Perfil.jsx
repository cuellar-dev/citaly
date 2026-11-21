import { useState } from 'react'
import { Link } from 'react-router-dom'
import { LogOut, Pencil } from 'lucide-react'
import CabeceraPerfil from '../components/Perfil/CabeceraPerfil.jsx'
import DatosPerfil from '../components/Perfil/DatosPerfil.jsx'
import EditarPerfil from '../components/Perfil/EditarPerfil.jsx'
import PanelSesion from '../components/Perfil/PanelSesion.jsx'
import VisorFotoPerfil from '../components/Perfil/VisorFotoPerfil.jsx'
import ModalNegocioShell from '../components/Negocio/ModalNegocioShell.jsx'
import TalyMomento from '../components/Taly/TalyMomento.jsx'
import talyDormido from '../components/Taly/taly-a-mano-dormido-animado.svg'
import { PaginaEsqueleto } from '../components/Esqueletos/Esqueletos.jsx'
import { hayApi } from '../services/api.js'
import { actualizarCuenta, quitarFotoPerfil, reenviarVerificacion, subirFotoPerfil } from '../services/auth.js'
import { useSesion } from '../hooks/useSesion.js'
import { getLocalById } from '../services/locales.js'
import { getPerfiles, savePerfil } from '../services/storage.js'
import { getUsuarioById } from '../services/usuarios.js'
import { fotoCuadrada } from '../utils/fichaLocal.js'
import './perfil.css'

/* En la demo la cuenta es Laura, dueña de Sara. Con backend, la de la sesión:
   nombre, correo, foto y teléfono vienen del servidor; el resto (usuario,
   ciudad, foto subida desde aquí) se guarda de momento en este navegador. */
const ID_LOCAL_DUENO = 'sara'

const SALUDOS = ['Buenas Forastero', 'Quien Eres?', 'UN DESCONOCIDOOOO', 'Mamá ?', 'Ya era hora, no ?']

function usuarioDesdeCuenta(cuenta) {
  if (!cuenta) return null
  if (!hayApi) return { ...getUsuarioById(cuenta.id), ...getPerfiles()[cuenta.id] }
  const extras = getPerfiles()[cuenta.id] ?? {}
  const alias = (cuenta.correo.split('@')[0] || 'usuario').replace(/[^a-z0-9._]/gi, '').toLowerCase()
  return {
    ...extras,
    id: cuenta.id,
    nombre: cuenta.nombre,
    correo: cuenta.correo,
    telefono: cuenta.telefono || extras.telefono || '',
    /* La foto de la cuenta manda; la de una versión vieja guardada aquí, no. */
    foto: cuenta.foto ?? '',
    usuario: extras.usuario ?? (alias.length >= 6 ? alias : `${alias}.citaly`),
  }
}

function Perfil() {
  const { estado, usuario: cuenta } = useSesion()
  /* Lo editado se apunta aquí para pintar al momento, sin esperar al servidor. */
  const [editado, setEditado] = useState(null)
  const [fotoAbierta, setFotoAbierta] = useState(false)
  const [hoja, setHoja] = useState(null)
  const [despedida, setDespedida] = useState(null)
  const [aviso, setAviso] = useState('')
  const [saludo] = useState(() => SALUDOS[Math.floor(Math.random() * SALUDOS.length)])

  if (estado === 'cargando') return <PaginaEsqueleto />

  const base = usuarioDesdeCuenta(cuenta)
  const usuario = base && editado?.id === base.id ? { ...base, ...editado.cambios } : base
  const dueno = hayApi ? null : getLocalById(ID_LOCAL_DUENO)

  const guardar = async (cambios) => {
    setEditado({ id: usuario.id, cambios: { ...editado?.cambios, ...cambios } })
    setHoja(null)
    if (!hayApi) {
      savePerfil(usuario.id, cambios)
      return
    }
    /* Con cuenta real la foto no se guarda en el navegador: va a Cloudinary
       y el backend la pone en la cuenta. El correo no se toca desde aquí. */
    // eslint-disable-next-line no-unused-vars
    const { foto, correo, ...locales } = cambios
    savePerfil(usuario.id, locales)
    try {
      await actualizarCuenta({ nombre: cambios.nombre, telefono: cambios.telefono })
      if (foto !== usuario.foto) {
        if (foto?.startsWith('data:')) await subirFotoPerfil(foto)
        else if (!foto) await quitarFotoPerfil()
      }
      setAviso('')
    } catch (err) {
      setAviso(err?.message || 'No pudimos guardar los cambios en tu cuenta.')
    }
  }

  const reenviar = async () => {
    try {
      await reenviarVerificacion(cuenta.correo)
      setAviso('Te mandamos el enlace. Si no lo ves en unos minutos, mira en «Spam».')
    } catch (err) {
      setAviso(err?.message || 'No pudimos mandar el correo.')
    }
  }

  if (!usuario) {
    return (
      <section className="perfil perfil--fuera" aria-label="Sin cuenta">
        <TalyMomento
          escena="vacio"
          ilustracion={<img src={talyDormido} alt="Taly dormido" />}
          titulo={despedida === 'borrar' ? 'Hasta pronto' : saludo}
          texto={
            despedida === 'borrar'
              ? 'Tu cuenta y tus datos se borraron. Si vuelves, aquí estaremos.'
              : 'No tienes una cuenta iniciada.'
          }
        />
        <div className="perfil-auth">
          <Link to="/auth" className="perfil-auth-entrar">
            Iniciar sesión
          </Link>
          <Link to="/auth?modo=registro" className="perfil-auth-registro">
            Registrarse
          </Link>
        </div>
      </section>
    )
  }

  return (
    <section className="perfil" aria-label="Mi perfil">
      <CabeceraPerfil
        nombre={usuario.nombre}
        usuario={usuario.usuario}
        foto={usuario.foto}
        correo={usuario.correo}
        telefono={usuario.telefono}
        ciudad={usuario.ciudad}
        onEditar={() => setHoja('editar')}
        onFoto={usuario.foto ? () => setFotoAbierta(true) : undefined}
      />
      {hayApi && !cuenta.verificado && (
        <p className="perfil-aviso-cuenta" role="status">
          <span>Confirma tu correo para poder recuperar la cuenta si olvidas la contraseña.</span>
          <button type="button" onClick={reenviar}>
            Mandar enlace
          </button>
        </p>
      )}
      {aviso && (
        <p className="perfil-aviso-cuenta perfil-aviso-cuenta--suave" role="status">
          <span>{aviso}</span>
        </p>
      )}
      <DatosPerfil
        dueno={dueno}
        onSesion={() => setHoja('sesion')}
      />
      {fotoAbierta && usuario.foto && (
        <VisorFotoPerfil
          url={usuario.foto.startsWith('data:') ? usuario.foto : fotoCuadrada(usuario.foto, 1200)}
          alt={`Foto de ${usuario.nombre}`}
          onClose={() => setFotoAbierta(false)}
        />
      )}
      <ModalNegocioShell
        abierto={hoja === 'editar'}
        titulo="Editar perfil"
        subtitulo="Así te ven en Citaly"
        tono="verde"
        Icono={Pencil}
        vista="editar-perfil"
        onCerrar={() => setHoja(null)}
      >
        <EditarPerfil key={usuario.foto + usuario.nombre} usuario={usuario} onGuardar={guardar} correoFijo={hayApi} />
      </ModalNegocioShell>
      <ModalNegocioShell
        abierto={hoja === 'sesion'}
        titulo="Tu sesión"
        subtitulo="Contraseña, correo, dispositivos y salir"
        tono="rojo"
        Icono={LogOut}
        vista="sesion"
        onCerrar={() => setHoja(null)}
      >
        <PanelSesion
          correo={usuario.correo}
          verificado={cuenta.verificado}
          onSalir={(motivo) => {
            setHoja(null)
            setDespedida(motivo)
          }}
        />
      </ModalNegocioShell>
    </section>
  )
}

export default Perfil
