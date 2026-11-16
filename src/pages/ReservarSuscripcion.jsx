import { useState } from 'react'
import { Navigate, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { ReceiptText, Ticket } from 'lucide-react'
import { getLocalById } from '../services/locales.js'
import { saveSuscripcion } from '../services/storage.js'
import { TIPOS_LOCAL, periodoDe, precioPlanTexto, tipoDeLocal } from '../utils/fichaLocal.js'
import ReservaShell, { BarraConfirmar, BloqueReserva, ResumenReserva } from '../components/Reserva/ReservaShell.jsx'
import PlanesPrecio from '../components/PlanesPrecio/PlanesPrecio.jsx'
import TalyMomento from '../components/Taly/TalyMomento.jsx'
import '../components/Reserva/reserva.css'

/* Unirse a un local de pago mensual (gimnasio, curso…). Aquí no hay día ni
   hora: se elige un plan y se manda la solicitud. El local la confirma y el
   pago se hace allí, no en Citaly. */
function ReservarSuscripcion() {
  const { id } = useParams()
  const local = getLocalById(id)
  const navigate = useNavigate()
  const planes = local?.planes ?? []

  /* ?plan=<id> llega desde la tarjeta de la ficha. Con un solo plan, ya va
     marcado: no tiene sentido pedir que se elija. */
  const [searchParams] = useSearchParams()
  const [planId, setPlanId] = useState(() => {
    const pedido = searchParams.get('plan')
    if (pedido && planes.some((p) => p.id === pedido)) return pedido
    return planes.length === 1 ? planes[0].id : null
  })
  const [enviada, setEnviada] = useState(null)
  const [error, setError] = useState(null)

  if (!local) {
    return (
      <section className="reserva reserva--centrada">
        <TalyMomento
          escena="loader"
          pose="busca"
          titulo="No encontramos ese local"
          texto={`No existe un local con el id “${id}”. Revisa el enlace e inténtalo de nuevo.`}
          accion="Volver a Descubre"
          onAccion={() => navigate('/')}
        />
      </section>
    )
  }

  const tipo = tipoDeLocal(local)
  if (tipo !== TIPOS_LOCAL.suscripcion) {
    const destino = tipo === TIPOS_LOCAL.mesa ? 'reservar' : 'reservar-cita'
    return <Navigate to={`/local/${id}/${destino}`} replace />
  }

  if (enviada) {
    return (
      <section className="reserva reserva--centrada">
        <TalyMomento
          escena="confirmacion"
          titulo="¡Solicitud enviada!"
          texto={`${local.localName} ya tiene tu solicitud para el plan ${enviada.plan.nombre}. Te escribirán para confirmar el alta.`}
          accion="Volver al local"
          onAccion={() => navigate(`/local/${id}`)}
          accionSecundaria="Seguir explorando"
          onAccionSecundaria={() => navigate('/')}
        />
      </section>
    )
  }

  const plan = planes.find((p) => p.id === planId) ?? null
  const varios = planes.length > 1

  function unirme() {
    if (!plan) return
    const solicitud = {
      id: crypto.randomUUID(),
      localId: id,
      localNombre: local.localName,
      plan: {
        id: plan.id,
        nombre: plan.nombre,
        precio: Number(plan.precio) || 0,
        periodo: plan.periodo ?? 'mes',
      },
      /* 0 = esperando al local, como en las citas. */
      estado: 0,
      creadaEn: new Date().toISOString(),
    }
    if (!saveSuscripcion(solicitud)) {
      setError('No queda espacio en este dispositivo para guardar la solicitud.')
      return
    }
    setEnviada(solicitud)
  }

  return (
    <ReservaShell
      volverA={`/local/${id}`}
      volverTexto={local.localName}
      titulo="Unirme"
      subtitulo={
        varios
          ? `Compara los planes de ${local.localName} y quédate con el que te sirva.`
          : `Esto es lo que cuesta ${local.localName}.`
      }
      barra={
        <BarraConfirmar
          etiqueta="Cuota"
          valor={plan ? precioPlanTexto(plan) : '—'}
          nota={plan ? `Plan ${plan.nombre}` : null}
          texto="Quiero unirme"
          falta={error ?? (plan ? null : 'Elige un plan')}
          onConfirmar={unirme}
        />
      }
    >
      <BloqueReserva
        numero={1}
        icono={Ticket}
        titulo={varios ? 'Elige tu plan' : 'Tu plan'}
        descripcion={varios ? 'Desliza para ver todos y toca el que quieras.' : null}
        hecho={Boolean(plan)}
        activo={!plan}
      >
        <PlanesPrecio
          planes={planes}
          modo="elegir"
          elegido={planId}
          onElegir={(nuevo) => {
            setPlanId(nuevo)
            setError(null)
          }}
          nombreLocal={local.localName}
        />
      </BloqueReserva>

      <BloqueReserva numero={2} icono={ReceiptText} titulo="Resumen" hecho={Boolean(plan)} activo={Boolean(plan)}>
        <ResumenReserva
          filas={[
            { etiqueta: 'Plan', valor: plan?.nombre ?? null },
            { etiqueta: 'Se paga', valor: plan ? periodoDe(plan).largo : null },
            { etiqueta: 'Dónde', valor: 'En el local' },
            { etiqueta: 'Cuota', valor: plan ? precioPlanTexto(plan) : '—', fuerte: true },
          ]}
        />
        <ol className="reserva-alta">
          <li>Mandas la solicitud con el plan que elegiste.</li>
          <li>{local.localName} te escribe para confirmar el alta.</li>
          <li>Pagas allí, como siempre. Citaly no cobra nada.</li>
        </ol>
      </BloqueReserva>
    </ReservaShell>
  )
}

export default ReservarSuscripcion
