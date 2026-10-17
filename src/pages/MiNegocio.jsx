import { useCallback, useRef, useState } from 'react'
import { format, parse } from 'date-fns'
import { es } from 'date-fns/locale'
import gsap from 'gsap'
import { useGSAP } from '@gsap/react'
import { Banknote, Images, Pencil, Scissors, Store, Timer, UserPlus, UserRound, Users, ZapOff } from 'lucide-react'
import CabeceraNegocio from '../components/Negocio/CabeceraNegocio.jsx'
import CitaDueno from '../components/Negocio/CitaDueno.jsx'
import FichaLocal from '../components/Negocio/FichaLocal.jsx'
import FiltroCitas from '../components/Negocio/FiltroCitas.jsx'
import ContenidoCatalogo from '../components/Negocio/modales/ContenidoCatalogo.jsx'
import ContenidoFichaLocal from '../components/Negocio/modales/ContenidoFichaLocal.jsx'
import ContenidoModalNegocio from '../components/Negocio/modales/ContenidoModalNegocio.jsx'
import ModalNegocioShell from '../components/Negocio/ModalNegocioShell.jsx'
import ResumenNegocio from '../components/Negocio/ResumenNegocio.jsx'
import { getLocalById } from '../services/locales.js'
import { saveFicha } from '../services/storage.js'
import { conPerfiles, profesionalesActivos } from '../services/usuarios.js'
import { minutosHastaCita, textoEnCita } from '../utils/citasVista.js'
import { codigoDia, fotosDe, horaAmPm as horaDeMinutos, minutosAbierto, turnosDelDia } from '../utils/fichaLocal.js'
import './miNegocio.css'

gsap.registerPlugin(useGSAP)

/* Local del dueño mientras no hay sesión. Sara abre jueves 9AM–6PM, y el reloj del mock cae dentro. */
const ID_LOCAL = 'sara'
const FECHA_DEMO = '2026-09-24'

/* Datos de mentira para estilar, con los servicios y profesionales de Sara. */
const CITAS_HOY = [
  {
    id: '1',
    fecha: FECHA_DEMO,
    horario: '09:15',
    cliente: 'Lisandra Pérez',
    telefono: '+53 5412 9083',
    tipo: 'servicio',
    linea: 'Manicura',
    detalle: 'Con Sofía',
    duracion: 40,
    precio: 250,
    estado: 'confirmada',
  },
  {
    id: '2',
    fecha: FECHA_DEMO,
    horario: '10:30',
    cliente: 'Yosvany Morales',
    telefono: '+53 5284 1802',
    tipo: 'servicio',
    linea: 'Corte caballero',
    detalle: 'Con Carlos',
    duracion: 30,
    precio: 300,
    estado: 'confirmada',
  },
  {
    id: '3',
    fecha: FECHA_DEMO,
    horario: '11:15',
    cliente: 'Dayana Ruiz',
    telefono: '+53 5367 2241',
    tipo: 'servicio',
    linea: 'Tinte completo',
    detalle: 'Con Laura',
    duracion: 120,
    precio: 1200,
    estado: 'pendiente',
  },
  {
    id: '4',
    fecha: FECHA_DEMO,
    horario: '12:00',
    cliente: 'Gretel Rodríguez',
    telefono: '+53 5340 7711',
    tipo: 'servicio',
    linea: 'Corte dama',
    detalle: 'Con Sofía',
    duracion: 45,
    precio: 450,
    estado: 'pendiente',
  },
  {
    id: '5',
    fecha: FECHA_DEMO,
    horario: '13:30',
    cliente: 'Ernesto Báez',
    telefono: '+53 5590 1276',
    tipo: 'servicio',
    linea: 'Corte caballero',
    detalle: 'Con Miguel',
    duracion: 30,
    precio: 300,
    estado: 'cancelada',
  },
  {
    id: '6',
    fecha: FECHA_DEMO,
    horario: '14:15',
    cliente: 'Dr. Carlos V.',
    tipo: 'servicio',
    linea: 'Corte caballero',
    detalle: 'Con Carlos',
    duracion: 30,
    precio: 300,
    estado: 'confirmada',
  },
  {
    id: '7',
    fecha: FECHA_DEMO,
    horario: '16:40',
    cliente: 'Mairelys Soto',
    telefono: '+53 5221 6604',
    tipo: 'servicio',
    linea: 'Corte dama',
    detalle: 'Con Laura',
    duracion: 45,
    precio: 450,
    estado: 'pendiente',
  },
]

/* Reloj fijo del mock, para ver el timeline a mitad de turno mientras se estila. */
const AHORA_DEMO = new Date()

const MODALES = {
  siguiente: { titulo: 'Siguiente cita', subtitulo: 'Quién viene ahora', tono: 'verde', Icono: Timer },
  ocupacion: { titulo: 'Ocupación del día', subtitulo: 'Turnos del local', tono: 'verde', Icono: Users },
  estimado: { titulo: 'Estimado', subtitulo: 'Dinero del día', tono: 'verde', Icono: Banknote },
  pausa: { titulo: 'Pausar agenda', subtitulo: 'Cerrar reservas un rato', tono: 'amarillo', Icono: ZapOff },
  express: { titulo: 'Cliente express', subtitulo: 'Llega sin reserva', tono: 'verde', Icono: UserPlus },
  ficha: { titulo: 'Ficha del local', subtitulo: 'Lo que ven tus clientes', tono: 'verde', Icono: Store },
  galeria: { titulo: 'Galería', subtitulo: 'Fotos del local', tono: 'verde', Icono: Images },
  editar: { titulo: 'Editar local', subtitulo: 'Datos de tu ficha', tono: 'verde', Icono: Pencil },
  servicios: { titulo: 'Servicios', subtitulo: 'Lo que ofreces', tono: 'verde', Icono: Scissors },
  servicio: { titulo: 'Servicio', subtitulo: 'Precio, duración y quién lo hace', tono: 'verde', Icono: Scissors },
  equipo: { titulo: 'Equipo', subtitulo: 'Quién atiende', tono: 'verde', Icono: Users },
  buscar: { titulo: 'Añadir profesional', subtitulo: 'Busca su cuenta de Citaly', tono: 'verde', Icono: UserPlus },
  profesional: { titulo: 'Profesional', subtitulo: 'Servicios que hace en tu local', tono: 'verde', Icono: UserRound },
}

const MODALES_FICHA = new Set(['ficha', 'galeria', 'editar'])
const MODALES_CATALOGO = new Set(['servicios', 'servicio', 'equipo', 'buscar', 'profesional'])

const FILTROS = [
  { id: 'todas', label: 'Todas' },
  { id: 'pendientes', label: 'Pendientes' },
  { id: 'confirmadas', label: 'Confirmadas' },
  { id: 'atendidas', label: 'Atendidas' },
  { id: 'canceladas', label: 'Canceladas' },
]

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
  if (cita.estado === 'cancelada') return 'canceladas'
  if (cita.estado === 'pendiente') return 'pendientes'
  return minutosHastaCita(cita, ahora) <= 0 ? 'atendidas' : 'confirmadas'
}

function enCurso(cita, ahora) {
  if (cita.estado === 'cancelada') return false
  const min = minutosHastaCita(cita, ahora)
  return min <= 0 && min > -(cita.duracion ?? 30)
}

function relativoCita(cita, ahora) {
  if (cita.estado === 'cancelada') return 'cancelada'
  if (enCurso(cita, ahora)) return 'en curso'
  return textoEnCita(cita, ahora)
}

function proximoHueco(citas, ahora, cierreMin) {
  const activas = citas.filter((c) => c.estado !== 'cancelada')
  const ahoraMin = ahora.getHours() * 60 + ahora.getMinutes()
  for (let inicio = Math.ceil(ahoraMin / 15) * 15; inicio + 30 <= cierreMin; inicio += 15) {
    const choca = activas.some((c) => {
      const ini = aMinutos(c.horario)
      return inicio < ini + (c.duracion ?? 30) && ini < inicio + 30
    })
    if (!choca) return format(new Date(2000, 0, 1, Math.floor(inicio / 60), inicio % 60), 'h:mm a')
  }
  return null
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

  const activas = citas.filter((c) => c.estado !== 'cancelada')
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
    hueco: proximoHueco(citas, ahora, cierre),
    profesionales,
  }
}

function MiNegocio() {
  const [local, setLocal] = useState(() => getLocalById(ID_LOCAL))
  const [citas, setCitas] = useState(CITAS_HOY)
  const [filtro, setFiltro] = useState('todas')
  const [modal, setModal] = useState(null)
  const [modalAbierto, setModalAbierto] = useState(false)
  const listaRef = useRef(null)

  const resumen = resumenDelDia(citas, AHORA_DEMO, local)
  const fotos = fotosDe(local)
  const conHora = citas.map((c) => ({ ...c, horaTexto: horaAmPm(c.fecha, c.horario) }))
  const citaSiguiente = conHora.find((c) => c.id === resumen.siguiente?.citaId)
  const despues = resumen.despues ? conHora.find((c) => c.id === resumen.despues.id) : null

  const cantidades = conHora.reduce(
    (acc, c) => {
      acc[grupoCita(c, AHORA_DEMO)] += 1
      return acc
    },
    { todas: conHora.length, pendientes: 0, confirmadas: 0, atendidas: 0, canceladas: 0 }
  )
  const opcionesFiltro = FILTROS.map((f) => ({ ...f, cantidad: cantidades[f.id] }))
  const visibles = filtro === 'todas' ? conHora : conHora.filter((c) => grupoCita(c, AHORA_DEMO) === filtro)
  const franjas = agruparPorFranja([...visibles].sort((a, b) => aMinutos(a.horario) - aMinutos(b.horario)))

  const abrirModal = (tipo, extra) => {
    setModal({ tipo, ...extra })
    setModalAbierto(true)
  }
  const cerrarModal = useCallback(() => setModalAbierto(false), [])
  const cambiarEstado = (id, estado) => setCitas((prev) => prev.map((c) => (c.id === id ? { ...c, estado } : c)))

  const guardarFicha = (cambios) => {
    setLocal((prev) => conPerfiles({ ...prev, ...cambios }))
    saveFicha(ID_LOCAL, cambios)
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
    { scope: listaRef, dependencies: [filtro] }
  )

  return (
    <section className="negocio" aria-label="Mi Negocio">
      <CabeceraNegocio
        nombre={local.localName}
        url={local.url}
        categoria={local.categoria}
        nota={local.points}
        opiniones={local.opiniones}
        fotos={fotos}
        cerrado={Boolean(local.close)}
        abreHoy={local.dias.includes(codigoDia(AHORA_DEMO))}
        recibiendo={!local.close}
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
      />
      <div className="negocio-citas">
        <header className="negocio-citas-encabezado">
          <div>
            <h2 className="negocio-citas-titulo">Citas de hoy</h2>
            <p className="negocio-citas-fecha">{format(AHORA_DEMO, "EEEE d 'de' MMMM", { locale: es })}</p>
          </div>
          <p className="negocio-citas-contador">
            <strong>{citas.length - cantidades.canceladas}</strong> en agenda
          </p>
        </header>

        <FiltroCitas opciones={opcionesFiltro} activo={filtro} onCambiar={setFiltro} />

        <div className="negocio-citas-lista" ref={listaRef}>
          {visibles.length === 0 && (
            <div className="negocio-citas-vacio negocio-citas-item">
              <span className="negocio-citas-vacio-luna" aria-hidden="true" />
              <p>{VACIO_FILTRO[filtro]}</p>
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
                        onConfirmar={cita.estado === 'pendiente' ? () => cambiarEstado(cita.id, 'confirmada') : undefined}
                        onRechazar={cita.estado === 'pendiente' ? () => cambiarEstado(cita.id, 'cancelada') : undefined}
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
        onAbrir={(pestana) => abrirModal('ficha', { pestana })}
        onCatalogo={(tipo) => abrirModal(tipo)}
      />

      <ModalNegocioShell
        abierto={modalAbierto}
        titulo={modal?.titulo ?? configModal.titulo}
        subtitulo={configModal.subtitulo}
        tono={configModal.tono}
        Icono={configModal.Icono}
        vista={`${modal?.tipo}-${modal?.id ?? modal?.usuarioId ?? ''}`}
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
            ahora={AHORA_DEMO}
            onEditar={() => setModal({ tipo: 'editar' })}
            onGaleria={() => setModal({ tipo: 'galeria' })}
            onPortada={(foto) => guardarFicha({ url: foto, urls: fotos })}
            onGuardar={(cambios) => {
              guardarFicha(cambios)
              cerrarModal()
            }}
          />
        ) : (
          <ContenidoModalNegocio
            modal={modal}
            resumen={{ ...resumen, despues }}
            citas={conHora}
            citaSiguiente={citaSiguiente}
            ahora={AHORA_DEMO}
          />
        )}
      </ModalNegocioShell>
    </section>
  )
}

export default MiNegocio
