import CabeceraNegocio from '../components/Negocio/CabeceraNegocio.jsx'
import CitaDueno from '../components/Negocio/CitaDueno.jsx'
import './miNegocio.css'

/* Datos de mentira para estilar. Se sustituyen por las citas de hoy del local. */
const CITAS_HOY = [
  {
    id: '1',
    hora: '10:30',
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
    hora: '12:00',
    etiqueta: 'Mediodía',
    cliente: 'Gretel Rodríguez',
    telefono: '+53 5340 7711',
    linea: 'Mesa T2 · Terraza',
    detalle: '4 personas',
    estado: 'pendiente',
  },
  {
    id: '3',
    hora: '14:15',
    cliente: 'Dr. Carlos V.',
    linea: 'Afeitado toalla caliente',
    detalle: 'Julián',
    estado: 'confirmada',
  },
]

/* Reloj fijo del mock, para ver el timeline a mitad de turno mientras se estila. */
//const AHORA_DEMO = new Date(2026, 8, 24, 10, 48)

function MiNegocio() {
  return (
    <section className="negocio" aria-label="Mi Negocio">
      <CabeceraNegocio
        nombre="Itaka"
        url="https://images.unsplash.com/photo-1543007630-9710e4a00a20?q=80&w=735&auto=format&fit=crop"
        recibiendo
        apertura="09:00"
        cierre="19:00"
        ahora={new Date()}
      />
      <div className="negocio-citas">
        {CITAS_HOY.map((cita) => (
          <CitaDueno
            key={cita.id}
            {...cita}
            onConfirmar={cita.estado === 'pendiente' ? () => {} : undefined}
            onRechazar={cita.estado === 'pendiente' ? () => {} : undefined}
          />
        ))}
      </div>
    </section>
  )
}

export default MiNegocio
