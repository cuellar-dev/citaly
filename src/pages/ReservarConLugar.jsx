import { useEffect, useRef, useState } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import { format, parse } from 'date-fns'
import { es } from 'date-fns/locale'
import { CalendarDays, LayoutGrid, Users, UsersRound } from 'lucide-react'
import IconoWhatsApp from '../components/IconoWhatsApp/IconoWhatsApp.jsx'
import { getLocalById } from '../services/locales.js'
import { MESAS_MAPA } from '../data/mesasMapa.js'
import { useCitas } from '../hooks/useCitas.js'
import { useReserva } from '../hooks/useReserva.js'
import ReservaShell, {
  BarraConfirmar,
  BloqueReserva,
  ResumenReserva,
  VacioReserva,
} from '../components/Reserva/ReservaShell.jsx'
import PasoFechaHora from '../components/Reserva/PasoFechaHora.jsx'
import MapaMesas from '../components/MapaMesas/MapaMesas.jsx'
import TalyMomento from '../components/Taly/TalyMomento.jsx'
import '../components/Reserva/reserva.css'

const PANEL_MESA_MS = 4000
/* La mesa más grande del plano. A partir de ahí hay que juntar mesas, y eso se
   acuerda con el local, no se reserva desde aquí. */
const MAX_PERSONAS = Math.max(...MESAS_MAPA.map((mesa) => mesa.capacidad))
const GRUPO = 'grupo'

function formatearPrecio(precio) {
  return precio === 0 ? 'GRATIS' : `${precio} CUP`
}

function ReservarConLugar() {
  const { id } = useParams()
  const local = getLocalById(id)
  const navigate = useNavigate()
  const { citas, agregarCita } = useCitas()

  /* Todos los hooks antes de cualquier return: useReserva aguanta local nulo. */
  const reserva = useReserva(local, citas)
  const [personas, setPersonas] = useState(null)
  const [mesaSeleccionada, setMesaSeleccionada] = useState(null)
  const [mesaActiva, setMesaActiva] = useState(null)
  const [panelVisible, setPanelVisible] = useState(false)
  /* null | 'mesa' | 'grupo': guarda QUÉ se reservó, porque al confirmar se
     limpian personas y mesa y la pantalla de éxito ya no podría saberlo. */
  const [confirmada, setConfirmada] = useState(null)
  const panelRef = useRef(null)
  const refPersonas = useRef(null)
  const refMesa = useRef(null)
  const refFecha = useRef(null)

  useEffect(() => {
    if (!mesaActiva || !panelVisible) return undefined

    const ocultar = () => setPanelVisible(false)
    const timerAuto = setTimeout(ocultar, PANEL_MESA_MS)
    const cerrarAlClick = (e) => {
      if (panelRef.current?.contains(e.target)) return
      ocultar()
    }
    const timerClick = setTimeout(() => document.addEventListener('click', cerrarAlClick), 0)

    return () => {
      clearTimeout(timerAuto)
      clearTimeout(timerClick)
      document.removeEventListener('click', cerrarAlClick)
    }
  }, [mesaActiva, panelVisible])

  if (local && !local.lugar) {
    return <Navigate to={`/local/${id}/reservar-cita`} replace />
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
          titulo={confirmada === 'grupo' ? '¡Grupo reservado!' : '¡Mesa reservada!'}
          texto={
            confirmada === 'grupo'
              ? `Tu hora en ${local.localName} ya está guardada. Las mesas las juntan ellos al llegar.`
              : `Tu mesa en ${local.localName} ya está guardada. Taly la tendrá lista en Mis citas.`
          }
          accion="Ver mis citas"
          onAccion={() => navigate('/citas')}
          accionSecundaria="Seguir explorando"
          onAccionSecundaria={() => navigate(`/local/${id}`)}
        />
      </section>
    )
  }

  const esGrupo = personas === GRUPO

  function elegirPersonas(cantidad) {
    setPersonas(cantidad)
    /* Un grupo grande no va a una mesa suelta; y si la mesa marcada ya no da
       para tanta gente, también se suelta. */
    setMesaSeleccionada((prev) =>
      cantidad !== GRUPO && prev && prev.capacidad >= cantidad ? prev : null,
    )
    setMesaActiva(null)
    setPanelVisible(false)
  }

  function alPulsarMesa(mesa) {
    if (!personas || esGrupo) return
    if (mesa.estado === 'ocupado' || mesa.estado === 'no-cabe') return
    if (mesa.capacidad < personas) return
    setMesaActiva(mesa)
    setPanelVisible(true)
    setMesaSeleccionada(mesa)
  }

  // ---- pasos -------------------------------------------------------------

  const hechos = {
    personas: personas != null,
    /* Con grupo grande no hay mesa que marcar, pero el paso cuenta como
       resuelto: la reserva se hace igual y las mesas las juntan en el local. */
    mesa: esGrupo || mesaSeleccionada != null,
    fecha: reserva.horario != null,
  }
  const pasos = [
    { id: 'personas', label: 'Personas', completo: hechos.personas },
    { id: 'mesa', label: 'Mesa', completo: hechos.mesa },
    { id: 'fecha', label: 'Día y hora', completo: hechos.fecha },
  ]
  const pasoActivo = pasos.findIndex((p) => !p.completo)
  const todoListo = pasoActivo === -1

  const mensaje = !hechos.personas
    ? 'Dinos cuántos van y te enseñamos las mesas que caben'
    : !hechos.mesa
      ? 'Toca en el plano la mesa que más te guste'
      : !hechos.fecha
        ? 'Escoge el día y la hora'
        : 'Todo listo, ya puedes confirmar'

  const falta = !hechos.personas
    ? 'Falta decir cuántos van'
    : !hechos.mesa
      ? 'Falta elegir la mesa'
      : !hechos.fecha
        ? 'Falta elegir la hora'
        : null

  const resumenGuia = []
  if (esGrupo) resumenGuia.push(`Más de ${MAX_PERSONAS}`)
  else if (personas) resumenGuia.push(`${personas} ${personas === 1 ? 'persona' : 'personas'}`)
  if (mesaSeleccionada?.codigo) resumenGuia.push(mesaSeleccionada.codigo)
  if (reserva.horario && reserva.fecha) {
    resumenGuia.push(`${format(reserva.fecha, 'EEE d', { locale: es })} · ${reserva.horario}`)
  }

  const anclas = { personas: refPersonas, mesa: refMesa, fecha: refFecha }
  const irAPaso = (idPaso) =>
    anclas[idPaso]?.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })

  function confirmar() {
    if (!todoListo) return
    agregarCita({
      id: crypto.randomUUID(),
      esLugar: true,
      localId: id,
      localNombre: local.localName,
      fecha: format(reserva.fecha, 'yyyy-MM-dd'),
      horario: reserva.horario,
      /* Grupo grande: la reserva se guarda igual, sin mesa concreta. El local
         junta mesas al llegar, y la cita queda marcada para que se vea. */
      grupoGrande: esGrupo,
      minimoPersonas: esGrupo ? MAX_PERSONAS : null,
      mesa: esGrupo
        ? null
        : {
            id: mesaSeleccionada.id,
            codigo: mesaSeleccionada.codigo,
            capacidad: mesaSeleccionada.capacidad,
            ubicacion: mesaSeleccionada.ubicacion,
          },
      precioReserva: esGrupo ? 0 : (mesaSeleccionada.precio ?? 0),
      consumoMinimo: esGrupo ? null : (mesaSeleccionada.consumoMinimo ?? null),
      personas: esGrupo ? null : personas,
      estadoReserva: 0,
      creadaEn: new Date().toISOString(),
    })
    setPersonas(null)
    setMesaSeleccionada(null)
    setMesaActiva(null)
    setPanelVisible(false)
    reserva.reiniciarFechaYHora()
    setConfirmada(esGrupo ? 'grupo' : 'mesa')
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

  const precioMesa = mesaSeleccionada?.precio ?? 0
  const consumo =
    mesaSeleccionada && precioMesa === 0 && mesaSeleccionada.consumoMinimo
      ? `${mesaSeleccionada.consumoMinimo} CUP a consumir`
      : null

  return (
    <ReservaShell
      volverA={`/local/${id}`}
      volverTexto={local.localName}
      titulo="Reservar mesa"
      subtitulo={`Elige puesto, día y hora en ${local.localName}.`}
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
          etiqueta="Reserva"
          valor={esGrupo ? 'GRATIS' : mesaSeleccionada ? formatearPrecio(precioMesa) : '—'}
          nota={esGrupo ? 'Mesas a juntar' : consumo}
          texto={esGrupo ? 'Reservar para el grupo' : 'Confirmar mesa'}
          falta={falta}
          onConfirmar={confirmar}
        />
      }
    >
      <BloqueReserva
        anclaRef={refPersonas}
        numero={1}
        icono={Users}
        titulo="¿Cuántos van?"
        descripcion="Te dejamos elegir solo entre las mesas con sitio para todos."
        hecho={hechos.personas}
        activo={pasoActivo === 0}
      >
        <div className="reserva-personas" role="group" aria-label="Cantidad de personas">
          {Array.from({ length: MAX_PERSONAS }, (_, i) => i + 1).map((n) => (
            <button
              key={n}
              type="button"
              className={`reserva-persona${personas === n ? ' reserva-persona--activa' : ''}`}
              aria-pressed={personas === n}
              onClick={() => elegirPersonas(n)}
            >
              {n}
            </button>
          ))}
          <button
            type="button"
            className={`reserva-persona reserva-persona--grupo${
              esGrupo ? ' reserva-persona--activa' : ''
            }`}
            aria-pressed={esGrupo}
            aria-label={`Más de ${MAX_PERSONAS} personas`}
            onClick={() => elegirPersonas(GRUPO)}
          >
            +{MAX_PERSONAS}
          </button>
        </div>
      </BloqueReserva>

      <BloqueReserva
        anclaRef={refMesa}
        numero={2}
        icono={LayoutGrid}
        titulo="La mesa"
        descripcion={
          esGrupo
            ? 'Un grupo así no cabe en una sola mesa.'
            : personas
              ? `Mesas para ${personas} ${personas === 1 ? 'persona' : 'personas'} o más.`
              : 'Dinos primero cuántos van y se encienden las mesas que caben.'
        }
        hecho={hechos.mesa}
        activo={pasoActivo === 1}
        vacio={
          esGrupo ? (
            <VacioReserva
              icono={UsersRound}
              titulo="Mesas a juntar en el local"
              texto={`La mesa más grande es de ${MAX_PERSONAS}. Puedes reservar igual: guardamos tu hora y en ${local.localName} juntan las mesas al llegar. Si quieres adelantarlo, escríbeles.`}
            >
              {local.whatsapp ? (
                <a
                  className="reserva-vacio-accion"
                  href={`https://wa.me/${String(local.whatsapp).replace(/\D/g, '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <IconoWhatsApp size={16} />
                  Escribirles por WhatsApp
                </a>
              ) : null}
            </VacioReserva>
          ) : null
        }
      >
        <div className={`mapa-mesas-container${personas ? '' : ' mapa-mesas-container--apagado'}`}>
          <div className="mapa-mesas-viewport">
            <MapaMesas
              mesaSeleccionada={mesaSeleccionada}
              onMesaClick={alPulsarMesa}
              capacidadMinima={personas ?? 0}
            />
          </div>
          {mesaActiva && (
            <div
              ref={panelRef}
              className={`mesa-info-panel mesa-info-panel--${mesaActiva.estado}${
                panelVisible ? '' : ' mesa-info-panel--ocultando'
              }`}
              onTransitionEnd={(e) => {
                if (e.propertyName === 'opacity' && !panelVisible) setMesaActiva(null)
              }}
              style={{ top: `${mesaActiva.posicion.y + 30}px`, left: `${mesaActiva.posicion.x}px` }}
            >
              <p className="mesa-info-panel-codigo">{mesaActiva.codigo}</p>
              <div className="mesa-info-panel-datos-div">
                <p className="mesa-info-panel-dato">{mesaActiva.ubicacion}</p>
                <div className="mesa-info-panel-dato-separador" />
                <p className="mesa-info-panel-dato">{mesaActiva.capacidad} asientos</p>
              </div>
            </div>
          )}
        </div>

        <div className="mapa-mesas-leyenda-container">
          <div className="mapa-mesas-leyenda">
            <div className="mapa-mesas-leyenda-swatch mapa-mesas-leyenda-swatch--disponible" />
            <p className="mapa-mesas-leyenda-texto">Libre</p>
          </div>
          <div className="mapa-mesas-leyenda">
            <div className="mapa-mesas-leyenda-swatch mapa-mesas-leyenda-swatch--ocupado" />
            <p className="mapa-mesas-leyenda-texto">Ocupada</p>
          </div>
          <div className="mapa-mesas-leyenda">
            <div className="mapa-mesas-leyenda-swatch mapa-mesas-leyenda-swatch--seleccionado" />
            <p className="mapa-mesas-leyenda-texto">La tuya</p>
          </div>
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
              etiqueta: 'Personas',
              valor: esGrupo
                ? `Más de ${MAX_PERSONAS}`
                : personas
                  ? `${personas} ${personas === 1 ? 'persona' : 'personas'}`
                  : null,
            },
            {
              etiqueta: 'Mesa',
              valor: esGrupo
                ? 'A cuadrar con el local'
                : mesaSeleccionada
                  ? `${mesaSeleccionada.codigo} · ${mesaSeleccionada.capacidad} asientos`
                  : null,
              nota: esGrupo ? 'Juntan mesas según disponibilidad' : mesaSeleccionada?.ubicacion,
            },
            { etiqueta: 'Cuándo', valor: fechaTexto },
            {
              etiqueta: 'Reserva',
              valor: mesaSeleccionada ? formatearPrecio(precioMesa) : '—',
              nota: consumo,
              fuerte: true,
            },
          ]}
        />
      </BloqueReserva>
    </ReservaShell>
  )
}

export default ReservarConLugar
