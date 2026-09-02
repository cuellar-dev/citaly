import { Link, useParams,useNavigate } from 'react-router-dom'
import { parse, addMinutes, format, isSameDay, isAfter, isBefore, startOfToday } from 'date-fns'
import { es } from 'date-fns/locale'
import { ArrowLeft, CalendarDays, Info, User } from 'lucide-react'
import { getLocalById } from '../services/locales.js'
import { useCitas } from '../hooks/useCitas.js'
import { fechasDisponiblesLocal, fechaEnUso } from '../utils/fechasLocal.js'
import './ReservarConLugar.css'
import { useState, useEffect, useRef } from 'react'
import SelectorFecha from '../components/SelectorFecha/SelectorFecha.jsx'
import SelectorHorario from '../components/SelectorHorario/SelectorHorario.jsx'
import MapaMesas from '../components/MapaMesas/MapaMesas.jsx'
import Stepper from '../components/Stepper/Stepper.jsx'
import TalyMomento from '../components/Taly/TalyMomento.jsx'

const PANEL_MESA_MS = 4000

// Cuanto hay que bajar (en px) para que aparezca el stepper.
// Ajusta este numero si el header cambia de alto.
const STEPPER_APARECE_SCROLL = 100

function ReservarConLugar() {
  const { id } = useParams()
  const local = getLocalById(id)
  const [hoy, setHoy] = useState (()=> startOfToday())
  const [fechaSeleccionada, setFechaSeleccionada] = useState (hoy)
  const [horarioSeleccionado, setHorarioSeleccionado] = useState(null)
  const [mesaActiva, setMesaActiva] = useState(null)
  const [mesaSeleccionada, setMesaSeleccionada] = useState(null)
  const [panelMesaVisible, setPanelMesaVisible] = useState(false)
  const [stepperVisible, setStepperVisible] = useState(false)
  const [reservaConfirmada, setReservaConfirmada] = useState(false)
  const { agregarCita } = useCitas()
  const panelMesaRef = useRef(null)
  const refMesa = useRef(null)
  const refHorario = useRef(null)
  const navigate = useNavigate()
  function ocultarPanelMesa() {
    setPanelMesaVisible(false)
  }

  useEffect(()=> {
    const actualizarHoy = () => setHoy(startOfToday())
    const onVisible = () => {
      if(document.visibilityState === 'visible') {
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

  useEffect(() => {
    if (!mesaActiva || !panelMesaVisible) return

    const timerAuto = setTimeout(ocultarPanelMesa, PANEL_MESA_MS)

    const cerrarAlClick = (e) => {
      if (panelMesaRef.current?.contains(e.target)) return
      ocultarPanelMesa()
    }

    const timerClick = setTimeout(() => {
      document.addEventListener('click', cerrarAlClick)
    }, 0)

    return () => {
      clearTimeout(timerAuto)
      clearTimeout(timerClick)
      document.removeEventListener('click', cerrarAlClick)
    }
  }, [mesaActiva, panelMesaVisible])

  function handlePanelMesaTransitionEnd(e) {
    if (e.propertyName !== 'opacity' || panelMesaVisible) return
    setMesaActiva(null)
  }
  
  if (!local) {
    return (
      <section className="reservar-local reservar-local--error">
        <Link to="/" className="reservar-local-volver">
          <ArrowLeft size={20} />
          Volver a Descubre
        </Link>
        <TalyMomento
          escena='loader'
          pose='busca'
          titulo='No encontramos ese local'
          texto={`No existe un local con el id “${id}”. Revisa el enlace e inténtalo de nuevo.`}
          accion='Volver a Descubre'
          onAccion={() => navigate('/')}
        />
      </section>
    )
  }

  if (reservaConfirmada) {
    return (
      <section className='reservar-local reservar-local--exito'>
        <TalyMomento
          escena='confirmacion'
          titulo='¡Reserva confirmada!'
          texto={`Tu mesa en ${local.localName} ya está guardada. Taly la tendrá lista en Mis citas.`}
          accion='Ver mis citas'
          onAccion={() => navigate('/citas')}
          accionSecundaria='Seguir explorando'
          onAccionSecundaria={() => navigate(`/local/${id}`)}
        />
      </section>
    )
  }
  
  const text = `Elige fecha, hora y puesto para confirmar la cita en ${local.localName}.`
  
  const fechasDisponibles = fechasDisponiblesLocal(hoy, local.dias)
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
  const hora = format(
    parse(horario, 'HH:mm', fecha),
    'H:mm',
    { locale: es }
  )
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

function handleMesaClick(mesa) {
  if (mesa.estado === 'ocupado') return
  setMesaActiva(mesa)
  setPanelMesaVisible(true)
  setMesaSeleccionada(mesa)
}
function establecerPrecio(){
  let precio = mesaSeleccionada.precio
  if (precio === 0 ) precio = 'GRATIS'
  return `${precio}`
}
function handleConfirmarReserva(e) {
  e.preventDefault()
  if (!mesaSeleccionada || !horarioSeleccionado) return

  agregarCita({
    id: crypto.randomUUID(),
    tipo: 'con-lugar',
    localId: id,
    localNombre: local.localName,
    fecha: format(fechaReserva, 'yyyy-MM-dd'),
    horario: horarioSeleccionado,
    mesa: {
      id: mesaSeleccionada.id,
      codigo: mesaSeleccionada.codigo,
      capacidad: mesaSeleccionada.capacidad,
      ubicacion: mesaSeleccionada.ubicacion,
    },
    precioReserva: mesaSeleccionada.precio ?? 0,
    consumoMinimo: mesaSeleccionada.consumoMinimo ?? null,
    creadaEn: new Date().toISOString(),
  })

  setMesaActiva(null)
  setMesaSeleccionada(null)
  setPanelMesaVisible(false)
  setHorarioSeleccionado(null)
  setFechaSeleccionada(fechasDisponibles[0] ?? hoy)
  setReservaConfirmada(true)
}

function datosReserva() {
  if (!mesaSeleccionada) {
    return {
      mensaje: 'Seleccione una mesa en el mapa para continuar',
      pasoActivo: 0,
    }
  }
  if (!horarioSeleccionado) {
    return {
      mensaje: 'Escoja la hora para reservar su cita',
      pasoActivo: 1,
    }
  }
  return {
    mensaje: 'Todo correcto, puede confirmar su reserva',
    pasoActivo: 2,
  }
}
const PASOS = [
  { id: 'mesa', label: 'Mesa' },
  { id: 'horario', label: 'Fecha' },
]
function pasoCompleto(id) {
  switch (id) {
    case 'mesa':
      return mesaSeleccionada != null
    case 'horario':
      return horarioSeleccionado != null
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
if (mesaSeleccionada?.codigo) {
  partesResumen.push(mesaSeleccionada.codigo)
}
if (horarioSeleccionado) {
  partesResumen.push(formatearFechaReservaMin(fechaReserva, horarioSeleccionado))
}
if (mesaSeleccionada) {
  partesResumen.push(formatearPrecio(mesaSeleccionada.precio ?? 0))
}

const seccionRefPorPaso = {
  mesa: refMesa,
  horario: refHorario,
}
function handlePasoClick(idPaso) {
  const ref = seccionRefPorPaso[idPaso]
  ref?.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}
  return (
    <section className="reservar-local">
      <header className="reservar-local-header">
        <Link to={`/local/${id}`} className="reservar-local-volver">
          <ArrowLeft size={20} />
          {local.localName}
        </Link>
        <h1 className="reservar-local-titulo">Reservar</h1>
        <p className="reservar-local-subtitulo">
          {text}
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

      <div ref={refMesa} className='reservar-local-mapa-div-container'>
        <div className='reservar-local-mapa-texto'>
          <h2 className='reservar-local-bloque-titulo'>Reserve una mesa</h2>
          <div className='reservar-local-mapa-texto-explicacion'>
            <p className='reservar-local-texto'>Seleccione el lugar que mas le guste para reservar, basandose en la leyenda. </p>
          </div>
          <div className='mapa-mesas-container'>
            <div className='mapa-mesas-viewport'>
              <MapaMesas
                mesaSeleccionada={mesaSeleccionada}
                onMesaClick={handleMesaClick}
              />
            </div>
            {mesaActiva && (
              <div
                ref={panelMesaRef}
                className={`mesa-info-panel mesa-info-panel--${mesaActiva.estado}${panelMesaVisible ? '' : ' mesa-info-panel--ocultando'}`}
                onTransitionEnd={handlePanelMesaTransitionEnd}
                style={{top: `${mesaActiva.posicion.y+ 30}px`, left: `${mesaActiva.posicion.x}px`}}
              >
                <p className="mesa-info-panel-codigo">{mesaActiva.codigo}</p>
                  <div className='mesa-info-panel-datos-div'>
                    <p className="mesa-info-panel-dato">
                    {mesaActiva.ubicacion}
                    </p>
                    <div className='mesa-info-panel-dato-separador'></div>
                    <p className="mesa-info-panel-dato">
                    {mesaActiva.capacidad} asientos
                    </p>
                </div>
              </div>
            )}
          </div>
          <div className='mapa-mesas-leyenda-container'>
            <div className='mapa-mesas-leyenda'>
              <div className='mapa-mesas-leyenda-swatch mapa-mesas-leyenda-swatch--disponible' />
              <p className='mapa-mesas-leyenda-texto'>Disponible</p>
            </div>
            <div className='mapa-mesas-leyenda'>
              <div className='mapa-mesas-leyenda-swatch mapa-mesas-leyenda-swatch--ocupado' />
              <p className='mapa-mesas-leyenda-texto'>Ocupado</p>
            </div>
            <div className='mapa-mesas-leyenda'>
              <div className='mapa-mesas-leyenda-swatch mapa-mesas-leyenda-swatch--seleccionado' />
              <p className='mapa-mesas-leyenda-texto'>Marcado por usted</p>
            </div>
            </div>
        </div>
      </div>
      <div className="reservar-local-body">
        <section ref={refHorario} className="reservar-local-bloque horario">
          <h2 className="reservar-local-bloque-titulo">
            <CalendarDays size={20} className="reservar-local-bloque-icono" />
            Fecha
          </h2>
          <p className="reservar-local-texto">
            Escoja un dia disponible
          </p>
          <div className='reservar-local-fecha-container'>
            <SelectorFecha
              fechas={fechasDisponibles}
              fechaSeleccionada={fechaReserva}
              onSeleccionar={setFechaSeleccionada}
            />
          </div>
          <div className='reservar-local-horarios-container'>
            <p className="reservar-local-texto">
            Seleccione la hora que desea reservar
            </p>
            <div className='reservar-local-horarios-container-divs'>
              <SelectorHorario
              horarios={horariosDisponibles}
              horarioSeleccionado={horarioSeleccionado}
              onSeleccionar={setHorarioSeleccionado}
              />
            </div>
          </div>

        </section>
        <div className='reservar-local-info-container'>
          <h2 className='reservar-local-bloque-titulo'><Info size={20} className='reservar-local-bloque-icono' />Detalles de la reserva</h2>
          <div className='reservar-local-info-container-div-principal'>
            {mesaSeleccionada ? (
              <>
                <div className='reservar-local-info-container-div-principal-div'>
                  <p className='reservar-local-nombre-mesa'>
                    {mesaSeleccionada.codigo}
                  </p>
                  <p className='reservar-local-ubicacion-mesa'>
                    {mesaSeleccionada.ubicacion}
                  </p>
                </div>
                <p className='reservar-local-personas-mesa'>
                  <User size={20} color='currentColor' />
                  {mesaSeleccionada.capacidad}
                </p>
              </>
            ) : (
              <p className='reservar-local-texto reservar-local-texto--placeholder'>
                Seleccione una mesa en el mapa
              </p>
            )}
          </div>
          <div className='reservar-local-info-container-divs'>
            <div className='reservar-local-info-container-div'>
              <p className='reservar-local-texto-nombre'>Fecha: </p>
              <p className='reservar-local-texto-valor-fecha'>
                {formatearFechaReserva(fechaReserva, horarioSeleccionado)}
              </p>
            </div>
            <div className='reservar-local-info-container-div'>
              <p className='reservar-local-texto-nombre'>Coste: </p>
              <p className='reservar-local-texto-valor-coste'>{mesaSeleccionada ? establecerPrecio() : '-' } <span className='reservar-local-texto-valor-coste-span'>{mesaSeleccionada && mesaSeleccionada.precio === 0 ? `(${mesaSeleccionada.consumoMinimo} CUP a consumir)` : ''}</span></p>
            </div>
          </div>
          <button className='reservar-local-boton' disabled={!mesaSeleccionada || !horarioSeleccionado} onClick={handleConfirmarReserva}>Confirmar reserva</button>
        </div>
      </div>
      
    </section>
  )
}

export default ReservarConLugar
