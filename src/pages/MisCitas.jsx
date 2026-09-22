import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import CitaServicio from '../components/CitaServicio/CitaServicio.jsx'
import CitaLugar from '../components/CitaLugar/CitaLugar.jsx'
import ModalAccionCita from '../components/ModalAccionCita/ModalAccionCita.jsx'
import { elegirTexto, TEXTOS_CANCELAR, TEXTOS_VOY } from '../components/ModalAccionCita/textosAccionCita.js'
import RolloRecibos from '../components/RolloRecibos/RolloRecibos.jsx'
import TalyMomento from '../components/Taly/TalyMomento.jsx'
import { useCitas } from '../hooks/useCitas.js'
import { esCitaPasada, propsDesdeCita } from '../utils/citasVista.js'
import './misCitas.css'

function MisCitas() {
  const [vista, setVista] = useState('proximas')
  const [accion, setAccion] = useState(null)
  const { citas, actualizarCita } = useCitas()
  const navigate = useNavigate()
  const esProximas = vista === 'proximas'
  const ahora = new Date()

  const abrirAccion = (tipo, cita) => {
    const pack = tipo === 'cancelar' ? TEXTOS_CANCELAR : TEXTOS_VOY
    setAccion({
      tipo,
      citaId: cita.id,
      textoSi: elegirTexto(pack.si),
      textoNo: elegirTexto(pack.no),
    })
  }

  const cerrarAccion = () => setAccion(null)

  const confirmarAccion = () => {
    if (!accion) return
    const ahoraIso = new Date().toISOString()
    if (accion.tipo === 'cancelar') {
      actualizarCita(accion.citaId, { estadoReserva: 3, canceladaEn: ahoraIso })
      setVista('pasadas')
    } else {
      /* Confirmado: el estado verde ya reservado para cuando el cliente afirma que va. */
      actualizarCita(accion.citaId, { estadoReserva: 1, voyPaAlla: true, voyPaAllaEn: ahoraIso })
    }
    cerrarAccion()
  }

  const citasVista = citas
    .filter((cita) => (esProximas ? !esCitaPasada(cita, ahora) : esCitaPasada(cita, ahora)))
    .sort((a, b) => {
      const ta = `${a.fecha}T${a.horario}`
      const tb = `${b.fecha}T${b.horario}`
      return esProximas ? ta.localeCompare(tb) : tb.localeCompare(ta)
    })

  const hayCitas = citasVista.length > 0

  /* Cada cita es un segmento del rollo; `numero` es su posición impresa en el recibo. */
  const renderCita = (cita, i) => {
    const props = propsDesdeCita(cita)
    const handlers = {
      numero: i + 1,
      onVoyPaAlla: () => abrirAccion('voy', cita),
      onCancelar: () => abrirAccion('cancelar', cita),
    }
    return props.esLugar ? (
      <CitaLugar {...props} {...handlers} />
    ) : (
      <CitaServicio {...props} {...handlers} />
    )
  }

  return (
    <section
      className={`citas ${esProximas ? 'citas--proximas' : 'citas--pasadas'}${hayCitas ? ' citas--recibo' : ''}`}
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

      {!hayCitas ? (
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
        /* key={vista}: al cambiar de pestaña el rollo arranca en la primera cita, sin animar el salto. */
        <RolloRecibos key={vista} citas={citasVista} renderCita={renderCita} />
      )}
      <ModalAccionCita accion={accion} onConfirmar={confirmarAccion} onCerrar={cerrarAccion} />
    </section>
  )
}

export default MisCitas
