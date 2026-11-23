import { useMemo, useState } from 'react'
import { Navigate, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { Clock, ReceiptText, Ticket } from 'lucide-react'
import { getLocalById } from '../services/locales.js'
import { saveSuscripcion } from '../services/storage.js'
import { idUsuarioActual } from '../services/sesion.js'
import { TIPOS_LOCAL, periodoDe, precioPlanTexto, tipoDeLocal } from '../utils/fichaLocal.js'
import ReservaShell, { BarraConfirmar, BloqueReserva, ResumenReserva } from '../components/Reserva/ReservaShell.jsx'
import PlanesPrecio from '../components/PlanesPrecio/PlanesPrecio.jsx'
import TalyMomento from '../components/Taly/TalyMomento.jsx'
import SelectorTurno from '../components/Turnos/SelectorTurno.jsx'
import { sociosDemo } from '../data/sociosDemo.js'
import { listaTurnos, ocupacionTurnos, turnosDe } from '../utils/turnos.js'
import '../components/Reserva/reserva.css'

/* Unirse a un local de pago mensual (gimnasio, curso…). Se elige un plan y,
   si el local trabaja por turnos (los gimnasios), la tanda a la que vas a ir
   cada día. El local confirma la solicitud y el pago se hace allí, no en
   Citaly. */
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
  const [turnoId, setTurnoId] = useState(null)
  const [enviada, setEnviada] = useState(null)
  const [error, setError] = useState(null)

  /* Los turnos con lo que ya tienen apuntado (los socios del local). */
  const turnos = useMemo(() => {
    if (!local?.suscripcion || !turnosDe(local).activo) return []
    const lista = listaTurnos(local)
    const { cuenta } = ocupacionTurnos(lista, sociosDemo(local))
    return lista.map((t) => ({ ...t, ocupados: cuenta[t.id] }))
  }, [local])

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
          texto={`${local.localName} ya tiene tu solicitud para el plan ${enviada.plan.nombre}${
            enviada.turnoTexto ? `, en el turno de ${enviada.turnoTexto}` : ''
          }. Te escribirán para confirmar el alta.`}
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
  const conTurnos = turnos.length > 0
  const turno = turnos.find((t) => t.id === turnoId) ?? null
  const listo = Boolean(plan) && (!conTurnos || Boolean(turno))
  const falta = error ?? (!plan ? 'Elige un plan' : !listo ? 'Elige tu turno' : null)

  function unirme() {
    if (!listo) return
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
      turno: turno?.id ?? null,
      turnoTexto: turno?.texto ?? null,
      /* 0 = esperando al local, como en las citas. */
      estado: 0,
      creadaEn: new Date().toISOString(),
    }
    if (!saveSuscripcion(solicitud, idUsuarioActual())) {
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
          nota={plan ? [`Plan ${plan.nombre}`, turno?.texto].filter(Boolean).join(' · ') : null}
          texto="Quiero unirme"
          falta={falta}
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

      {conTurnos && (
        <BloqueReserva
          numero={2}
          icono={Clock}
          titulo="Elige tu turno"
          descripcion={`Cada turno dura ${duracionTexto(turnos[0])}. Será tu hora fija para ir; si un día no puedes, avisa al local.`}
          hecho={Boolean(turno)}
          activo={Boolean(plan) && !turno}
        >
          <SelectorTurno
            turnos={turnos}
            elegido={turnoId}
            etiqueta="Turnos del local"
            onElegir={(nuevo) => {
              setTurnoId(nuevo)
              setError(null)
            }}
          />
        </BloqueReserva>
      )}

      <BloqueReserva numero={conTurnos ? 3 : 2} icono={ReceiptText} titulo="Resumen" hecho={listo} activo={listo}>
        <ResumenReserva
          filas={[
            { etiqueta: 'Plan', valor: plan?.nombre ?? null },
            ...(conTurnos ? [{ etiqueta: 'Turno', valor: turno?.texto ?? null }] : []),
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

/* "1 h 30 min", "1 hora"… del primer turno (el último del día puede ser más corto). */
function duracionTexto(turno) {
  const min = turno.fin - turno.inicio
  const h = Math.floor(min / 60)
  const m = min % 60
  if (!h) return `${m} minutos`
  if (m) return `${h} h ${m} min`
  return h === 1 ? '1 hora' : `${h} horas`
}

export default ReservarSuscripcion
