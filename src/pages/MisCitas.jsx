import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import CitaServicio from '../components/CitaServicio/CitaServicio.jsx'
import CitaLugar from '../components/CitaLugar/CitaLugar.jsx'
import ModalAccionCita from '../components/ModalAccionCita/ModalAccionCita.jsx'
import { ACCIONES_CITA, elegirTexto } from '../components/ModalAccionCita/textosAccionCita.js'
import ListaCitas from '../components/ListaCitas/ListaCitas.jsx'
import SuscripcionesCliente from '../components/MisCitas/SuscripcionesCliente.jsx'
import ResumenCliente from '../components/MisCitas/ResumenCliente.jsx'
import { actualizarSuscripcion, getSuscripciones } from '../services/storage.js'
import { hayApi } from '../services/api.js'
import { idUsuarioActual } from '../services/sesion.js'

/* Con backend, solo las solicitudes que hizo esta cuenta (nada de la demo). */
function misSuscripciones() {
  const todas = getSuscripciones()
  if (!hayApi) return todas
  const yo = idUsuarioActual()
  return todas.filter((s) => s.usuarioId && s.usuarioId === yo)
}
import TalyMomento from '../components/Taly/TalyMomento.jsx'
import { ListaEsqueleto } from '../components/Esqueletos/Esqueletos.jsx'
import { useMisCitas } from '../hooks/useMisCitas.js'
import { esCitaDeLugar, esCitaPasada, propsDesdeCita } from '../utils/citasVista.js'
import './misCitas.css'

/* «Busco otra hora»: la reserva del mismo local, en el día que propuso el
   local y con los mismos servicios marcados. */
function rutaOtraHora(cita) {
  const params = new URLSearchParams({ fecha: cita.propuesta?.fecha ?? cita.fecha })
  const servicios = (cita.servicios ?? []).map((s) => s.id).filter(Boolean)
  if (!cita.esLugar && servicios.length) params.set('servicio', servicios.join(','))
  const base = `/local/${encodeURIComponent(cita.localId)}/${cita.esLugar ? 'reservar' : 'reservar-cita'}`
  return `${base}?${params}`
}

/* Pasadas puede crecer sin fin: se enseñan las últimas y el resto a petición. */
const PASADAS_VISIBLES = 4

function MisCitas() {
  const [vista, setVista] = useState('proximas')
  const [accion, setAccion] = useState(null)
  const [todasPasadas, setTodasPasadas] = useState(false)
  const [suscripciones, setSuscripciones] = useState(misSuscripciones)
  const { citas, estado, aviso, recargar, voyPaAlla, cancelar, aceptarHora, marcarAsistencia, publicarOpinion, omitirOpinion } =
    useMisCitas()
  const navigate = useNavigate()
  const esProximas = vista === 'proximas'
  const ahora = new Date()

  const abrirAccion = (tipo, cita) => {
    const { pack } = ACCIONES_CITA[tipo]
    setAccion({
      tipo,
      citaId: cita.id,
      esMesa: esCitaDeLugar(cita),
      textoSi: elegirTexto(pack.si),
      textoNo: elegirTexto(pack.no),
    })
  }

  const cerrarAccion = () => setAccion(null)

  const confirmarAccion = async () => {
    if (!accion) return
    const cita = citas.find((c) => c.id === accion.citaId)
    const { tipo } = accion
    cerrarAccion()
    if (!cita) return
    if (tipo === 'cancelar') {
      /* Solo salta a Pasadas si el servidor la aceptó; si no, se queda donde está. */
      if (await cancelar(cita)) setVista('pasadas')
    } else if (tipo === 'otraHora') {
      /* Se suelta esta y se abre la reserva del local en el día que propuso,
         con lo mismo ya marcado. Al dueño le llega como una pendiente nueva. */
      if (await cancelar(cita)) navigate(rutaOtraHora(cita))
    } else if (tipo === 'aceptarHora') {
      await aceptarHora(cita)
    } else {
      await voyPaAlla(cita)
    }
  }

  const citasVista = citas
    .filter((cita) => (esProximas ? !esCitaPasada(cita, ahora) : esCitaPasada(cita, ahora)))
    .sort((a, b) => {
      const ta = `${a.fecha}T${a.horario}`
      const tb = `${b.fecha}T${b.horario}`
      return esProximas ? ta.localeCompare(tb) : tb.localeCompare(ta)
    })

  const hayCitas = citasVista.length > 0
  const recortar = !esProximas && !todasPasadas && citasVista.length > PASADAS_VISIBLES
  const citasLista = recortar ? citasVista.slice(0, PASADAS_VISIBLES) : citasVista

  const cambiarSuscripcion = (id, cambios) => {
    actualizarSuscripcion(id, cambios)
    setSuscripciones(misSuscripciones())
  }

  /* Una tarjeta por cita. `proxima` marca la más cercana en Próximas: es la
     única donde Taly asoma y la única que va destacada. */
  const renderCita = (cita, i) => {
    const props = propsDesdeCita(cita)
    const handlers = {
      pasada: esCitaPasada(cita, ahora),
      proxima: esProximas && i === 0,
      onVoyPaAlla: () => abrirAccion('voy', cita),
      onCancelar: () => abrirAccion('cancelar', cita),
      onAceptarHora: () => abrirAccion('aceptarHora', cita),
      onOtraHora: () => abrirAccion('otraHora', cita),
    }
    return props.esLugar ? (
      <CitaLugar {...props} {...handlers} />
    ) : (
      <CitaServicio {...props} {...handlers} />
    )
  }

  return (
    <section
      className={`citas ${esProximas ? 'citas--proximas' : 'citas--pasadas'}${hayCitas ? ' citas--lista' : ''}`}
    >
      <div className='switch-color-container'>
        <div
          className={`switch-color-color ${esProximas ? 'switch-color-proximas' : 'switch-color-pasadas'}`}
        />
        <button
          type='button'
          className='switch-color-button'
          onClick={() => setVista('proximas')}
          aria-pressed={esProximas}
        >
          <span className='switch-color-button-text-proximas'>Proximas</span>
        </button>
        <button
          type='button'
          className='switch-color-button'
          onClick={() => setVista('pasadas')}
          aria-pressed={!esProximas}
        >
          <span className='switch-color-button-text-pasadas'>Pasadas</span>
        </button>
      </div>

      {aviso && (
        <p className={`citas-aviso citas-aviso--${aviso.tono}`} role={aviso.tono === 'error' ? 'alert' : 'status'}>
          {aviso.texto}
        </p>
      )}

      {estado === 'cargando' ? (
        <ListaEsqueleto cantidad={2} texto='Cargando tus citas…' />
      ) : estado === 'error' && !hayCitas ? (
        <TalyMomento
          escena='vacio'
          titulo='No pudimos cargar tus citas'
          texto='Revisa tu conexión e inténtalo de nuevo. Tus citas siguen guardadas.'
          accion='Reintentar'
          onAccion={() => recargar()}
        />
      ) : !hayCitas ? (
        <TalyMomento
          escena={esProximas ? 'vacio' : 'hero'}
          pose={esProximas ? undefined : 'mira-abajo'}
          titulo={esProximas ? 'Sin citas por ahora' : 'Aún no hay pasadas'}
          texto={
            esProximas
              ? 'Cuando reserves, Taly las guarda aquí para avisarte a tiempo.'
              : 'Las citas que ya hayas vivido aparecerán en esta lista.'
          }
          accion={esProximas ? 'Descubrir lugares' : undefined}
          onAccion={esProximas ? () => navigate('/') : undefined}
        />
      ) : (
        /* key={vista}: al cambiar de pestaña la lista se monta de nuevo. */
        <>
          {/* Título solo para lectores de pantalla: cada cita lleva un h3 con el
              lugar, y sin un h2 encima la jerarquía salta del h1 al h3. */}
          <h2 className="sr-only">{esProximas ? 'Próximas citas' : 'Citas pasadas'}</h2>
          <ListaCitas key={vista} citas={citasLista} renderCita={renderCita} />
          {recortar && (
            <button type="button" className="citas-ver-todas" onClick={() => setTodasPasadas(true)}>
              Ver las {citasVista.length} pasadas
            </button>
          )}
        </>
      )}

      {/* Debajo de las citas: lo que no es una cita suelta. */}
      <div className="mis-extra">
        <SuscripcionesCliente suscripciones={suscripciones} onCambiar={cambiarSuscripcion} />
        {estado === 'listo' && (
          <ResumenCliente
            citas={citas}
            onAsistencia={marcarAsistencia}
            onOpinar={publicarOpinion}
            onOmitirOpinion={omitirOpinion}
          />
        )}
      </div>
      <ModalAccionCita accion={accion} onConfirmar={confirmarAccion} onCerrar={cerrarAccion} />
    </section>
  )
}

export default MisCitas
