import { Link, useParams, useNavigate } from 'react-router-dom'
import { parse, addMinutes, format, isSameDay, isAfter, isBefore, startOfToday} from 'date-fns'
import { es } from 'date-fns/locale'
import { ArrowLeft, CalendarDays, Info, Scissors, Scroll} from 'lucide-react'
import { getLocalById } from '../services/locales.js'
import { useCitas } from '../hooks/useCitas.js'
import { fechasDisponiblesLocal, fechaEnUso } from '../utils/fechasLocal.js'
import './ReservarConLugar.css'
import './ReservarSinLugar.css'
import { useState, useEffect, useRef } from 'react'
import SelectorFecha from '../components/SelectorFecha/SelectorFecha.jsx'
import SelectorHorario from '../components/SelectorHorario/SelectorHorario.jsx'
import ServicioItem from '../components/ServicioItem/ServicioItem.jsx'
import SelectPro from '../components/SelectPro/SelectPro.jsx'
import Stepper from '../components/Stepper/Stepper.jsx'

// Cuanto hay que bajar (en px) para que aparezca el stepper.
// Ajusta este numero si el header cambia de alto.
const STEPPER_APARECE_SCROLL = 140

function ReservarSinLugar() {
  const { id } = useParams()
  const local = getLocalById(id)
  const navigate = useNavigate()
  const { agregarCita } = useCitas()
  const [hoy, setHoy] = useState(() => startOfToday())
  const [fechaSeleccionada, setFechaSeleccionada] = useState(hoy)
  const [horarioSeleccionado, setHorarioSeleccionado] = useState(null)
  // Aquí vivirá la selección de servicios (ids), no en DetalleLocal
  const [serviciosSeleccionados, setServiciosSeleccionados] = useState([])
  const [profesionalSeleccionado, setProfesionalSeleccionado] = useState(null)
  const [stepperVisible, setStepperVisible] = useState(false)
  const refServicios = useRef(null)
  const refProfesional = useRef(null)
  const refHorario = useRef(null)
  useEffect(() => {
    const actualizarHoy = () => setHoy(startOfToday())
    const onVisible = () => {
      if (document.visibilityState === 'visible') {
        actualizarHoy()
      }
    }
    document.addEventListener('visibilitychange', onVisible)
    return () => document.removeEventListener('visibilitychange', onVisible)
  }, [])

  useEffect(() => {
    function manejarScroll() {
      setStepperVisible(window.scrollY > STEPPER_APARECE_SCROLL)
    }
    manejarScroll() // por si la pagina carga ya con scroll
    window.addEventListener('scroll', manejarScroll, { passive: true })
    return () => window.removeEventListener('scroll', manejarScroll)
  }, [])

  if (!local) {
    return (
      <section className="reservar-local reservar-local--error">
        <Link to="/" className="reservar-local-volver">
          <ArrowLeft size={20} />
          Volver a Descubre
        </Link>
        <h1 className="reservar-local-titulo">Error 404</h1>
        <p className="reservar-local-texto">
          No existe un local con el id: <strong>{id}</strong>.
        </p>
      </section>
    )
  }
  
  const serviciosDisponibles = local.servicios ?? []
  const serviciosElegidos = serviciosDisponibles.filter((s) =>
    serviciosSeleccionados.includes(s.id)
  )
  const precioTotal = serviciosElegidos.reduce((sum, s) => sum + (s.precio || 0), 0)
  const profesionales = local.profesionales ?? []
  function duracionAMinutos(duracion) {
    if (!duracion) return 0
    const texto = String(duracion).trim().toLowerCase()
    const matchHoras = texto.match(/(\d+)\s*h/)
    const matchMinutos = texto.match(/(\d+)\s*min/)
    const horas = matchHoras ? Number(matchHoras[1]) : 0
    const minutos = matchMinutos ? Number(matchMinutos[1]) : 0
    return horas * 60 + minutos
  }

  function formatearDemora(minutosTotales) {
    if (!minutosTotales) return '—'
    const horas = Math.floor(minutosTotales / 60)
    const minutos = minutosTotales % 60
    if (horas > 0 && minutos > 0) return `~ ${horas}h ${minutos} min`
    if (horas > 0) return `~ ${horas}h`
    return `~ ${minutos} min`
  }
  const demoraTotalMinutos = serviciosElegidos.reduce(
    (sum, s) => sum + duracionAMinutos(s.duracion),
    0
  )
  const diasAMostrar = 14
  const fechasDisponibles = fechasDisponiblesLocal(hoy, local.dias, diasAMostrar)
  const fechaReserva = fechaEnUso(fechaSeleccionada, fechasDisponibles)
  
  function generarHorarios(apertura, cierre, intervaloMinutos) {
    const slots = []
    let actual = parse(apertura, 'HH:mm', new Date())
    const fin = parse(cierre, 'HH:mm', new Date())
    while (isBefore(actual, fin)) {
      slots.push(format(actual, 'HH:mm'))
      actual = addMinutes(actual, intervaloMinutos)
    }
    return slots
  }
  
  const horarios = generarHorarios(
    local.horarioApertura,
    local.horarioCierre,
    local.intervaloMinutos
  )
  let horariosDisponibles = horarios
  if (isSameDay(fechaReserva, hoy)) {
    const ahora = new Date()
    horariosDisponibles = horarios.filter((h) =>
      isAfter(parse(h, 'HH:mm', fechaReserva), ahora)
    )
  }

  function formatearFechaReserva(fecha, horario) {
    const fechaTexto = format(fecha, "EEE d '/' MMM", { locale: es })
    if (!horario) {
      return fechaTexto
    }
    const hora = format(parse(horario, 'HH:mm', fecha), 'H:mm', { locale: es })
    return `${fechaTexto} a las ${hora}`
  }

  function formatearFechaReservaMin(fecha, horario) {
    const fechaTexto = format(fecha, "EEE'-'dd", { locale: es }).charAt(0).toUpperCase() + format(fecha, "EEE'-'dd", { locale: es }).slice(1)
    if (!horario) {
      return fechaTexto
    }
    const hora = format(parse(horario, 'HH:mm', fecha), 'H:mm', { locale: es })
    return `${fechaTexto} - ${hora}`
  }

  function formatearPrecio(precio) {
    if (precio === 0) return 'GRATIS'
    return `${precio} CUP`
  }

  function handleConfirmarReserva(e) {
    e.preventDefault()
    if (
      serviciosElegidos.length === 0 ||
      !profesionalSeleccionado ||
      !horarioSeleccionado
    ) {
      return
    }

    const profesional = profesionales.find((p) => p.id === profesionalSeleccionado)

    agregarCita({
      id: crypto.randomUUID(),
      tipo: 'sin-lugar',
      localId: id,
      localNombre: local.localName,
      fecha: format(fechaReserva, 'yyyy-MM-dd'),
      horario: horarioSeleccionado,
      servicios: serviciosElegidos.map((s) => ({
        id: s.id,
        nombre: s.nombre,
        precio: s.precio ?? 0,
        duracion: s.duracion ?? null,
      })),
      profesional: profesional
        ? { id: profesional.id, name: profesional.name }
        : { id: profesionalSeleccionado, name: null },
      precioTotal,
      demoraMinutos: demoraTotalMinutos,
      creadaEn: new Date().toISOString(),
    })

    setServiciosSeleccionados([])
    setProfesionalSeleccionado(null)
    setHorarioSeleccionado(null)
    setFechaSeleccionada(fechasDisponibles[0] ?? hoy)
    navigate(`/local/${id}`)
  }
  function toggleServicio(idServicio){
    setServiciosSeleccionados((prev) => {
      if(prev.includes(idServicio)){
        return prev.filter((id) => id !== idServicio)
      }
      return [...prev, idServicio]
    })
  }

  function handleSeleccionProfesional(idProfesional){
    setProfesionalSeleccionado((prev)=> prev === idProfesional ? null : idProfesional)
  }

  const seccionRefPorPaso = {
    servicios: refServicios,
    profesional: refProfesional,
    horario: refHorario,
  }
  function handlePasoClick(idPaso) {
    const ref = seccionRefPorPaso[idPaso]
    ref?.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }
  function datosReserva() {
    if (serviciosElegidos.length === 0) {
      return {
        mensaje: 'Escoja un servicio entre los disponibles para hacerse en nuestro lugar',
        pasoActivo: 0,
      }
    }
    if (profesionalSeleccionado === null) {
      return {
        mensaje: 'Escoja el profesional que le hará su servicio',
        pasoActivo: 1,
      }
    }
    if (horarioSeleccionado === null) {
      return {
        mensaje: 'Escoja la hora para reservar su cita',
        pasoActivo: 2,
      }
    }
    return {
      mensaje: 'Todo correcto, puede confirmar su reserva',
      pasoActivo: 3,
    }
  }
  const PASOS = [
  { id: 'servicios', label: 'Servicios' },
  { id: 'profesional', label: 'Profesional' },
  { id: 'horario', label: 'Fecha' },
]
  function pasoCompleto(id) {
  switch (id) {
    case 'servicios':
      return serviciosSeleccionados.length > 0
    case 'profesional':
      return profesionalSeleccionado != null
    case 'horario':
      return horarioSeleccionado != null  // fecha casi siempre tiene valor
    case 'confirmar':
      return (
        serviciosSeleccionados.length > 0 &&
        profesionalSeleccionado != null &&
        horarioSeleccionado != null
      )
    default:
      return false
  }
  
}
  const pasos = PASOS.map((paso) => ({
    ...paso,
    completo: pasoCompleto(paso.id),
  }))
  const { mensaje, pasoActivo } = datosReserva()

  const partesResumen = []
  const cantidadServicios = serviciosSeleccionados.length
  if (cantidadServicios > 0) {
    partesResumen.push(`${cantidadServicios} servicio${cantidadServicios > 1 ? 's' : ''}`)
  }
  const nombrePro = profesionales.find((p) => p.id === profesionalSeleccionado)?.name?.split(' ')[0]?.trim()
  if (nombrePro) {
    partesResumen.push(nombrePro)
  }
  if (horarioSeleccionado) {
    partesResumen.push(formatearFechaReservaMin(fechaReserva, horarioSeleccionado))
  }
  if (cantidadServicios > 0) {
    partesResumen.push(formatearPrecio(precioTotal))
  }

  return (
    <section className="reservar-local reservar-sin-lugar">
      <header className="reservar-local-header">
        <Link to={`/local/${id}`} className="reservar-local-volver">
          <ArrowLeft size={20} />
          {local.localName}
        </Link>
        <h1 className="reservar-local-titulo">Reservar cita</h1>
        <p className="reservar-local-subtitulo">
          Elige servicios, fecha y hora para confirmar tu cita en {local.localName}.
        </p>
      </header>

      <Stepper
        texto={partesResumen}
        mensaje={mensaje}
        pasos={pasos}
        pasoActual={pasoActivo}
        visible={stepperVisible}
        onPasoClick={handlePasoClick}
      />

      <div className="reservar-local-body">
        <section ref={refServicios} className="reservar-local-bloque">
          <h2 className="reservar-local-bloque-titulo">
            <Scissors size={20} className="reservar-local-bloque-icono" />
            Servicios
          </h2>
          <ul className="reservar-sin-lugar-servicios">
          {serviciosDisponibles.map((servicio) => (
            <ServicioItem
              key={servicio.id}
              {...servicio}
              seleccionado={serviciosSeleccionados.includes(servicio.id)}
              onSeleccionar={() => toggleServicio(servicio.id)}
            />
          ))}
          </ul>
        </section>
        <section ref={refProfesional} className="reservar-local-bloque">
          <h2 className="reservar-local-bloque-titulo">
            < Scroll size={20} className="reservar-local-bloque-icono" />
            Elija un Profesional 
          </h2>
          <p className="reservar-local-texto-profesionales">Escoja un profesional entre los disponibles para que le atienda</p>
          <div className='reservar-local-profesionales-container'>
            {profesionales.map((profesional) => (
              <SelectPro
                key={profesional.id}
                name={profesional.name}
                url={profesional.url}
                points={profesional.points}
                seleccionado={profesional.id === profesionalSeleccionado}
                onClick={(e) => {
                  handleSeleccionProfesional(profesional.id)
                  e.currentTarget.scrollIntoView({  behavior: 'smooth', inline: 'center', block: 'nearest'})
                }}
              />
            ))}
          </div>
        </section>
        <section ref={refHorario} className="reservar-local-bloque horario">
          <h2 className="reservar-local-bloque-titulo fecha">
            <CalendarDays size={20} className="reservar-local-bloque-icono" color='var(--yellow-color)'/>
            Fecha
          </h2>
          <p className="reservar-local-texto">Escoja un dia disponible</p>
          <div className="reservar-local-fecha-container">
            <SelectorFecha
              fechas={fechasDisponibles}
              fechaSeleccionada={fechaReserva}
              onSeleccionar={setFechaSeleccionada}
            />
          </div>
          <div className="reservar-local-horarios-container">
            <p className="reservar-local-texto">
              Seleccione la hora que desea reservar
            </p>
            <div className="reservar-local-horarios-container-divs">
              <SelectorHorario
                horarios={horariosDisponibles}
                horarioSeleccionado={horarioSeleccionado}
                onSeleccionar={setHorarioSeleccionado}
              />
            </div>
          </div>
        </section>

        <div className="reservar-local-info-container">
          <h2 className="reservar-local-bloque-titulo">
            <Info size={20} className="reservar-local-bloque-icono" />
            Detalles de la reserva
          </h2>
          <div className="reservar-local-info-container-divs">
            <div className="reservar-local-info-container-div">
              <p className="reservar-local-texto-nombre">Servicios: </p>
              <p className="reservar-local-texto-valor-fecha">
                {serviciosElegidos.length > 0
                  ? `${serviciosElegidos.length} seleccionado${serviciosElegidos.length > 1 ? 's' : ''}`
                  : '—'}
              </p>
            </div>
            <div className="reservar-local-info-container-div">
              <p className="reservar-local-texto-nombre">Profesional: </p>
              <p className="reservar-local-texto-valor-fecha">
                {profesionales.find((p) => p.id === profesionalSeleccionado)?.name ?? '—'}
              </p>
            </div>
            <div className="reservar-local-info-container-div">
              <p className="reservar-local-texto-nombre">Fecha: </p>
              <p className="reservar-local-texto-valor-fecha">
                {formatearFechaReserva(fechaReserva, horarioSeleccionado)}
              </p>
            </div>
             <div className="reservar-local-info-container-div">
              <p className="reservar-local-texto-nombre">Demora: </p>
              <p className="reservar-local-texto-valor-fecha">
                {formatearDemora(demoraTotalMinutos)}
              </p>
            </div>
            <div className="reservar-local-info-container-div">
              <p className="reservar-local-texto-nombre">Coste: </p>
              <p className="reservar-local-texto-valor-coste">
                {formatearPrecio(precioTotal)}
              </p>
            </div>
            
          </div>  
        </div>
        <button
            type="button"
            className="reservar-local-boton"
            disabled={
              serviciosSeleccionados.length === 0 ||
              !horarioSeleccionado ||
              !profesionalSeleccionado
            }
            onClick={handleConfirmarReserva}
          >
            Confirmar cita
          </button>
      </div>
      
    </section>
  )
}

export default ReservarSinLugar
