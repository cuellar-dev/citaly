import { useCallback, useMemo, useRef, useState } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import { format, parse } from 'date-fns'
import { es } from 'date-fns/locale'
import { CalendarDays, LayoutGrid, Users } from 'lucide-react'
import IconoWhatsApp from '../components/IconoWhatsApp/IconoWhatsApp.jsx'
import { getLocalById } from '../services/locales.js'
import { cobroDeMesa, reservaMesaDe } from '../utils/mesas.js'
import { useCitas } from '../hooks/useCitas.js'
import { useReserva } from '../hooks/useReserva.js'
import ReservaShell, {
  BarraConfirmar,
  BloqueReserva,
  ResumenReserva,
  VacioReserva,
} from '../components/Reserva/ReservaShell.jsx'
import PasoFechaHora from '../components/Reserva/PasoFechaHora.jsx'
import TalyMomento from '../components/Taly/TalyMomento.jsx'
import VisorPlano, { LeyendaPlano } from '../plano/VisorPlano.jsx'
import FichaMesa, { OpcionesJuntas } from '../plano/FichaMesa.jsx'
import { planoDeLocal } from '../plano/local.js'
import { mesasDe, zonaDe } from '../plano/modelo.js'
import { estadosMesas, maxPersonas, mesasOcupadas, opcionesParaGrupo } from '../plano/reserva.js'
import { reservasMesaDemo } from '../data/reservasMesaDemo.js'
import { generarHorarios } from '../utils/reservaHorarios.js'
import '../components/Reserva/reserva.css'

/* Reservar mesa. Orden: cuántos van → día y hora → la mesa.

   La hora va ANTES que la mesa: qué mesas (o qué mesas juntas) están libres
   depende de la hora. Así el plano enseña la disponibilidad de verdad, y en
   la agenda las horas sin sitio para el grupo salen como "completas".

   Para un grupo se ofrece, por este orden y solo el primer nivel que tenga
   algo (ver plano/reserva.js): mesa cómoda → mesa apretada → mesas juntas.
   El cliente no ve los rangos de cada mesa; solo ve qué puede coger. */

function formatearPrecio(precio) {
  return precio === 0 ? 'GRATIS' : `${precio} CUP`
}

const TOPE_BOTONES = 20

function ReservarConLugar() {
  const { id } = useParams()
  const local = getLocalById(id)
  const navigate = useNavigate()
  const { citas, agregarCita } = useCitas()

  const plano = useMemo(() => (local ? planoDeLocal(local) : null), [local])
  /* Reservas del local para saber qué mesas están cogidas a cada hora: hoy,
     las de demo más las del propio usuario. Con backend:
     GET /api/local/:id/mesas-ocupadas (ver docs/pendientes-backend.md). */
  const reservasLocal = useMemo(() => {
    if (!local?.lugar) return []
    const propias = citas.filter((c) => c.localId === id)
    return [...reservasMesaDemo(local), ...propias]
  }, [local, citas, id])

  const [personas, setPersonas] = useState(null)
  /* { tipo: 'mesa' | 'junta', id } */
  const [seleccion, setSeleccion] = useState(null)
  const [confirmada, setConfirmada] = useState(false)
  const refPersonas = useRef(null)
  const refMesa = useRef(null)
  const refFecha = useRef(null)

  /* Horas en las que no queda nada para este grupo: la agenda las apaga. */
  const completasDe = useCallback(
    (fecha) => {
      if (!personas || !plano) return []
      const dia = format(fecha, 'yyyy-MM-dd')
      const horas = generarHorarios(local.horarioApertura, local.horarioCierre, local.intervaloMinutos)
      return horas.filter((h) => !opcionesParaGrupo(plano, personas, mesasOcupadas(reservasLocal, dia, h)).nivel)
    },
    [personas, plano, reservasLocal, local],
  )

  /* Todos los hooks antes de cualquier return: useReserva aguanta local nulo. */
  const reserva = useReserva(local, citas, { completasDe })

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
          titulo="¡Mesa reservada!"
          texto={`Tu sitio en ${local.localName} ya está guardado. Taly lo tendrá listo en Mis citas.`}
          accion="Ver mis citas"
          onAccion={() => navigate('/citas')}
          accionSecundaria="Seguir explorando"
          onAccionSecundaria={() => navigate(`/local/${id}`)}
        />
      </section>
    )
  }

  const tope = maxPersonas(plano)
  const ajustes = reservaMesaDe(local)
  const configurado = Boolean(local.reservaMesa)
  const mesas = mesasDe(plano)
  const porId = new Map(mesas.map((m) => [m.id, m]))

  const dia = reserva.fecha ? format(reserva.fecha, 'yyyy-MM-dd') : null
  const ocupadas = dia && reserva.horario ? mesasOcupadas(reservasLocal, dia, reserva.horario) : new Set()
  const hayHora = Boolean(reserva.horario)
  const opciones = opcionesParaGrupo(plano, personas, ocupadas)
  const estados = estadosMesas(plano, opciones, ocupadas, Boolean(personas && hayHora))

  /* La selección solo vale si sigue entre las opciones de ahora (cambiar de
     hora o de grupo puede dejarla fuera). Derivado, sin efectos. */
  const juntaElegida =
    seleccion?.tipo === 'junta' ? opciones.juntas.find((j) => j.id === seleccion.id) ?? null : null
  const mesaElegida =
    seleccion?.tipo === 'mesa' && opciones.nivel !== 'juntas' && opciones.mesas.includes(seleccion.id)
      ? porId.get(seleccion.id)
      : null
  const elegidas = juntaElegida ? juntaElegida.mesas : mesaElegida ? [mesaElegida.id] : []
  const mesasElegidas = elegidas.map((x) => porId.get(x)).filter(Boolean)
  const hayMesa = elegidas.length > 0

  function elegirPersonas(n) {
    setPersonas(n)
    setSeleccion(null)
  }

  function tocarMesa(idMesa) {
    if (opciones.nivel === 'juntas') {
      /* Tocar una mesa elige unas juntas que la incluyan; si ya estaba en
         las elegidas y hay otra opción con ella, pasa a la siguiente. */
      const conEsta = opciones.juntas.filter((j) => j.mesas.includes(idMesa))
      if (!conEsta.length) return
      const actual = conEsta.findIndex((j) => j.id === juntaElegida?.id)
      setSeleccion({ tipo: 'junta', id: conEsta[(actual + 1) % conEsta.length].id })
      return
    }
    if (opciones.mesas.includes(idMesa)) setSeleccion({ tipo: 'mesa', id: idMesa })
  }

  // ---- pasos -------------------------------------------------------------

  const hechos = { personas: personas != null, fecha: hayHora, mesa: hayMesa }
  const pasos = [
    { id: 'personas', label: 'Personas', completo: hechos.personas },
    { id: 'fecha', label: 'Día y hora', completo: hechos.fecha },
    { id: 'mesa', label: 'Mesa', completo: hechos.mesa },
  ]
  const pasoActivo = pasos.findIndex((p) => !p.completo)
  const todoListo = pasoActivo === -1

  const mensaje = !hechos.personas
    ? 'Dinos cuántos van y te enseñamos lo que hay'
    : !hechos.fecha
      ? 'Escoge el día y la hora'
      : !hechos.mesa
        ? opciones.nivel === 'juntas'
          ? 'Elige qué mesas te juntan'
          : 'Toca en el plano la mesa que más te guste'
        : 'Todo listo, ya puedes confirmar'

  const falta = !hechos.personas
    ? 'Falta decir cuántos van'
    : !hechos.fecha
      ? 'Falta elegir la hora'
      : !hechos.mesa
        ? 'Falta elegir la mesa'
        : null

  const nombreElegida = mesasElegidas.map((m) => m.nombre).join(' + ')
  const zonaElegida = mesasElegidas[0] ? zonaDe(plano, mesasElegidas[0]) || mesasElegidas[0].nota : null

  const resumenGuia = []
  if (personas) resumenGuia.push(`${personas} ${personas === 1 ? 'persona' : 'personas'}`)
  if (reserva.horario && reserva.fecha) {
    resumenGuia.push(`${format(reserva.fecha, 'EEE d', { locale: es })} · ${reserva.horario}`)
  }
  if (hayMesa) resumenGuia.push(nombreElegida)

  const anclas = { personas: refPersonas, mesa: refMesa, fecha: refFecha }
  const irAPaso = (idPaso) => anclas[idPaso]?.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })

  /* Varias mesas juntas cuentan como UNA reserva: un solo cobro (hoy gratis). */
  const cobro = hayMesa ? cobroDeMesa(local, mesasElegidas[0]) : { precio: 0, consumoMinimo: 0 }
  const consumo = hayMesa && cobro.precio === 0 && cobro.consumoMinimo ? `${cobro.consumoMinimo} CUP a consumir` : null

  function confirmar() {
    if (!todoListo) return
    agregarCita({
      id: crypto.randomUUID(),
      esLugar: true,
      localId: id,
      localNombre: local.localName,
      fecha: format(reserva.fecha, 'yyyy-MM-dd'),
      horario: reserva.horario,
      mesa: {
        id: elegidas[0],
        /* Mesas juntas: todas las que ocupa. */
        ids: elegidas.length > 1 ? elegidas : undefined,
        codigo: nombreElegida,
        capacidad: juntaElegida ? juntaElegida.cap.normal : mesaElegida.cap.normal,
        ubicacion: zonaElegida,
      },
      precioReserva: cobro.precio,
      consumoMinimo: cobro.consumoMinimo || null,
      personas,
      estadoReserva: 0,
      creadaEn: new Date().toISOString(),
    })
    setPersonas(null)
    setSeleccion(null)
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

  const botones = Math.min(tope, TOPE_BOTONES)
  const sinNada = personas && hayHora && !opciones.nivel
  const whatsapp = local.whatsapp ? `https://wa.me/${String(local.whatsapp).replace(/\D/g, '')}` : null

  const leyenda = [
    { id: 'libre', texto: opciones.nivel === 'juntas' ? 'Libre' : 'Para ti' },
    ...(opciones.nivel === 'juntas' ? [{ id: 'opcion', texto: 'Se juntan' }] : []),
    { id: 'ocupada', texto: 'Ocupada' },
    { id: 'elegida', texto: 'La tuya' },
    ...(mesas.some((m) => !m.online) ? [{ id: 'local', texto: 'Solo en el local' }] : []),
  ]

  return (
    <ReservaShell
      volverA={`/local/${id}`}
      volverTexto={local.localName}
      titulo="Reservar mesa"
      subtitulo={`Elige cuántos van, la hora y tu mesa en ${local.localName}.`}
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
          valor={hayMesa ? formatearPrecio(cobro.precio) : '—'}
          nota={consumo}
          texto={juntaElegida ? 'Reservar las mesas' : 'Confirmar mesa'}
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
        descripcion={`De 1 a ${tope} personas. Te enseñamos solo lo que os sirve.`}
        hecho={hechos.personas}
        activo={pasoActivo === 0}
      >
        <div className="reserva-personas" role="group" aria-label="Cantidad de personas">
          {Array.from({ length: botones }, (_, i) => i + 1).map((n) => (
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
        </div>
        {whatsapp && (
          <p className="reserva-nota-grupo">
            ¿Sois más de {botones}?{' '}
            <a href={whatsapp} target="_blank" rel="noopener noreferrer">
              <IconoWhatsApp size={14} /> Escríbeles
            </a>
          </p>
        )}
      </BloqueReserva>

      <BloqueReserva
        anclaRef={refFecha}
        numero={2}
        icono={CalendarDays}
        titulo="Día y hora"
        descripcion={
          personas
            ? 'Las horas apagadas no tienen sitio para tu grupo.'
            : 'Solo te mostramos los días en que abren y con hueco libre.'
        }
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

      <BloqueReserva
        anclaRef={refMesa}
        numero={3}
        icono={LayoutGrid}
        titulo={opciones.nivel === 'juntas' ? 'Tus mesas' : 'La mesa'}
        descripcion={
          !personas || !hayHora
            ? 'Con el grupo y la hora, se encienden las mesas que os sirven.'
            : opciones.nivel === 'juntas'
              ? `No hay una mesa sola para ${personas}, pero el local junta estas. Elige las que prefieras.`
              : `Mesas libres a las ${reserva.horario} para ${personas} ${personas === 1 ? 'persona' : 'personas'}.`
        }
        hecho={hechos.mesa}
        activo={pasoActivo === 2}
        vacio={
          sinNada ? (
            <VacioReserva
              icono={LayoutGrid}
              titulo="A esa hora no queda sitio"
              texto={`No hay mesa libre para ${personas} a las ${reserva.horario}. Prueba otra hora o escríbeles.`}
            >
              {whatsapp && (
                <a className="reserva-vacio-accion" href={whatsapp} target="_blank" rel="noopener noreferrer">
                  <IconoWhatsApp size={16} />
                  Escribirles por WhatsApp
                </a>
              )}
            </VacioReserva>
          ) : null
        }
      >
        <VisorPlano
          plano={plano}
          estados={estados}
          elegidas={elegidas}
          unir={Boolean(juntaElegida)}
          onMesa={tocarMesa}
          apagado={!personas || !hayHora}
          titulo={`Plano de ${local.localName}`}
        >
          <LeyendaPlano items={leyenda} />
        </VisorPlano>

        {opciones.nivel === 'juntas' && hayHora && (
          <OpcionesJuntas
            juntas={opciones.juntas}
            porId={porId}
            elegida={juntaElegida?.id}
            onElegir={(idJunta) => setSeleccion({ tipo: 'junta', id: idJunta })}
            zonaDe={(m) => (m ? zonaDe(plano, m) || m.nota : null)}
          />
        )}

        <FichaMesa mesas={mesasElegidas} zona={zonaElegida} personas={personas} />
      </BloqueReserva>

      <BloqueReserva numero={4} titulo="Resumen" hecho={todoListo} activo={todoListo}>
        <ResumenReserva
          filas={[
            {
              etiqueta: 'Personas',
              valor: personas ? `${personas} ${personas === 1 ? 'persona' : 'personas'}` : null,
            },
            { etiqueta: 'Cuándo', valor: fechaTexto },
            {
              etiqueta: juntaElegida ? 'Mesas' : 'Mesa',
              valor: hayMesa ? nombreElegida : null,
              nota: juntaElegida ? `Juntas${zonaElegida ? ` · ${zonaElegida}` : ''}` : zonaElegida,
            },
            {
              etiqueta: 'Reserva',
              valor: hayMesa ? formatearPrecio(cobro.precio) : '—',
              nota: consumo,
              fuerte: true,
            },
            ...(configurado ? [{ etiqueta: 'Si llegas tarde', valor: `Te guardan la mesa ${ajustes.tolerancia} min` }] : []),
          ]}
        />
      </BloqueReserva>
    </ReservaShell>
  )
}

export default ReservarConLugar
