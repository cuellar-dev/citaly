import { useState } from 'react'
import { Eye, EyeOff, MapPinned, Store, Trash2 } from 'lucide-react'
import ModalNegocioShell from '../ModalNegocioShell.jsx'
import MapaPin from '../../NuevoLocal/MapaPin.jsx'
import { getMunicipio } from '../../../data/cuba.js'
import { claveNombre } from '../../../utils/validarLocal.js'
import './miLocal.css'

/* Al final del panel: lo que se hace con el local entero.

   No hay «cerrar sesión» aquí: la sesión es de la cuenta de Citaly y se
   cierra en Perfil. El local cuelga de esa cuenta, así que lo que tiene
   sentido es:
     - Ocultarlo: deja de salir en Citaly, pero sigue todo (reservas,
       opiniones, fotos). Se vuelve a mostrar con un toque.
     - Eliminarlo: se borra. Hay que escribir su nombre para confirmarlo;
       en la versión real habría 30 días para arrepentirse.
   Y, si al crearlo no se marcó el punto en el mapa, también se hace aquí. */

const MODALES = {
  ocultar: { titulo: 'Ocultar el local', subtitulo: 'Que no salga un tiempo', tono: 'amarillo', Icono: EyeOff },
  mostrar: { titulo: 'Volver a mostrarlo', subtitulo: 'Que salga otra vez', tono: 'verde', Icono: Eye },
  eliminar: { titulo: 'Eliminar el local', subtitulo: 'No se puede deshacer', tono: 'rojo', Icono: Trash2 },
  mapa: { titulo: 'Tu puerta en el mapa', subtitulo: 'El punto exacto del local', tono: 'verde', Icono: MapPinned },
}

function ZonaLocal({ local, esEjemplo, onOcultar, onEliminar, onUbicar }) {
  const [modal, setModal] = useState(null)
  const [abierto, setAbierto] = useState(false)
  const [confirmacion, setConfirmacion] = useState('')
  const [punto, setPunto] = useState(null)
  const [avisoMapa, setAvisoMapa] = useState('')

  const abrir = (tipo) => {
    setModal(tipo)
    setConfirmacion('')
    setPunto(local.lat != null ? { lat: local.lat, lng: local.lng } : null)
    setAvisoMapa('')
    setAbierto(true)
  }
  const cerrar = () => setAbierto(false)
  const nombreOk = claveNombre(confirmacion) === claveNombre(local.localName)
  const falta = local.propio && local.lat == null
  const municipio = getMunicipio(local.provincia, local.municipio)
  const config = MODALES[modal] ?? {}

  return (
    <section className="zona-local" aria-labelledby="zona-local-titulo">
      <h2 id="zona-local-titulo" className="zona-local-titulo">
        <Store size={16} strokeWidth={2.3} aria-hidden="true" />
        Tu local en Citaly
      </h2>

      {falta && (
        <button type="button" className="zona-local-fila zona-local-fila--aviso" onClick={() => abrir('mapa')}>
          <span className="zona-local-icono zona-local-icono--amarillo">
            <MapPinned size={17} strokeWidth={2.2} aria-hidden="true" />
          </span>
          <span className="zona-local-textos">
            <strong>Marca tu puerta en el mapa</strong>
            <span>Te falta. Es lo que más ayuda a que lleguen.</span>
          </span>
        </button>
      )}

      {!falta && (
        <button type="button" className="zona-local-fila" onClick={() => abrir('mapa')}>
          <span className="zona-local-icono zona-local-icono--verde">
            <MapPinned size={17} strokeWidth={2.2} aria-hidden="true" />
          </span>
          <span className="zona-local-textos">
            <strong>{local.lat != null ? 'Cambiar su posición en el mapa' : 'Marcar su posición en el mapa'}</strong>
            <span>Mueve el pin hasta la puerta. Con eso calculamos qué locales le quedan cerca.</span>
          </span>
        </button>
      )}

      {local.oculto ? (
        <button type="button" className="zona-local-fila" onClick={() => abrir('mostrar')}>
          <span className="zona-local-icono zona-local-icono--verde">
            <Eye size={17} strokeWidth={2.2} aria-hidden="true" />
          </span>
          <span className="zona-local-textos">
            <strong>Volver a mostrarlo</strong>
            <span>Ahora está oculto: nadie lo ve en Citaly.</span>
          </span>
        </button>
      ) : (
        <button type="button" className="zona-local-fila" onClick={() => abrir('ocultar')}>
          <span className="zona-local-icono">
            <EyeOff size={17} strokeWidth={2.2} aria-hidden="true" />
          </span>
          <span className="zona-local-textos">
            <strong>Ocultar el local</strong>
            <span>Por vacaciones, obras o un mal mes. Vuelve cuando quieras.</span>
          </span>
        </button>
      )}

      <button type="button" className="zona-local-fila zona-local-fila--peligro" onClick={() => abrir('eliminar')}>
        <span className="zona-local-icono zona-local-icono--rojo">
          <Trash2 size={17} strokeWidth={2.2} aria-hidden="true" />
        </span>
        <span className="zona-local-textos">
          <strong>Eliminar el local</strong>
          <span>{esEjemplo ? 'Simulado: es un ejemplo, no se borra nada.' : 'Se borra de Citaly para siempre.'}</span>
        </span>
      </button>

      <ModalNegocioShell
        abierto={abierto}
        titulo={config.titulo}
        subtitulo={config.subtitulo}
        tono={config.tono}
        Icono={config.Icono}
        vista={`zona-${modal}`}
        onCerrar={cerrar}
      >
        {modal === 'ocultar' && (
          <div className="modal-negocio-stack">
            <p className="zona-local-explica">
              <b>{local.localName}</b> deja de salir en Descubre, en la búsqueda y en los favoritos de la gente.
            </p>
            <ul className="zona-local-lista">
              <li>Las reservas que ya tienes siguen en pie: atiéndelas o cancélalas tú.</li>
              <li>No pierdes nada: opiniones, fotos y clientes se quedan.</li>
              <li>Lo vuelves a mostrar con un toque, desde aquí mismo.</li>
            </ul>
            <p className="zona-local-explica zona-local-explica--suave">
              ¿Es solo por unas horas? Mejor usa <b>Pausar agenda</b>: se reactiva sola.
            </p>
            <button
              type="button"
              className="zona-local-boton"
              onClick={() => {
                onOcultar(true)
                cerrar()
              }}
            >
              Ocultar {local.localName}
            </button>
          </div>
        )}

        {modal === 'mostrar' && (
          <div className="modal-negocio-stack">
            <p className="zona-local-explica">
              <b>{local.localName}</b> vuelve a salir en Citaly y se puede reservar otra vez.
            </p>
            <button
              type="button"
              className="zona-local-boton zona-local-boton--verde"
              onClick={() => {
                onOcultar(false)
                cerrar()
              }}
            >
              Mostrar {local.localName}
            </button>
          </div>
        )}

        {modal === 'eliminar' && (
          <div className="modal-negocio-stack">
            <p className="zona-local-explica">
              Se borra <b>{local.localName}</b> con su agenda, sus fotos y sus opiniones. Tu cuenta de Citaly sigue igual.
            </p>
            <ul className="zona-local-lista">
              <li>Las reservas pendientes se cancelan y avisamos a esos clientes.</li>
              {esEjemplo ? (
                <li>Es un local de ejemplo: lo verás como borrado, pero al volver sigue ahí.</li>
              ) : (
                <li>En la versión real tendrás 30 días para arrepentirte escribiéndonos.</li>
              )}
              <li>Si solo quieres parar un tiempo, mejor ocúltalo.</li>
            </ul>
            <label className="zona-local-campo">
              <span>
                Escribe <b>{local.localName}</b> para confirmar
              </span>
              <input
                className="modal-negocio-input"
                value={confirmacion}
                autoComplete="off"
                spellCheck={false}
                onChange={(e) => setConfirmacion(e.target.value.slice(0, 60))}
              />
            </label>
            <button
              type="button"
              className="zona-local-boton zona-local-boton--rojo"
              disabled={!nombreOk}
              onClick={() => {
                cerrar()
                onEliminar()
              }}
            >
              Eliminar para siempre
            </button>
          </div>
        )}

        {modal === 'mapa' && (
          <div className="modal-negocio-stack">
            <p className="zona-local-explica">
              {local.lat != null
                ? 'Este es el punto de ahora. Toca el mapa en la puerta, o arrastra el pin hasta ella.'
                : 'Toca el mapa justo en la puerta, o arrastra el pin hasta ella.'}
            </p>
            <MapaPin
              centro={municipio ? { lat: municipio.lat, lng: municipio.lng, zoom: 15 } : { lat: 21.6, lng: -79.4, zoom: 6 }}
              valor={punto}
              etiqueta="Mapa para marcar el local"
              onCambiar={(p) => {
                setPunto(p)
                setAvisoMapa('')
              }}
              onFuera={(motivo) =>
                setAvisoMapa(
                  motivo === 'sin-permiso' || motivo === 'sin-gps'
                    ? 'No pudimos saber dónde estás. Toca el mapa en tu puerta.'
                    : 'Ese punto está fuera de Cuba. Ponlo en tu puerta.',
                )
              }
            />
            {avisoMapa && (
              <p className="zona-local-explica zona-local-explica--error" role="alert">
                {avisoMapa}
              </p>
            )}
            <button
              type="button"
              className="zona-local-boton zona-local-boton--verde"
              disabled={!punto}
              onClick={() => {
                onUbicar(punto)
                cerrar()
              }}
            >
              Guardar el punto
            </button>
          </div>
        )}
      </ModalNegocioShell>
    </section>
  )
}

export default ZonaLocal
