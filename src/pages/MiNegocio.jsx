import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { addDays, format, parse } from 'date-fns'
import { es } from 'date-fns/locale'
import gsap from 'gsap'
import { useGSAP } from '@gsap/react'
import { Banknote, CalendarDays, FileDown, Images, MessageSquareQuote, Pencil, Scissors, Timer, UserPlus, UserRound, Users, ZapOff } from 'lucide-react'
import CabeceraNegocio from '../components/Negocio/CabeceraNegocio.jsx'
import CitaDueno from '../components/Negocio/CitaDueno.jsx'
import FichaLocal from '../components/Negocio/FichaLocal.jsx'
import FiltroCitas from '../components/Negocio/FiltroCitas.jsx'
import ContenidoCatalogo from '../components/Negocio/modales/ContenidoCatalogo.jsx'
import ContenidoFichaLocal from '../components/Negocio/modales/ContenidoFichaLocal.jsx'
import ContenidoModalNegocio from '../components/Negocio/modales/ContenidoModalNegocio.jsx'
import ModalNegocioShell from '../components/Negocio/ModalNegocioShell.jsx'
import ResumenNegocio from '../components/Negocio/ResumenNegocio.jsx'
import TiraDias from '../components/Negocio/TiraDias.jsx'
import { DIAS_ADELANTE, DIAS_ATRAS, citasNegocioDemo } from '../data/citasNegocioDemo.js'
import { getLocalById } from '../services/locales.js'
import { saveFicha } from '../services/storage.js'
import { conPerfiles, profesionalesActivos } from '../services/usuarios.js'
import { minutosHastaCita, textoEnCita } from '../utils/citasVista.js'
import { CANCELADA, CONFIRMADA, PENDIENTE, POR_TI, caducarPendientes, textoEstadoReserva } from '../utils/estadosCita.js'
import { pausaActiva, textoHasta } from '../utils/pausaAgenda.js'
import { notaDeComentarios } from '../utils/fichaLocal.js'
import { descargarPdfCitas } from '../utils/pdfCitasNegocio.js'
import { codigoDia, fotosDe, horaAmPm as horaDeMinutos, minutosAbierto, nuevoId, turnosDelDia } from '../utils/fichaLocal.js'
import './miNegocio.css'

gsap.registerPlugin(useGSAP)

/* Local del dueño mientras no hay sesión. Sara abre 9:00–18:00 cada 90 min.
   Sus citas (las de hoy y las de los días de alrededor) salen de
   data/citasNegocioDemo.js. */
const ID_LOCAL = 'sara'

/* Reloj fijo del mock, para ver el timeline a mitad de turno mientras se estila. */
const AHORA_DEMO = new Date()

const MODALES = {
  siguiente: { titulo: 'Siguiente cita', subtitulo: 'Quién viene ahora', tono: 'verde', Icono: Timer },
  ocupacion: { titulo: 'Ocupación del día', subtitulo: 'Turnos del local', tono: 'verde', Icono: Users },
  estimado: { titulo: 'Estimado', subtitulo: 'Dinero del día', tono: 'verde', Icono: Banknote },
  pausa: { titulo: 'Pausar agenda', subtitulo: 'Cerrar reservas un rato', tono: 'amarillo', Icono: ZapOff },
  express: { titulo: 'Cliente express', subtitulo: 'Llega sin reserva', tono: 'verde', Icono: UserPlus },
  opiniones: { titulo: 'Opiniones', subtitulo: 'Lo que dicen de tu local', tono: 'verde', Icono: MessageSquareQuote },
  galeria: { titulo: 'Galería', subtitulo: 'Fotos del local', tono: 'verde', Icono: Images },
  editar: { titulo: 'Editar local', subtitulo: 'Datos de tu ficha', tono: 'verde', Icono: Pencil },
  servicios: { titulo: 'Servicios', subtitulo: 'Lo que ofreces', tono: 'verde', Icono: Scissors },
  servicio: { titulo: 'Servicio', subtitulo: 'Precio, duración y quién lo hace', tono: 'verde', Icono: Scissors },
  equipo: { titulo: 'Equipo', subtitulo: 'Quién atiende', tono: 'verde', Icono: Users },
  buscar: { titulo: 'Añadir profesional', subtitulo: 'Busca su cuenta de Citaly', tono: 'verde', Icono: UserPlus },
  profesional: { titulo: 'Profesional', subtitulo: 'Servicios que hace en tu local', tono: 'verde', Icono: UserRound },
}

const MODALES_FICHA = new Set(['opiniones', 'galeria', 'editar'])
const MODALES_CATALOGO = new Set(['servicios', 'servicio', 'equipo', 'buscar', 'profesional'])

const FILTROS = [
  { id: 'todas', label: 'Todas' },
  { id: 'pendientes', label: 'Pendientes' },
  { id: 'confirmadas', label: 'Confirmadas' },
  { id: 'atendidas', label: 'Atendidas' },
  { id: 'canceladas', label: 'Canceladas' },
]

function conMayuscula(texto) {
  return texto.charAt(0).toUpperCase() + texto.slice(1)
}

/* Cómo se llama el día elegido en el título de la lista. */
function nombreDelDia(desplazamiento, fecha) {
  if (desplazamiento === 0) return 'de hoy'
  if (desplazamiento === -1) return 'de ayer'
  if (desplazamiento === 1) return 'de mañana'
  return `del ${format(fecha, 'EEEE d', { locale: es })}`
}

const VACIO_FILTRO = {
  todas: 'No hay citas en la agenda de hoy.',
  pendientes: 'Nada por confirmar. Todo al día.',
  confirmadas: 'No quedan citas confirmadas por llegar.',
  atendidas: 'Todavía no has atendido a nadie hoy.',
  canceladas: 'Ninguna cancelación hoy.',
}

const FRANJAS = [
  { id: 'manana', label: 'Mañana', hasta: 12 * 60 },
  { id: 'tarde', label: 'Tarde', hasta: 18 * 60 },
  { id: 'noche', label: 'Noche', hasta: 24 * 60 },
]

function aMinutos(hhmm) {
  const [h, m] = String(hhmm).split(':').map(Number)
  return h * 60 + (m || 0)
}

function agruparPorFranja(citas) {
  return FRANJAS.map((franja, i) => {
    const desde = i ? FRANJAS[i - 1].hasta : 0
    return {
      ...franja,
      citas: citas.filter((c) => {
        const min = aMinutos(c.horario)
        return min >= desde && min < franja.hasta
      }),
    }
  }).filter((f) => f.citas.length)
}

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
  return `${horas} h ${resto}m`
}

/* Cada cita cae en un solo grupo del filtro. Empezada y confirmada cuenta como atendida. */
function grupoCita(cita, ahora) {
  if (cita.estadoReserva === CANCELADA) return 'canceladas'
  if (cita.estadoReserva === PENDIENTE || cita.estadoReserva === POR_TI) return 'pendientes'
  return minutosHastaCita(cita, ahora) <= 0 ? 'atendidas' : 'confirmadas'
}

function enCurso(cita, ahora) {
  if (cita.estadoReserva === CANCELADA) return false
  const min = minutosHastaCita(cita, ahora)
  return min <= 0 && min > -(cita.duracion ?? 30)
}

function relativoCita(cita, ahora) {
  if (cita.estadoReserva === CANCELADA) return 'cancelada'
  if (enCurso(cita, ahora)) return 'en curso'
  return textoEnCita(cita, ahora)
}

function detalleOcupacion(porcentaje) {
  if (porcentaje >= 85) return 'Casi lleno'
  if (porcentaje >= 60) return 'Buen ritmo'
  if (porcentaje >= 30) return 'Hay huecos'
  return 'Día tranquilo'
}

function resumenDelDia(citas, ahora, local) {
  const apertura = aMinutos(local.horarioApertura)
  const cierre = apertura + minutosAbierto(local.horarioApertura, local.horarioCierre)
  const profesionales = profesionalesActivos(local).map((p) => String(p.name).split(' ')[0])
  const capacidad =
    turnosDelDia(local.horarioApertura, local.horarioCierre, local.intervaloMinutos).length *
    Math.max(1, profesionales.length)

  const activas = citas.filter((c) => c.estadoReserva !== CANCELADA)
  const proximas = activas
    .filter((c) => minutosHastaCita(c, ahora) > 0)
    .sort((a, b) => minutosHastaCita(a, ahora) - minutosHastaCita(b, ahora))
  const [siguiente, despues] = proximas
  const porGrupo = (g) => citas.filter((c) => grupoCita(c, ahora) === g)
  const suma = (lista) => lista.reduce((t, c) => t + (c.precio ?? 0), 0)

  const atendidas = porGrupo('atendidas')
  const confirmadas = porGrupo('confirmadas')
  const pendientes = porGrupo('pendientes')

  const ocupados = activas.length
  const libres = Math.max(capacidad - ocupados, 0)
  const porcentaje = capacidad ? Math.min(Math.round((ocupados / capacidad) * 100), 100) : 0

  const iniH = Math.floor(apertura / 60)
  const finH = Math.ceil(cierre / 60)
  const horaAhora = ahora.getHours() < iniH && finH > 24 ? ahora.getHours() + 24 : ahora.getHours()
  const porHora = []
  for (let h = iniH; h < finH; h++) {
    porHora.push({
      etiqueta: String(h % 12 || 12),
      cantidad: activas.filter((c) => Math.floor(aMinutos(c.horario) / 60) === h % 24).length,
      esAhora: h === horaAhora,
      pasada: h < horaAhora,
      hora: h % 24,
    })
  }
  const pico = porHora.reduce((max, f) => (f.cantidad > (max?.cantidad ?? 0) ? f : max), null)

  const cobrado = suma(atendidas)
  const total = suma(activas)

  return {
    siguiente: siguiente
      ? {
          valor: valorMinutosHasta(minutosHastaCita(siguiente, ahora)),
          minutos: minutosHastaCita(siguiente, ahora),
          cliente: nombreCorto(siguiente.cliente),
          hora: horaAmPm(siguiente.fecha, siguiente.horario),
          citaId: siguiente.id,
        }
      : null,
    despues: despues ?? null,
    ocupacion: {
      porcentaje,
      detalle: detalleOcupacion(porcentaje),
      capacidad,
      ocupados,
      libres,
      ventana: `${horaDeMinutos(apertura)} – ${horaDeMinutos(cierre)}`,
      segmentos: [
        { id: 'atendidas', label: 'Atendidas', cantidad: atendidas.length, color: 'var(--primary-color-weak)' },
        { id: 'confirmadas', label: 'Confirmadas', cantidad: confirmadas.length, color: 'var(--primary-color)' },
        { id: 'pendientes', label: 'Pendientes', cantidad: pendientes.length, color: 'var(--yellow-color)' },
        { id: 'libres', label: 'Libres', cantidad: libres, color: '#3a403e' },
      ],
      porHora,
      horaPico: pico ? horaDeMinutos(pico.hora * 60) : null,
    },
    estimado: {
      total,
      cobrado,
      citasHoy: activas.length,
      promedio: activas.length ? Math.round(total / activas.length) : 0,
      propinas: Math.round(cobrado * 0.1),
      partes: [
        { id: 'cobrado', label: 'Cobrado', ayuda: `${atendidas.length} atendidas`, monto: cobrado, color: 'var(--primary-color)' },
        {
          id: 'por-cobrar',
          label: 'Por cobrar',
          ayuda: `${confirmadas.length} confirmadas por llegar`,
          monto: suma(confirmadas),
          color: 'var(--primary-color-weak)',
        },
        {
          id: 'en-duda',
          label: 'En el aire',
          ayuda: `${pendientes.length} sin confirmar`,
          monto: suma(pendientes),
          color: 'var(--yellow-color)',
        },
      ],
    },
  }
}

function MiNegocio() {
  const [local, setLocal] = useState(() => getLocalById(ID_LOCAL))
  const [citas, setCitas] = useState(() => citasNegocioDemo(getLocalById(ID_LOCAL), AHORA_DEMO))
  const [filtro, setFiltro] = useState('todas')
  /* El día que se está mirando. Solo uno a la vez: la tira de arriba deja
     moverse por la semana sin juntar todas las citas en un bulto. */
  const hoyClave = format(AHORA_DEMO, 'yyyy-MM-dd')
  const [diaElegido, setDiaElegido] = useState(hoyClave)
  /* El reloj de verdad, para lo que caduca solo (la pausa). */
  const [reloj, setReloj] = useState(() => new Date())
  const [modal, setModal] = useState(null)
  const [modalAbierto, setModalAbierto] = useState(false)
  const listaRef = useRef(null)

  useEffect(() => {
    const tick = () => {
      setCitas((prev) => caducarPendientes(prev))
      setReloj(new Date())
    }
    const id = setInterval(tick, 30000)
    return () => clearInterval(id)
  }, [])

  /* El resumen de arriba (siguiente, ocupación, estimado) es siempre de hoy.
     La lista de abajo es del día elegido. */
  const citasHoy = useMemo(() => citas.filter((c) => c.fecha === hoyClave), [citas, hoyClave])
  const citasDelDia = useMemo(() => citas.filter((c) => c.fecha === diaElegido), [citas, diaElegido])
  const resumen = useMemo(() => resumenDelDia(citasHoy, AHORA_DEMO, local), [citasHoy, local])

  const dias = useMemo(() => {
    const lista = []
    for (let d = -DIAS_ATRAS; d <= DIAS_ADELANTE; d++) {
      const fecha = addDays(AHORA_DEMO, d)
      const clave = format(fecha, 'yyyy-MM-dd')
      lista.push({
        clave,
        fecha,
        desplazamiento: d,
        abre: local.dias.includes(codigoDia(fecha)),
        cantidad: citas.filter((c) => c.fecha === clave && c.estadoReserva !== CANCELADA).length,
      })
    }
    return lista
  }, [citas, local.dias])
  const diaActual = dias.find((d) => d.clave === diaElegido) ?? dias.find((d) => d.desplazamiento === 0)
  const esHoy = diaActual.desplazamiento === 0
  const esPasado = diaActual.desplazamiento < 0

  const elegirDia = (clave) => {
    setDiaElegido(clave)
    setFiltro('todas')
  }

  const enPausa = pausaActiva(local.pausa, reloj)
  const notaLocal = useMemo(() => notaDeComentarios(local), [local])
  const fotos = useMemo(() => fotosDe(local), [local])
  const conHora = useMemo(
    () => citasDelDia.map((c) => ({ ...c, horaTexto: horaAmPm(c.fecha, c.horario) })),
    [citasDelDia],
  )
  const hoyConHora = useMemo(
    () => citasHoy.map((c) => ({ ...c, horaTexto: horaAmPm(c.fecha, c.horario) })),
    [citasHoy],
  )
  const citaSiguiente = hoyConHora.find((c) => c.id === resumen.siguiente?.citaId)
  const despues = resumen.despues ? hoyConHora.find((c) => c.id === resumen.despues.id) : null

  const cantidades = useMemo(
    () =>
      conHora.reduce(
        (acc, c) => {
          acc[grupoCita(c, AHORA_DEMO)] += 1
          return acc
        },
        { todas: conHora.length, pendientes: 0, confirmadas: 0, atendidas: 0, canceladas: 0 }
      ),
    [conHora]
  )
  const opcionesFiltro = useMemo(() => FILTROS.map((f) => ({ ...f, cantidad: cantidades[f.id] })), [cantidades])
  const visibles = useMemo(
    () => (filtro === 'todas' ? conHora : conHora.filter((c) => grupoCita(c, AHORA_DEMO) === filtro)),
    [conHora, filtro]
  )
  const franjas = useMemo(
    () => agruparPorFranja([...visibles].sort((a, b) => aMinutos(a.horario) - aMinutos(b.horario))),
    [visibles]
  )

  const abrirModal = (tipo, extra) => {
    setModal({ tipo, ...extra })
    setModalAbierto(true)
  }
  const cerrarModal = useCallback(() => setModalAbierto(false), [])
  const cambiarEstado = (id, estadoReserva) =>
    setCitas((prev) => prev.map((c) => (c.id === id ? { ...c, estadoReserva } : c)))

  /* Devuelve false si el navegador no tiene sitio (pasa con muchas fotos). */
  const guardarFicha = (cambios) => {
    const guardado = saveFicha(ID_LOCAL, cambios)
    if (guardado) setLocal((prev) => conPerfiles({ ...prev, ...cambios }))
    return guardado
  }

  const agregarFotos = (nuevas) => {
    const urls = [...fotos, ...nuevas]
    return guardarFicha({ urls, url: local.url || urls[0] })
  }

  /* Si se quita la portada, la siguiente foto pasa a serlo. */
  const quitarFoto = (foto) => {
    const urls = fotos.filter((f) => f !== foto)
    return guardarFicha({ urls, url: foto === local.url ? urls[0] : local.url })
  }

  const pausar = (pausa) => {
    guardarFicha({ pausa })
    cerrarModal()
  }

  const reanudar = () => {
    guardarFicha({ pausa: null })
    cerrarModal()
  }

  /* El cliente express entra en la agenda de hoy ya confirmado: está en la
     puerta. Se vuelve a hoy para verlo en su sitio. */
  const agregarCitaExpress = (datos) => {
    setCitas((prev) => [
      ...prev,
      {
        ...datos,
        id: nuevoId('express'),
        fecha: hoyClave,
        esLugar: false,
        express: true,
        estadoReserva: CONFIRMADA,
        creadaEn: new Date().toISOString(),
      },
    ])
    elegirDia(hoyClave)
    cerrarModal()
  }

  const exportarPdf = () => {
    if (!visibles.length) return
    const ordenadas = [...visibles].sort((a, b) => aMinutos(a.horario) - aMinutos(b.horario))
    descargarPdfCitas({
      localNombre: local.localName,
      fechaTexto: format(diaActual.fecha, "EEEE d 'de' MMMM yyyy", { locale: es }),
      filtroLabel: FILTROS.find((f) => f.id === filtro)?.label ?? 'Todas',
      citas: ordenadas.map((cita) => ({
        ...cita,
        estadoPdf: enCurso(cita, AHORA_DEMO)
          ? 'En curso'
          : grupoCita(cita, AHORA_DEMO) === 'atendidas'
            ? 'Atendida'
            : textoEstadoReserva(cita.estadoReserva, { dueno: true }),
      })),
    })
  }

  const configModal = MODALES[modal?.tipo] ?? {}

  useGSAP(
    () => {
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
      gsap.from('.negocio-citas-item', {
        y: 16,
        autoAlpha: 0,
        duration: 0.45,
        stagger: 0.05,
        ease: 'power3.out',
        clearProps: 'transform,opacity,visibility',
      })
    },
    { scope: listaRef, dependencies: [filtro, diaElegido] }
  )

  return (
    <section className="negocio" aria-label="Mi Negocio">
      <div className="negocio-tablero">
      <CabeceraNegocio
        nombre={local.localName}
        url={local.url}
        categoria={local.categoria}
        nota={notaLocal.nota}
        opiniones={notaLocal.cantidad}
        fotos={fotos}
        abreHoy={local.dias.includes(codigoDia(AHORA_DEMO))}
        recibiendo
        pausada={enPausa}
        apertura={local.horarioApertura}
        cierre={local.horarioCierre}
        ahora={AHORA_DEMO}
        onGaleria={() => abrirModal('galeria')}
        onEditar={() => abrirModal('editar')}
        animacionPausada={modalAbierto}
      />
      <ResumenNegocio
        siguiente={resumen.siguiente}
        ocupacion={resumen.ocupacion}
        estimado={resumen.estimado}
        onSiguiente={() => abrirModal('siguiente')}
        onOcupacion={() => abrirModal('ocupacion')}
        onEstimado={() => abrirModal('estimado')}
        onPausarAgenda={() => abrirModal('pausa')}
        onClienteExpress={() => abrirModal('express')}
        pausa={enPausa ? { hasta: textoHasta(new Date(local.pausa.hasta)) } : null}
      />
      <div className="negocio-citas">
        <header className="negocio-citas-encabezado">
          <div>
            <h2 className="negocio-citas-titulo">Citas {nombreDelDia(diaActual.desplazamiento, diaActual.fecha)}</h2>
            <p className="negocio-citas-fecha">
              <span>{conMayuscula(format(diaActual.fecha, "EEEE d 'de' MMMM", { locale: es }))}</span>
              {!esHoy && (
                <button type="button" className="negocio-citas-hoy" onClick={() => elegirDia(hoyClave)}>
                  <CalendarDays size={13} strokeWidth={2.25} aria-hidden="true" />
                  Volver a hoy
                </button>
              )}
            </p>
          </div>
          <div className="negocio-citas-acciones">
            <p className="negocio-citas-contador">
              <strong>{conHora.length - cantidades.canceladas}</strong> en agenda
            </p>
            <button
              type="button"
              className="negocio-citas-pdf"
              onClick={exportarPdf}
              disabled={!visibles.length}
            >
              <FileDown size={16} strokeWidth={2.25} />
              PDF
            </button>
          </div>
        </header>

        <TiraDias dias={dias} seleccionada={diaElegido} onElegir={elegirDia} />

        {diaActual.abre && conHora.length > 0 && (
          <FiltroCitas opciones={opcionesFiltro} activo={filtro} onCambiar={setFiltro} />
        )}

        <div className="negocio-citas-lista" ref={listaRef}>
          {visibles.length === 0 && (
            <div className="negocio-citas-vacio negocio-citas-item">
              <span className="negocio-citas-vacio-luna" aria-hidden="true" />
              <p>
                {!diaActual.abre
                  ? 'Ese día no abres.'
                  : conHora.length === 0
                    ? esPasado
                      ? 'Ese día no tuviste citas.'
                      : 'Todavía no hay citas para ese día.'
                    : esHoy
                      ? VACIO_FILTRO[filtro]
                      : 'Ninguna cita con ese filtro ese día.'}
              </p>
            </div>
          )}
          {franjas.map((franja) => (
            <section key={franja.id} className="negocio-franja" aria-label={`Citas de la ${franja.label.toLowerCase()}`}>
              <header className="negocio-franja-cabecera negocio-citas-item">
                <h3 className="negocio-franja-titulo">{franja.label}</h3>
                <span className="negocio-franja-cuenta">
                  {franja.citas.length} {franja.citas.length === 1 ? 'cita' : 'citas'}
                </span>
              </header>
              <div className="negocio-franja-lista">
                {franja.citas.map((cita) => {
                  const ahoraEnCurso = enCurso(cita, AHORA_DEMO)
                  return (
                    <div key={cita.id} className="negocio-citas-item">
                      <CitaDueno
                        {...cita}
                        hora={cita.horario}
                        relativo={relativoCita(cita, AHORA_DEMO)}
                        destacada={ahoraEnCurso}
                        atendida={!ahoraEnCurso && grupoCita(cita, AHORA_DEMO) === 'atendidas'}
                        onConfirmar={
                          cita.estadoReserva === PENDIENTE && !esPasado ? () => cambiarEstado(cita.id, POR_TI) : undefined
                        }
                        onRechazar={
                          cita.estadoReserva === PENDIENTE && !esPasado ? () => cambiarEstado(cita.id, CANCELADA) : undefined
                        }
                      />
                    </div>
                  )
                })}
              </div>
            </section>
          ))}
        </div>
      </div>

      <FichaLocal
        local={local}
        onEditar={(seccion) => abrirModal('editar', { seccion })}
        onOpiniones={() => abrirModal('opiniones')}
        onCatalogo={(tipo) => abrirModal(tipo)}
      />
      </div>

      <ModalNegocioShell
        abierto={modalAbierto}
        titulo={modal?.titulo ?? configModal.titulo}
        subtitulo={configModal.subtitulo}
        tono={configModal.tono}
        Icono={configModal.Icono}
        vista={`${modal?.tipo}-${modal?.id ?? modal?.usuarioId ?? modal?.seccion ?? ''}`}
        onCerrar={cerrarModal}
      >
        {MODALES_CATALOGO.has(modal?.tipo) ? (
          <ContenidoCatalogo
            modal={modal}
            local={local}
            onNavegar={setModal}
            onGuardar={(cambios, siguiente) => {
              guardarFicha(cambios)
              setModal(siguiente)
            }}
          />
        ) : MODALES_FICHA.has(modal?.tipo) ? (
          <ContenidoFichaLocal
            modal={modal}
            local={local}
            onPortada={(foto) => guardarFicha({ url: foto, urls: fotos })}
            onAgregarFotos={agregarFotos}
            onQuitarFoto={quitarFoto}
            onGuardar={(cambios) => {
              guardarFicha(cambios)
              cerrarModal()
            }}
          />
        ) : (
          <ContenidoModalNegocio
            modal={modal}
            resumen={{ ...resumen, despues }}
            citas={hoyConHora}
            citaSiguiente={citaSiguiente}
            ahora={AHORA_DEMO}
            local={local}
            pausa={local.pausa}
            reloj={reloj}
            onPausar={pausar}
            onReanudar={reanudar}
            onAgregarCita={agregarCitaExpress}
          />
        )}
      </ModalNegocioShell>
    </section>
  )
}

export default MiNegocio
