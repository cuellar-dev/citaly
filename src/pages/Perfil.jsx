import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Briefcase, LogOut, Pencil } from 'lucide-react'
import CabeceraPerfil from '../components/Perfil/CabeceraPerfil.jsx'
import DatosPerfil from '../components/Perfil/DatosPerfil.jsx'
import EditarPerfil from '../components/Perfil/EditarPerfil.jsx'
import PanelSesion from '../components/Perfil/PanelSesion.jsx'
import SolicitarTrabajo from '../components/Perfil/SolicitarTrabajo.jsx'
import VisorFotoPerfil from '../components/Perfil/VisorFotoPerfil.jsx'
import ModalNegocioShell from '../components/Negocio/ModalNegocioShell.jsx'
import TalyMomento from '../components/Taly/TalyMomento.jsx'
import { getLocalById } from '../services/locales.js'
import { getPerfiles, savePerfil } from '../services/storage.js'
import { trabajoDeUsuario } from '../services/trabajo.js'
import { getUsuarioById } from '../services/usuarios.js'
import { fotoCuadrada } from '../utils/fichaLocal.js'
import './perfil.css'

/* Cuenta de prueba: dueña de Sara, no trabaja en ningún equipo. */
const ID_USUARIO = 'u-laura-mendez'
const ID_LOCAL_DUENO = 'sara'

function leerUsuario() {
  return { ...getUsuarioById(ID_USUARIO), ...getPerfiles()[ID_USUARIO] }
}

function Perfil() {
  const [usuario, setUsuario] = useState(leerUsuario)
  const dueno = getLocalById(ID_LOCAL_DUENO)
  const [trabajo, setTrabajo] = useState(() => trabajoDeUsuario(ID_USUARIO, { excluirLocalId: ID_LOCAL_DUENO }))
  const [fotoAbierta, setFotoAbierta] = useState(false)
  const [hoja, setHoja] = useState(null)
  const [fuera, setFuera] = useState(null)

  if (!usuario) return null

  const guardar = (cambios) => {
    savePerfil(ID_USUARIO, cambios)
    setUsuario((u) => ({ ...u, ...cambios }))
    setHoja(null)
  }

  const salir = (motivo) => {
    setHoja(null)
    setFuera(motivo)
  }

  if (fuera) {
    return (
      <section className="perfil perfil--fuera" aria-label="Sin cuenta">
        <TalyMomento
          escena="vacio"
          titulo={fuera === 'borrar' ? 'Cuenta eliminada' : 'Sesión cerrada'}
          texto="No tienes una cuenta iniciada."
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
      <DatosPerfil
        dueno={dueno}
        trabajo={trabajo}
        onPedirTrabajo={() => setHoja('trabajo')}
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
        <EditarPerfil key={usuario.foto + usuario.nombre} usuario={usuario} onGuardar={guardar} />
      </ModalNegocioShell>
      <ModalNegocioShell
        abierto={hoja === 'trabajo'}
        titulo="Trabajas en"
        subtitulo="El dueño confirma si es verdad"
        tono="verde"
        Icono={Briefcase}
        vista="pedir-trabajo"
        onCerrar={() => setHoja(null)}
      >
        <SolicitarTrabajo
          usuarioId={ID_USUARIO}
          excluirLocalId={ID_LOCAL_DUENO}
          ocupados={trabajo}
          onListo={() => {
            setTrabajo(trabajoDeUsuario(ID_USUARIO, { excluirLocalId: ID_LOCAL_DUENO }))
            setHoja(null)
          }}
        />
      </ModalNegocioShell>
      <ModalNegocioShell
        abierto={hoja === 'sesion'}
        titulo="Tu sesión"
        subtitulo="Salir o borrar la cuenta"
        tono="rojo"
        Icono={LogOut}
        vista="sesion"
        onCerrar={() => setHoja(null)}
      >
        <PanelSesion onCerrarSesion={() => salir('cerrar')} onEliminar={() => salir('borrar')} />
      </ModalNegocioShell>
    </section>
  )
}

export default Perfil

