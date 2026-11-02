import { useState } from 'react'
import { Pencil } from 'lucide-react'
import CabeceraPerfil from '../components/Perfil/CabeceraPerfil.jsx'
import DatosPerfil from '../components/Perfil/DatosPerfil.jsx'
import EditarPerfil from '../components/Perfil/EditarPerfil.jsx'
import VisorFotoPerfil from '../components/Perfil/VisorFotoPerfil.jsx'
import ModalNegocioShell from '../components/Negocio/ModalNegocioShell.jsx'
import { getLocalById } from '../services/locales.js'
import { getPerfiles, savePerfil } from '../services/storage.js'
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
  const [fotoAbierta, setFotoAbierta] = useState(false)
  const [editando, setEditando] = useState(false)

  if (!usuario) return null

  const guardar = (cambios) => {
    savePerfil(ID_USUARIO, cambios)
    setUsuario((u) => ({ ...u, ...cambios }))
    setEditando(false)
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
        onEditar={() => setEditando(true)}
        onFoto={usuario.foto ? () => setFotoAbierta(true) : undefined}
      />
      <DatosPerfil dueno={dueno} trabajo={[]} />
      {fotoAbierta && usuario.foto && (
        <VisorFotoPerfil
          url={usuario.foto.startsWith('data:') ? usuario.foto : fotoCuadrada(usuario.foto, 1200)}
          alt={`Foto de ${usuario.nombre}`}
          onClose={() => setFotoAbierta(false)}
        />
      )}
      <ModalNegocioShell
        abierto={editando}
        titulo="Editar perfil"
        subtitulo="Así te ven en Citaly"
        tono="verde"
        Icono={Pencil}
        vista="editar-perfil"
        onCerrar={() => setEditando(false)}
      >
        <EditarPerfil key={usuario.foto + usuario.nombre} usuario={usuario} onGuardar={guardar} />
      </ModalNegocioShell>
    </section>
  )
}

export default Perfil
