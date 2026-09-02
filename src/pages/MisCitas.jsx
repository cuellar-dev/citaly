import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import CitaServicio from '../components/CitaServicio/CitaServicio.jsx'
import CitaLugar from '../components/CitaLugar/CitaLugar.jsx'
import TalyMomento from '../components/Taly/TalyMomento.jsx'
import { useCitas } from '../hooks/useCitas.js'
import { esCitaPasada, propsDesdeCita } from '../utils/citasVista.js'
import './misCitas.css'

function MisCitas() {
  const [vista, setVista] = useState('proximas')
  const { citas } = useCitas()
  const navigate = useNavigate()
  const esProximas = vista === 'proximas'
  const ahora = new Date()

  const citasVista = citas
    .filter((cita) => (esProximas ? !esCitaPasada(cita, ahora) : esCitaPasada(cita, ahora)))
    .sort((a, b) => {
      const ta = `${a.fecha}T${a.horario}`
      const tb = `${b.fecha}T${b.horario}`
      return esProximas ? ta.localeCompare(tb) : tb.localeCompare(ta)
    })

  return (
    <section className={`citas ${esProximas ? 'citas--proximas' : 'citas--pasadas'}`}>
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

      {citasVista.length === 0 ? (
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
        citasVista.map((cita) => {
          const props = propsDesdeCita(cita)
          if (props.tipo === 'con-lugar') {
            return <CitaLugar key={cita.id} {...props} />
          }
          return <CitaServicio key={cita.id} {...props} />
        })
      )}
    </section>
  )
}

export default MisCitas
