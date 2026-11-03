import { useRef, useState } from 'react'
import { Camera } from 'lucide-react'
import { Seccion } from '../Negocio/modales/piezas.jsx'
import { fotoCuadrada, iniciales } from '../../utils/fichaLocal.js'
import RecortarFoto, { archivoDeFotoValido } from './RecortarFoto.jsx'
import './editarPerfil.css'

function handleLimpio(texto) {
  return String(texto || '')
    .trim()
    .replace(/^@/, '')
    .toLowerCase()
    .replace(/[^a-z0-9._]/g, '')
}

function EditarPerfil({ usuario, onGuardar }) {
  const archivoRef = useRef(null)
  const [form, setForm] = useState(() => ({
    nombre: usuario.nombre ?? '',
    usuario: usuario.usuario ?? '',
    ciudad: usuario.ciudad ?? '',
    telefono: usuario.telefono ?? '',
    correo: usuario.correo ?? '',
    foto: usuario.foto ?? '',
  }))
  const [original] = useState(() => ({
    nombre: usuario.nombre ?? '',
    usuario: usuario.usuario ?? '',
    ciudad: usuario.ciudad ?? '',
    telefono: usuario.telefono ?? '',
    correo: usuario.correo ?? '',
    foto: usuario.foto ?? '',
  }))
  const [bruto, setBruto] = useState(null)
  const [aviso, setAviso] = useState('')

  const cambiar = (campo, valor) => {
    setForm((f) => ({ ...f, [campo]: valor }))
    setAviso('')
  }

  const hayCambios = JSON.stringify(form) !== JSON.stringify(original)
  let error = null
  if (!form.nombre.trim()) error = 'Pon tu nombre.'
  else if (handleLimpio(form.usuario).length < 6) error = 'El usuario necesita al menos 6 caracteres.'
  else if (!form.telefono.trim()) error = 'Pon un teléfono.'
  else if (!form.correo.trim() || !form.correo.includes('@')) error = 'Pon un correo válido.'

  const alArchivo = (e) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    const fallo = archivoDeFotoValido(file)
    if (fallo) {
      setAviso(fallo)
      return
    }
    const lector = new FileReader()
    lector.onload = () => setBruto(String(lector.result))
    lector.readAsDataURL(file)
  }

  const guardar = (e) => {
    e.preventDefault()
    if (error || !hayCambios) return
    onGuardar({
      nombre: form.nombre.trim(),
      usuario: handleLimpio(form.usuario),
      ciudad: form.ciudad.trim(),
      telefono: form.telefono.trim(),
      correo: form.correo.trim(),
      foto: form.foto,
    })
  }

  const vistaFoto = form.foto?.startsWith('data:') ? form.foto : fotoCuadrada(form.foto, 400)

  return (
    <>
      <form className="modal-negocio-stack" onSubmit={guardar} noValidate>
        <Seccion titulo="Foto">
          <button
            type="button"
            className="editar-perfil-foto"
            onClick={() => archivoRef.current?.click()}
            aria-label="Cambiar foto de perfil"
          >
            {vistaFoto ? (
              <img src={vistaFoto} alt="" />
            ) : (
              <span>{iniciales(form.nombre)}</span>
            )}
            <i>
              <Camera size={16} strokeWidth={2.25} />
            </i>
          </button>
          <input
            ref={archivoRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            hidden
            onChange={alArchivo}
          />
             </Seccion>

        <Seccion>
          <label className="modal-negocio-campo">
            <span>Nombre</span>
            <input
              className="modal-negocio-input"
              value={form.nombre}
              maxLength={40}
              onChange={(e) => cambiar('nombre', e.target.value)}
            />
          </label>
          <label className="modal-negocio-campo">
            <span>Usuario</span>
            <input
              className="modal-negocio-input"
              value={form.usuario}
              maxLength={24}
              onChange={(e) => cambiar('usuario', handleLimpio(e.target.value))}
            />
          </label>
          <label className="modal-negocio-campo">
            <span>Municipio</span>
            <input
              className="modal-negocio-input"
              value={form.ciudad}
              maxLength={40}
              onChange={(e) => cambiar('ciudad', e.target.value)}
            />
          </label>
        </Seccion>

        <Seccion >
          <label className="modal-negocio-campo">
            <span>Teléfono</span>
            <input
              type="tel"
              className="modal-negocio-input"
              value={form.telefono}
              placeholder="+53 5 …"
              onChange={(e) => cambiar('telefono', e.target.value)}
            />
          </label>
          <label className="modal-negocio-campo">
            <span>Correo</span>
            <input
              type="email"
              className="modal-negocio-input"
              value={form.correo}
              onChange={(e) => cambiar('correo', e.target.value)}
            />
          </label>
        </Seccion>

        {(error || aviso) && (
          <p className="editar-perfil-error" role="alert">
            {aviso || error}
          </p>
        )}

        <button type="submit" className="modal-negocio-accion-principal" disabled={!hayCambios || Boolean(error)}>
          {hayCambios ? 'Guardar cambios' : 'Sin cambios'}
        </button>
      </form>

      {bruto && (
        <RecortarFoto
          src={bruto}
          onCancelar={() => setBruto(null)}
          onListo={(recortada) => {
            cambiar('foto', recortada)
            setBruto(null)
          }}
        />
      )}
    </>
  )
}

export default EditarPerfil
