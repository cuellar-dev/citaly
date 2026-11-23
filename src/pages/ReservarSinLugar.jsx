import { useEffect, useRef, useState } from 'react'
import { Navigate, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { format, parse } from 'date-fns'
import { es } from 'date-fns/locale'
import { CalendarDays, Scissors } from 'lucide-react'
import { hayApi } from '../services/api.js'
import { horasOcupadasApi, reservarServiciosApi } from '../services/reservasApi.js'
import { useLocal } from '../hooks/useLocal.js'
import { PaginaEsqueleto } from '../components/Esqueletos/Esqueletos.jsx'
import { useCitas } from '../hooks/useCitas.js'
import { useReserva } from '../hooks/useReserva.js'
import { duracionAMinutos } from '../utils/fichaLocal.js'
import ReservaShell, {
  BarraConfirmar,
  BloqueReserva,
  ResumenReserva,
  VacioReserva,
} from '../components/Reserva/ReservaShell.jsx'
import PasoFechaHora from '../components/Reserva/PasoFechaHora.jsx'
import ServicioItem from '../components/ServicioItem/ServicioItem.jsx'
import TalyMomento from '../components/Taly/TalyMomento.jsx'
import '../components/Reserva/reserva.css'

function formatearPrecio(precio) {
  return precio === 0 ? 'GRATIS' : `${precio} CUP`
}

function formatearDemora(minutos) {
  if (!minutos) return null
  const h = Math.floor(minutos / 60)
  const m = minutos % 60
  if (h && m) return `~ ${h} h ${m} min`
  if (h) return `~ ${h} h`
  return `~ ${m} min`
}

function ReservarSinLugar() {
  const { id } = useParams()
  /* Con backend la ficha se pide fresca: trae los servicios con su id real. */
  const { local, fresco } = useLocal(id)
  const navigate = useNavigate()
  const { citas: citasLocales, agregarCita } = useCitas()
  /* Con backend, las horas ocupadas son las del servidor (de todos los
     clientes), no las de este navegador. */
  const [ocupadas, setOcupadas] = useState([])
  const [enviando, setEnviando] = useState(false)
  const [errorEnvio, setErrorEnvio] = useState(null)
  const [vuelta, setVuelta] = useState(0)
  useEffect(() => {
    if (!hayApi) return undefined
    let vivo = true
    horasOcupadasApi(id)
      .then((lista) => {
        if (vivo) setOcupadas(lista)
      })
      .catch(() => {})
    return () => {
      vivo = false
    }
  }, [id, vuelta])
  const citas = hayApi ? ocupadas : citasLocales

  /* Todos los hooks antes de cualquier return: useReserva aguanta local nulo. */
  const reserva = useReserva(local, citas)
  /* ?servicio=<id> llega desde el "+" de la ficha del local, y
     ?servicio=a,b desde «Repetir» en Mis citas (lo de siempre): esos
     servicios salen ya marcados. Los que no existan en este local se ignoran.
     Se recuerdan por NOMBRE: con backend la ficha fresca llega después con
     otros ids, y lo marcado no debe perderse. */
  const [searchParams] = useSearchParams()
  const [serviciosSeleccionados, setServiciosSeleccionados] = useState(() => {
    const pedidos = new Set((searchParams.get('servicio') ?? '').split(',').filter(Boolean))
    return (local?.servicios ?? []).filter((s) => pedidos.has(s.id)).map((s) => s.nombre)
  })
  const [confirmada, setConfirmada] = useState(false)
  const refServicios = useRef(null)
  const refFecha = useRef(null)

  if (local?.lugar) {
    return <Navigate to={`/local/${id}/reservar`} replace />
  }

  if (local?.suscripcion) {
    return <Navigate to={`/local/${id}/unirse`} replace />
  }

  if (!local && !fresco) {
    return (
      <section className="reserva reserva--centrada" aria-busy="true">
        <PaginaEsqueleto />
      </section>
    )
  }

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

  if (confirmada) {
    return (
      <section className="reserva reserva--centrada">
        <TalyMomento
          escena="confirmacion"
          titulo="¡Cita confirmada!"
          texto={`Tu cita en ${local.localName} ya está guardada. Taly la tendrá lista en Mis citas.`}
          accion="Ver mis citas"
          onAccion={() => navigate('/citas')}
          accionSecundaria="Seguir explorando"
          onAccionSecundaria={() => navigate(`/local/${id}`)}
        />
      </section>
    )
  }

  const serviciosDisponibles = local.servicios ?? []
  const serviciosElegidos = serviciosDisponibles.filter((s) =>
    serviciosSeleccionados.includes(s.nombre),
  )

  const precioTotal = serviciosElegidos.reduce((sum, s) => sum + (s.precio || 0), 0)
  const demoraMinutos = serviciosElegidos.reduce(
    (sum, s) => sum + duracionAMinutos(s.duracion),
    0,
  )

  function alternarServicio(nombre) {
    setServiciosSeleccionados((prev) =>
      prev.includes(nombre) ? prev.filter((s) => s !== nombre) : [...prev, nombre],
    )
  }

  // ---- pasos -------------------------------------------------------------

  const hechos = {
    servicios: serviciosElegidos.length > 0,
    fecha: reserva.horario != null,
  }
  const pasos = [
    { id: 'servicios', label: 'Servicios', completo: hechos.servicios },
    { id: 'fecha', label: 'Día y hora', completo: hechos.fecha },
  ]
  const pasoActivo = pasos.findIndex((p) => !p.completo)
  const todoListo = pasoActivo === -1

  const mensaje = !hechos.servicios
    ? 'Marca los servicios que quieres hacerte'
    : !hechos.fecha
      ? 'Escoge el día y la hora'
      : 'Todo listo, ya puedes confirmar'

  const falta = !hechos.servicios
    ? 'Marca al menos un servicio'
    : !hechos.fecha
      ? 'Falta elegir la hora'
      : null

  const resumenGuia = []
  if (serviciosElegidos.length) {
    resumenGuia.push(
      `${serviciosElegidos.length} servicio${serviciosElegidos.length > 1 ? 's' : ''}`,
    )
  }
  if (reserva.horario && reserva.fecha) {
    resumenGuia.push(`${format(reserva.fecha, "EEE d", { locale: es })} · ${reserva.horario}`)
  }

  const anclas = { servicios: refServicios, fecha: refFecha }
  const irAPaso = (idPaso) =>
    anclas[idPaso]?.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })

  async function confirmar() {
    if (!todoListo || enviando) return
    if (hayApi) {
      if (!fresco) {
        setErrorEnvio('Un segundo: estamos trayendo la carta del local.')
        return
      }
      setEnviando(true)
      setErrorEnvio(null)
      try {
        await reservarServiciosApi({
          localId: id,
          fecha: format(reserva.fecha, 'yyyy-MM-dd'),
          horario: reserva.horario,
          serviciosIds: serviciosElegidos.map((s) => s.id),
        })
        setServiciosSeleccionados([])
        reserva.reiniciarFechaYHora()
        setConfirmada(true)
      } catch (error) {
        /* Alguien cogió esa hora mientras mirabas: se vuelve a pedir la agenda. */
        if (error?.status === 409) setVuelta((v) => v + 1)
        setErrorEnvio(error?.message || 'No se pudo guardar la cita. Prueba otra vez.')
      } finally {
        setEnviando(false)
      }
      return
    }
    agregarCita({
      id: crypto.randomUUID(),
      esLugar: false,
      localId: id,
      localNombre: local.localName,
      fecha: format(reserva.fecha, 'yyyy-MM-dd'),
      horario: reserva.horario,
      servicios: serviciosElegidos.map((s) => ({
        id: s.id,
        nombre: s.nombre,
        precio: s.precio ?? 0,
        duracion: s.duracion ?? null,
      })),
      precioTotal,
      demoraMinutos,
      estadoReserva: 0,
      creadaEn: new Date().toISOString(),
    })
    setServiciosSeleccionados([])
    reserva.reiniciarFechaYHora()
    setConfirmada(true)
  }

  const fechaTexto =
    reserva.fecha && reserva.horario
      ? `${format(reserva.fecha, "EEE d 'de' MMM", { locale: es })}, ${format(
          parse(reserva.horario, 'HH:mm', reserva.fecha),
          'h:mm a',
          { locale: es },
        )}`
      : reserva.fecha
        ? format(reserva.fecha, "EEE d 'de' MMM", { locale: es })
        : null

  return (
    <ReservaShell
      volverA={`/local/${id}`}
      volverTexto={local.localName}
      titulo="Reservar cita"
      subtitulo={`Elige servicios y hora en ${local.localName}.`}
      guia={{
        pasos,
        pasoActual: todoListo ? pasos.length : pasoActivo,
        mensaje,
        resumen: resumenGuia,
        pegada: reserva.guiaPegada,
        onPasoClick: irAPaso,
      }}
      barra={
        <BarraConfirmar
          etiqueta="Total"
          valor={serviciosElegidos.length ? formatearPrecio(precioTotal) : '—'}
          nota={formatearDemora(demoraMinutos)}
          texto="Confirmar cita"
          falta={enviando ? 'Guardando tu cita…' : falta}
          aviso={errorEnvio}
          onConfirmar={confirmar}
        />
      }
    >
      <BloqueReserva
        anclaRef={refServicios}
        numero={1}
        icono={Scissors}
        titulo="Servicios"
        descripcion="Marca todo lo que quieras hacerte en la misma cita."
        hecho={hechos.servicios}
        activo={pasoActivo === 0}
        vacio={
          serviciosDisponibles.length === 0 ? (
            <VacioReserva
              icono={Scissors}
              titulo="Este local aún no publicó servicios"
              texto="Todavía no hay nada que reservar aquí. Escríbeles y pregunta qué ofrecen."
            />
          ) : null
        }
      >
        <ul className="reserva-servicios">
          {serviciosDisponibles.map((servicio) => (
            <ServicioItem
              key={servicio.id}
              {...servicio}
              marcable
              seleccionado={serviciosSeleccionados.includes(servicio.nombre)}
              onSeleccionar={() => alternarServicio(servicio.nombre)}
            />
          ))}
        </ul>
      </BloqueReserva>

      <BloqueReserva
        anclaRef={refFecha}
        numero={2}
        icono={CalendarDays}
        titulo="Día y hora"
        descripcion="Solo te mostramos los días en que abren y con hueco libre."
        hecho={hechos.fecha}
        activo={pasoActivo === 1}
      >
        <PasoFechaHora
          agenda={reserva.agenda}
          dia={reserva.dia}
          horario={reserva.horario}
          onFecha={reserva.elegirFecha}
          onHora={reserva.setHorario}
        />
      </BloqueReserva>

      <BloqueReserva numero={3} titulo="Resumen" hecho={todoListo} activo={todoListo}>
        <ResumenReserva
          filas={[
            {
              etiqueta: 'Servicios',
              valor: serviciosElegidos.length
                ? serviciosElegidos.map((s) => s.nombre).join(', ')
                : null,
            },
            { etiqueta: 'Cuándo', valor: fechaTexto },
            { etiqueta: 'Demora', valor: formatearDemora(demoraMinutos) },
            {
              etiqueta: 'Total',
              /* Sin nada marcado no decimos GRATIS: decimos que falta elegir. */
              valor: serviciosElegidos.length ? formatearPrecio(precioTotal) : '—',
              fuerte: true,
            },
          ]}
        />
      </BloqueReserva>
    </ReservaShell>
  )
}

export default ReservarSinLugar
