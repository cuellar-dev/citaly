import { LogOut, Smartphone, Trash2 } from 'lucide-react'

function PanelSesion({ onCerrarSesion, onEliminar }) {
  return (
    <div className="modal-negocio-stack">
      <p className="modal-negocio-nota">
        Esto es un ensayo de cómo se ve salir. Al recargar, Laura sigue iniciada.
      </p>
      <button type="button" className="perfil-sesion-accion" onClick={onCerrarSesion}>
        <span className="perfil-fila-icono perfil-fila-icono--rojo">
          <LogOut size={17} strokeWidth={2.15} aria-hidden="true" />
        </span>
        <span className="perfil-fila-textos">
          <span className="perfil-fila-titulo">Cerrar sesión</span>
          <span className="perfil-fila-valor">Sales de este dispositivo</span>
        </span>
      </button>
      <button type="button" className="perfil-sesion-accion" disabled>
        <span className="perfil-fila-icono">
          <Smartphone size={17} strokeWidth={2.15} aria-hidden="true" />
        </span>
        <span className="perfil-fila-textos">
          <span className="perfil-fila-titulo">Cerrar en todos lados</span>
          <span className="perfil-fila-valor">Cuando haya cuenta de verdad</span>
        </span>
      </button>
      <button type="button" className="perfil-sesion-accion perfil-sesion-accion--peligro" onClick={onEliminar}>
        <span className="perfil-fila-icono perfil-fila-icono--rojo">
          <Trash2 size={17} strokeWidth={2.15} aria-hidden="true" />
        </span>
        <span className="perfil-fila-textos">
          <span className="perfil-fila-titulo">Eliminar la cuenta</span>
          <span className="perfil-fila-valor">Simulado: no borra nada</span>
        </span>
      </button>
    </div>
  )
}

export default PanelSesion
