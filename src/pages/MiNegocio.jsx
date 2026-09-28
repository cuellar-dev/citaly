import { format, parse } from 'date-fns'
import CabeceraNegocio from '../components/Negocio/CabeceraNegocio.jsx'
import CitaDueno from '../components/Negocio/CitaDueno.jsx'
import ResumenNegocio from '../components/Negocio/ResumenNegocio.jsx'
import { minutosHastaCita, textoEnCita } from '../utils/citasVista.js'
import './miNegocio.css'

const FECHA_DEMO = '2026-09-24'

/* Datos de mentira para estilar. Se sustituyen por las citas de hoy del local. */
const CITAS_HOY = [
  {
    id: '1',
    fecha: FECHA_DEMO,
    horario: '10:30',
    etiqueta: 'Ahora',
    cliente: 'Yosvany Morales',
    telefono: '+53 5284 1802',
    linea: 'Corte clásico + barba',
    detalle: 'Barbero: Mateo',
    estado: 'pendiente',
    destacada: true,
  },
  {
    id: '2',
    fecha: FECHA_DEMO,
    horario: '12:00',
    etiqueta: 'Mediodía',
    cliente: 'Gretel Rodríguez',
    telefono: '+53 5340 7711',
    linea: 'Mesa T2 · Terraza',
    detalle: '4 personas',
    estado: 'pendiente',
  },
  {
    id: '3',
    fecha: FECHA_DEMO,
    horario: '14:15',
    cliente: 'Dr. Carlos V.',
    linea: 'Afeitado toalla caliente',
    detalle: 'Julián',
    estado: 'confirmada',
  },
]

/* Reloj fijo del mock, para ver el timeline a mitad de turno mientras se estila. */
const AHORA_DEMO = new Date(2026, 8, 24, 10, 48)

function nombreCorto(nombreCompleto) {
  const partes = String(nombreCompleto || '').trim().split(/\s+/)
  if (partes.length <= 1) return partes[0] || '—'
  const apellido = partes[partes.length - 1]
  return `${partes[0]} ${apellido.charAt(0)}.`
}

function horaAmPm(fecha, horario) {
  const d = parse(`${fecha} ${horario}`, 'yyyy-MM-dd HH:mm', new Date())
  return format(d, 'h:mm a')
}

function valorMinutosHasta(minutos) {
  if (minutos < 0) return 'Pasó'
  if (minutos < 60) return `${minutos} min`
  const horas = Math.floor(minutos / 60)
  const resto = minutos % 60
  if (resto === 0) return horas === 1 ? '1 hora' : `${horas} h`
  return `${horas} h ${resto} min`
}

/** Placeholder: luego sale de citas del día + capacidad del local. */
function resumenDesdeMock(citas, ahora) {
  const proximas = citas
    .filter((c) => minutosHastaCita(c, ahora) >= 0)
    .sort((a, b) => minutosHastaCita(a, ahora) - minutosHastaCita(b, ahora))
  const siguiente = proximas[0]

  return {
    siguiente: siguiente
      ? {
          valor: valorMinutosHasta(minutosHastaCita(siguiente, ahora)),
          cliente: nombreCorto(siguiente.cliente),
          hora: horaAmPm(siguiente.fecha, siguiente.horario),
        }
      : null,
    ocupacion: {
      porcentaje: 85,
      valor: '85%',
      detalle: 'Casi lleno',
    },
    estimado: {
      valor: '185 CUP',
      detalle: '8 citas hoy',
      nota: '+15 CUP prop.',
    },
  }
}

function MiNegocio() {
  const resumen = resumenDesdeMock(CITAS_HOY, AHORA_DEMO)

  return (
    <section className="negocio" aria-label="Mi Negocio">
      <CabeceraNegocio
        nombre="Itaka"
        url="https://images.unsplash.com/photo-1543007630-9710e4a00a20?q=80&w=735&auto=format&fit=crop"
        recibiendo
        apertura="09:00"
        cierre="19:00"
        ahora={AHORA_DEMO}
      />
      <ResumenNegocio
        siguiente={resumen.siguiente}
        ocupacion={resumen.ocupacion}
        estimado={resumen.estimado}
        onPausarAgenda={() => {}}
        onClienteExpress={() => {}}
      />
      <div className="negocio-citas">
        <header className="negocio-citas-encabezado">
          <h2 className="negocio-citas-titulo">Citas de hoy</h2>
          <p className="negocio-citas-contador">{CITAS_HOY.length} en agenda</p>
        </header>
        {CITAS_HOY.map((cita) => (
          <CitaDueno
            key={cita.id}
            {...cita}
            hora={cita.horario}
            relativo={textoEnCita(cita, AHORA_DEMO)}
            onConfirmar={cita.estado === 'pendiente' ? () => {} : undefined}
            onRechazar={cita.estado === 'pendiente' ? () => {} : undefined}
          />
        ))}
      </div>
    </section>
  )
}

export default MiNegocio
