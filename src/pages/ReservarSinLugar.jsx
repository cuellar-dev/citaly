import { useRef, useState } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import { format, parse } from 'date-fns'
import { es } from 'date-fns/locale'
import { CalendarDays, Scissors, UserRound, UsersRound } from 'lucide-react'
import { getLocalById } from '../services/locales.js'
import { profesionalesActivos } from '../services/usuarios.js'
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
import SelectPro from '../components/SelectPro/SelectPro.jsx'
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
  const local = getLocalById(id)
  const navigate = useNavigate()
  const { citas, agregarCita } = useCitas()

  /* Todos los hooks antes de cualquier return: useReserva aguanta local nulo. */
  const reserva = useReserva(local, citas)
  const [serviciosSeleccionados, setServiciosSeleccionados] = useState([])
  const [profesionalSeleccionado, setProfesionalSeleccionado] = useState(null)
  const [confirmada, setConfirmada] = useState(false)
  const refServicios = useRef(null)
  const refProfesional = useRef(null)
  const refFecha = useRef(null)

  if (local?.lugar) {
    return <Navigate to={`/local/${id}/reservar`} replace />
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

  /* Un profesional sin lista propia de servicios los hace todos (datos viejos). */
  const todosLosProfesionales = profesionalesActivos(local)
  const hace = (pro, ids) =>
    !Array.isArray(pro.servicios) || ids.every((s) => pro.servicios.includes(s))

  const serviciosDisponibles = (local.servicios ?? []).filter(
    (s) => !todosLosProfesionales.length || todosLosProfesionales.some((p) => hace(p, [s.id])),
  )
  const serviciosElegidos = serviciosDisponibles.filter((s) =>
    serviciosSeleccionados.includes(s.id),
  )
  const profesionales = todosLosProfesionales.filter((p) => hace(p, serviciosSeleccionados))

  const precioTotal = serviciosElegidos.reduce((sum, s) => sum + (s.precio || 0), 0)
  const demoraMinutos = serviciosElegidos.reduce(
    (sum, s) => sum + duracionAMinutos(s.duracion),
    0,
  )
  const proElegido = profesionales.find((p) => p.id === profesionalSeleccionado)

  function alternarServicio(idServicio) {
    const siguiente = serviciosSeleccionados.includes(idServicio)
      ? serviciosSeleccionados.filter((s) => s !== idServicio)
      : [...serviciosSeleccionados, idServicio]
    setServiciosSeleccionados(siguiente)
    /* Si el profesional elegido ya no hace todo lo marcado, se suelta. */
    const actual = todosLosProfesionales.find((p) => p.id === profesionalSeleccionado)
    if (actual && !hace(actual, siguiente)) setProfesionalSeleccionado(null)
  }

  // ---- pasos -------------------------------------------------------------

  const hechos = {
    servicios: serviciosElegidos.length > 0,
    profesional: profesionalSeleccionado != null,
    fecha: reserva.horario != null,
  }
  const pasos = [
    { id: 'servicios', label: 'Servicios', completo: hechos.servicios },
    { id: 'profesional', label: 'Profesional', completo: hechos.profesional },
    { id: 'fecha', label: 'Día y hora', completo: hechos.fecha },
  ]
  const pasoActivo = pasos.findIndex((p) => !p.completo)
  const todoListo = pasoActivo === -1

  const mensaje = !hechos.servicios
    ? 'Marca los servicios que quieres hacerte'
    : !hechos.profesional
      ? 'Elige quién te atiende'
      : !hechos.fecha
        ? 'Escoge el día y la hora'
        : 'Todo listo, ya puedes confirmar'

  const falta = !hechos.servicios
    ? 'Marca al menos un servicio'
    : !hechos.profesional
      ? 'Falta elegir profesional'
      : !hechos.fecha
        ? 'Falta elegir la hora'
        : null

  const resumenGuia = []
  if (serviciosElegidos.length) {
    resumenGuia.push(
      `${serviciosElegidos.length} servicio${serviciosElegidos.length > 1 ? 's' : ''}`,
    )
  }
  if (proElegido?.name) resumenGuia.push(proElegido.name.split(' ')[0])
  if (reserva.horario && reserva.fecha) {
    resumenGuia.push(`${format(reserva.fecha, "EEE d", { locale: es })} · ${reserva.horario}`)
  }

  const anclas = { servicios: refServicios, profesional: refProfesional, fecha: refFecha }
  const irAPaso = (idPaso) =>
    anclas[idPaso]?.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })

  function confirmar() {
    if (!todoListo) return
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
      profesional: proElegido
        ? { id: proElegido.id, name: proElegido.name }
        : { id: profesionalSeleccionado, name: null },
      precioTotal,
      demoraMinutos,
      estadoReserva: 0,
      creadaEn: new Date().toISOString(),
    })
    setServiciosSeleccionados([])
    setProfesionalSeleccionado(null)
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
      subtitulo={`Elige servicios, profesional y hora en ${local.localName}.`}
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
          falta={falta}
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
              seleccionado={serviciosSeleccionados.includes(servicio.id)}
              onSeleccionar={() => alternarServicio(servicio.id)}
            />
          ))}
        </ul>
      </BloqueReserva>

      <BloqueReserva
        anclaRef={refProfesional}
        numero={2}
        icono={UserRound}
        titulo="Profesional"
        descripcion={
          hechos.servicios
            ? 'Estos pueden hacerte todo lo que marcaste.'
            : 'Marca primero los servicios y te decimos quién puede hacerlos.'
        }
        hecho={hechos.profesional}
        activo={pasoActivo === 1}
        vacio={
          /* El aviso de "nadie hace todos esos servicios" solo tiene sentido si
             el usuario YA marcó algo. Antes salía también con la lista vacía,
             mandándote a quitar un servicio que nunca pusiste. */
          !hechos.servicios ? (
            <VacioReserva
              icono={Scissors}
              titulo="Primero los servicios"
              texto="Cuando marques lo que quieres, aquí salen quienes lo hacen."
            />
          ) : profesionales.length === 0 ? (
            <VacioReserva
              icono={UsersRound}
              titulo="Nadie hace todo eso en una sola cita"
              texto="Prueba a quitar alguno de los servicios y vuelve a mirar."
            />
          ) : null
        }
      >
        <div className="reserva-pros">
          {profesionales.map((pro) => (
            <SelectPro
              key={pro.id}
              name={pro.name}
              url={pro.url}
              points={pro.points}
              seleccionado={pro.id === profesionalSeleccionado}
              onClick={(e) => {
                setProfesionalSeleccionado((prev) => (prev === pro.id ? null : pro.id))
                e.currentTarget.scrollIntoView({
                  behavior: 'smooth',
                  inline: 'center',
                  block: 'nearest',
                })
              }}
            />
          ))}
        </div>
      </BloqueReserva>

      <BloqueReserva
        anclaRef={refFecha}
        numero={3}
        icono={CalendarDays}
        titulo="Día y hora"
        descripcion="Solo te mostramos los días en que abren y con hueco libre."
        hecho={hechos.fecha}
        activo={pasoActivo === 2}
      >
        <PasoFechaHora
          agenda={reserva.agenda}
          dia={reserva.dia}
          horario={reserva.horario}
          onFecha={reserva.elegirFecha}
          onHora={reserva.setHorario}
        />
      </BloqueReserva>

      <BloqueReserva numero={4} titulo="Resumen" hecho={todoListo} activo={todoListo}>
        <ResumenReserva
          filas={[
            {
              etiqueta: 'Servicios',
              valor: serviciosElegidos.length
                ? serviciosElegidos.map((s) => s.nombre).join(', ')
                : null,
            },
            { etiqueta: 'Profesional', valor: proElegido?.name ?? null },
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
