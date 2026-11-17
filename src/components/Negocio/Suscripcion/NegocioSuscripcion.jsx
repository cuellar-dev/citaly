import { useCallback, useEffect, useMemo, useState } from 'react'
import { format, isSameMonth, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'
import {
  AlertTriangle,
  Banknote,
  BellRing,
  Clock,
  FileDown,
  Images,
  Inbox,
  MessageSquareQuote,
  Pencil,
  Percent,
  Ticket,
  Timer,
  UserPlus,
  Users,
} from 'lucide-react'
import CabeceraNegocio from '../CabeceraNegocio.jsx'
import FichaLocal from '../FichaLocal.jsx'
import FiltroCitas from '../FiltroCitas.jsx'
import ModalNegocioShell from '../ModalNegocioShell.jsx'
import ContenidoFichaLocal from '../modales/ContenidoFichaLocal.jsx'
import ContenidoPlanes from '../modales/ContenidoPlanes.jsx'
import AvisoBreve from '../../DetalleLocal/AvisoBreve.jsx'
import ContenidoSocios from './ContenidoSocios.jsx'
import ResumenSocios from './ResumenSocios.jsx'
import SocioDueno from './SocioDueno.jsx'
import TurnosSocios from './TurnosSocios.jsx'
import { sociosDemo } from '../../../data/sociosDemo.js'
import { getLocalById } from '../../../services/locales.js'
import { actualizarSuscripcion, saveFicha } from '../../../services/storage.js'
import { codigoDia, fotosDe, notaDeComentarios } from '../../../utils/fichaLocal.js'
import { descargarPdfSocios } from '../../../utils/pdfSociosNegocio.js'
import { ETIQUETA_SITUACION, fechaCorta, situacionSocio, sumarPeriodo, textoSituacion } from '../../../utils/socios.js'
import { listaTurnos, ocupacionTurnos, turnoDeSocio, turnosDe } from '../../../utils/turnos.js'
import './negocioSuscripcion.css'
import '../../../pages/miNegocio.css'

/* Mi Negocio para un local de pago mensual (gimnasio, cursos…). En vez de
   una agenda de citas, la lista de socios: quién está al día, a quién le
   toca pagar y quién se pasó (con su recargo). */

const MODALES = {
  editar: { titulo: 'Editar local', subtitulo: 'Datos de tu ficha', tono: 'verde', Icono: Pencil },
  galeria: { titulo: 'Galería', subtitulo: 'Fotos del local', tono: 'verde', Icono: Images },
  opiniones: { titulo: 'Opiniones', subtitulo: 'Lo que dicen de tu local', tono: 'verde', Icono: MessageSquareQuote },
  planes: { titulo: 'Planes', subtitulo: 'Lo que cobras y qué incluye', tono: 'verde', Icono: Ticket },
  plan: { titulo: 'Plan', subtitulo: 'Precio, periodo y qué incluye', tono: 'verde', Icono: Ticket },
  recargo: { titulo: 'Recargo por atraso', subtitulo: 'Para quien paga tarde', tono: 'amarillo', Icono: Percent },
  nuevoSocio: { titulo: 'Nuevo cliente', subtitulo: 'Se apunta en el local', tono: 'verde', Icono: UserPlus },
  cobros: { titulo: 'Próximo cobro', subtitulo: 'Quién tiene que pagar', tono: 'amarillo', Icono: Timer },
  socios: { titulo: 'Clientes', subtitulo: 'Cómo van con los pagos', tono: 'verde', Icono: Users },
  mes: { titulo: 'Este mes', subtitulo: 'Lo cobrado y lo que falta', tono: 'verde', Icono: Banknote },
  solicitudes: { titulo: 'Quieren unirse', subtitulo: 'Acepta o rechaza', tono: 'amarillo', Icono: Inbox },
  turnos: { titulo: 'Turnos', subtitulo: 'Duración y personas por turno', tono: 'verde', Icono: Clock },
  turno: { titulo: 'Turno', subtitulo: 'Quién viene y su cupo', tono: 'verde', Icono: Clock },
}
const MODALES_FICHA = new Set(['editar', 'galeria', 'opiniones'])
const MODALES_SOCIOS = new Set(['cobros', 'socios', 'mes', 'solicitudes', 'turnos', 'turno'])

/* Las solicitudes no van en la lista: tienen su propio botón arriba. */
const FILTROS = [
  { id: 'todos', label: 'Todos' },
  { id: 'atrasados', label: 'Atrasados' },
  { id: 'por-vencer', label: 'Por vencer' },
  { id: 'al-dia', label: 'Al día' },
  { id: 'bajas', label: 'Bajas' },
]

/* A qué filtro va cada situación. "En gracia" se ve con los que van a vencer:
   aún no paga recargo, pero hay que avisarle. */
const GRUPO = {
  atrasado: 'atrasados',
  gracia: 'por-vencer',
  'por-vencer': 'por-vencer',
  'al-dia': 'al-dia',
  baja: 'bajas',
}

/* Lo urgente arriba: atrasados (los más viejos primero), los que vencen,
   las solicitudes, los que están al día y al final las bajas. */
const ORDEN = { atrasado: 0, gracia: 1, 'por-vencer': 2, solicitud: 3, 'al-dia': 4, baja: 5 }

const VACIO = {
  todos: 'Todavía no tienes clientes.',
  atrasados: 'Nadie va atrasado. Todos al día.',
  'por-vencer': 'Nadie tiene que pagar en los próximos días.',
  'al-dia': 'Nadie está al día ahora mismo.',
  bajas: 'Nadie se ha dado de baja.',
}

function nombreCorto(nombre) {
  const partes = String(nombre || '').trim().split(/\s+/)
  return partes.length > 1 ? `${partes[0]} ${partes.at(-1).charAt(0)}.` : partes[0]
}

function NegocioSuscripcion({ idLocal, ahora, cabeceraExtra }) {
  const [local, setLocal] = useState(() => getLocalById(idLocal))
  const [socios, setSocios] = useState(() => {
    const inicial = getLocalById(idLocal)
    /* Un local recién creado empieza sin socios de mentira. */
    return inicial?.propio ? [] : sociosDemo(inicial, ahora)
  })
  const [filtro, setFiltro] = useState('todos')
  const [modal, setModal] = useState(null)
  const [modalAbierto, setModalAbierto] = useState(false)
  const [aviso, setAviso] = useState(null)

  useEffect(() => {
    if (!aviso) return undefined
    const t = setTimeout(() => setAviso(null), 2600)
    return () => clearTimeout(t)
  }, [aviso])

  const conSituacion = useMemo(
    () =>
      socios
        .map((s) => ({ socio: s, situacion: situacionSocio(s, local, ahora) }))
        .sort((a, b) => {
          const orden = ORDEN[a.situacion.clave] - ORDEN[b.situacion.clave]
          if (orden) return orden
          return (a.situacion.dias ?? 0) - (b.situacion.dias ?? 0)
        }),
    [socios, local, ahora],
  )

  const cuenta = (clave) => conSituacion.filter((x) => x.situacion.clave === clave)
  const atrasados = cuenta('atrasado')
  const enGracia = cuenta('gracia')
  const porVencer = cuenta('por-vencer')
  const alDia = cuenta('al-dia')
  const solicitudes = cuenta('solicitud')
  const activos = conSituacion.filter((x) => x.socio.estado === 'activo')

  /* Próximo cobro: el pago más cercano de hoy en adelante. */
  const proximos = activos.filter((x) => x.situacion.dias >= 0)
  const primero = proximos.sort((a, b) => a.situacion.dias - b.situacion.dias)[0]
  const mismoDia = primero ? proximos.filter((x) => x.situacion.dias === primero.situacion.dias) : []
  const proximo = primero
    ? {
        dias: primero.situacion.dias,
        nombre: nombreCorto(primero.socio.nombre),
        mas: mismoDia.length - 1,
        monto: mismoDia.reduce((t, x) => t + x.situacion.total, 0),
      }
    : null

  /* Este mes: lo que ya entró y lo que debería entrar (lo cobrado más las
     cuotas que vencen este mes o ya vencieron, con su recargo). */
  const cobrado = socios
    .flatMap((s) => s.pagos ?? [])
    .filter((p) => isSameMonth(parseISO(p.fecha), ahora))
    .reduce((t, p) => t + (p.monto || 0) + (p.recargo || 0), 0)
  const pendienteMes = activos
    .filter((x) => x.situacion.dias < 0 || isSameMonth(parseISO(x.socio.proximoPago), ahora))
    .reduce((t, x) => t + x.situacion.total, 0)
  const deudaAtrasados = atrasados.reduce((t, x) => t + x.situacion.total, 0)

  const opcionesFiltro = FILTROS.map((f) => ({
    ...f,
    cantidad: f.id === 'todos' ? activos.length : conSituacion.filter((x) => GRUPO[x.situacion.clave] === f.id).length,
  })).filter((f) => f.id === 'todos' || f.cantidad > 0 || f.id === filtro)
  const visibles =
    filtro === 'todos'
      ? conSituacion.filter((x) => x.socio.estado === 'activo')
      : conSituacion.filter((x) => GRUPO[x.situacion.clave] === filtro)

  /* Turnos: los del día con cuánta gente tiene cada uno. */
  const configTurnos = useMemo(() => turnosDe(local), [local])
  const turnos = useMemo(() => {
    if (!configTurnos.activo) return []
    const lista = listaTurnos(local, configTurnos)
    const { cuenta, pedidos } = ocupacionTurnos(lista, socios)
    return lista.map((t) => ({ ...t, ocupados: cuenta[t.id], pedidos: pedidos[t.id] }))
  }, [local, configTurnos, socios])
  const conTurnos = turnos.length > 0

  const sociosPorPlan = activos.reduce((acc, x) => ({ ...acc, [x.socio.planId]: (acc[x.socio.planId] ?? 0) + 1 }), {})

  const notaLocal = useMemo(() => notaDeComentarios(local), [local])
  const fotos = useMemo(() => fotosDe(local), [local])

  const abrirModal = (tipo, extra) => {
    setModal({ tipo, ...extra })
    setModalAbierto(true)
  }
  const cerrarModal = useCallback(() => setModalAbierto(false), [])

  const guardarFicha = (cambios) => {
    const guardado = saveFicha(idLocal, cambios)
    if (guardado) setLocal((prev) => ({ ...prev, ...cambios }))
    return guardado
  }
  const actualizar = (id, cambios) => setSocios((prev) => prev.map((s) => (s.id === id ? { ...s, ...cambios } : s)))
  const hoyIso = format(ahora, 'yyyy-MM-dd')

  const cobrar = ({ socio, situacion }) => {
    actualizar(socio.id, {
      proximoPago: format(sumarPeriodo(socio.proximoPago, situacion.plan?.periodo), 'yyyy-MM-dd'),
      pagos: [...(socio.pagos ?? []), { fecha: hoyIso, monto: situacion.cuota, recargo: situacion.recargo }],
    })
    setAviso(`Cobrado: ${situacion.total} CUP de ${socio.nombre.split(' ')[0]}`)
  }
  const aceptar = ({ socio }) => {
    /* Entra con el pago para hoy: el primer mes se paga en el local. */
    actualizar(socio.id, { estado: 'activo', desde: hoyIso, proximoPago: hoyIso })
    actualizarSuscripcion(socio.id, { estado: 1 })
    setAviso(`${socio.nombre.split(' ')[0]} ya es cliente`)
  }
  const rechazar = ({ socio }) => {
    setSocios((prev) => prev.filter((s) => s.id !== socio.id))
    actualizarSuscripcion(socio.id, { estado: 3 })
    setAviso(`Solicitud de ${socio.nombre.split(' ')[0]} rechazada`)
  }
  const mover = (socio, turnoId) => {
    const origen = turnoDeSocio(turnos, socio)
    const destino = turnos.find((t) => t.id === turnoId)
    actualizar(socio.id, { turno: turnoId })
    /* Si es una suscripción de esta cuenta, le llega el aviso en Mis citas. */
    actualizarSuscripcion(socio.id, {
      turno: turnoId,
      turnoTexto: destino?.texto ?? turnoId,
      ...(socio.estado === 'activo' && origen
        ? { avisoTurno: { de: origen.texto, a: destino?.texto ?? turnoId, en: new Date().toISOString() } }
        : {}),
    })
    setAviso(`${socio.nombre.split(' ')[0]} pasa al turno de ${destino?.texto ?? turnoId}`)
  }
  /* Turno lleno: se le propone otro y decide él. null retira la propuesta. */
  const proponer = (socio, turnoId) => {
    const destino = turnos.find((t) => t.id === turnoId)
    const pedido = turnoDeSocio(turnos, socio)
    const propuesta = turnoId ? { turno: turnoId, texto: destino?.texto ?? turnoId } : null
    actualizar(socio.id, { propuesta })
    actualizarSuscripcion(socio.id, {
      propuesta: propuesta ? { ...propuesta, pedidoTexto: pedido?.texto ?? null, en: new Date().toISOString() } : null,
    })
    setAviso(turnoId ? `Propuesta enviada a ${socio.nombre.split(' ')[0]}` : 'Propuesta retirada')
  }
  /* Dijo que sí (por WhatsApp o en la tienda): su solicitud pasa a ese turno. */
  const confirmarPropuesta = (socio) => {
    const p = socio.propuesta
    if (!p) return
    actualizar(socio.id, { turno: p.turno, propuesta: null })
    actualizarSuscripcion(socio.id, { turno: p.turno, turnoTexto: p.texto, propuesta: null })
    setAviso(`${socio.nombre.split(' ')[0]} pide ahora el turno de ${p.texto}`)
  }
  const guardarTurnos = (cambios) => {
    guardarFicha({ turnos: { ...configTurnos, ...cambios } })
  }
  const cupoTurno = (id, n) => {
    const cupos = { ...configTurnos.cupos }
    if (n === configTurnos.cupo) delete cupos[id]
    else cupos[id] = n
    guardarTurnos({ cupos })
  }
  const cambiarFecha = (socio, iso) => {
    actualizar(socio.id, { proximoPago: iso })
    setAviso(`${socio.nombre.split(' ')[0]} paga ahora el ${fechaCorta(iso)}`)
  }

  /* PDF con todos: los que pagan (lo urgente arriba), las solicitudes y las bajas. */
  const exportarPdf = () => {
    const filas = conSituacion.map(({ socio, situacion }) => {
      const turno = turnoDeSocio(turnos, socio)
      const activo = socio.estado === 'activo'
      return {
        nombre: socio.nombre,
        telefono: socio.telefono,
        plan: situacion.plan?.nombre ?? '—',
        turno: turno?.texto ?? '—',
        desde: activo || socio.estado === 'baja' ? fechaCorta(socio.desde) : 'Pendiente',
        proximo: activo ? fechaCorta(socio.proximoPago) : '—',
        estado: activo ? `${ETIQUETA_SITUACION[situacion.clave]} · ${textoSituacion(situacion)}` : ETIQUETA_SITUACION[situacion.clave],
        /* Al día: nada que cobrar todavía. Por vencer o atrasado: lo que toca, con recargo. */
        debe: activo && situacion.clave !== 'al-dia' ? `${situacion.total}` : '—',
      }
    })
    const bajas = conSituacion.filter((x) => x.socio.estado === 'baja').length
    descargarPdfSocios({
      localNombre: local.localName,
      fechaTexto: format(ahora, "EEEE d 'de' MMMM yyyy", { locale: es }),
      conTurnos,
      resumen: [
        `${activos.length} pagando`,
        `${alDia.length} al día`,
        enGracia.length + porVencer.length && `${enGracia.length + porVencer.length} por vencer`,
        atrasados.length && `${atrasados.length} atrasados (deben ${deudaAtrasados} CUP)`,
        solicitudes.length && `${solicitudes.length} quieren unirse`,
        bajas && `${bajas} de baja`,
      ]
        .filter(Boolean)
        .join(' · '),
      pie: `Cobrado este mes: ${cobrado} CUP · esperado: ${cobrado + pendienteMes} CUP`,
      filas,
    })
  }

  const ficha = (
    <FichaLocal
      local={local}
      onEditar={(seccion) => abrirModal('editar', { seccion })}
      onOpiniones={() => abrirModal('opiniones')}
      onCatalogo={(tipo) => abrirModal(tipo)}
    />
  )
  const configModal = MODALES[modal?.tipo] ?? {}

  return (
    <>
      <div className="negocio-tablero">
        {cabeceraExtra}
        <CabeceraNegocio
          nombre={local.localName}
          url={local.url}
          categoria={local.categoria}
          nota={notaLocal.nota}
          opiniones={notaLocal.cantidad}
          fotos={fotos}
          abreHoy={local.dias.includes(codigoDia(ahora))}
          recibiendo
          apertura={local.horarioApertura}
          cierre={local.horarioCierre}
          ahora={ahora}
          onGaleria={() => abrirModal('galeria')}
          onEditar={() => abrirModal('editar')}
          animacionPausada={modalAbierto}
        />

        <ResumenSocios
          proximo={proximo}
          socios={{
            activos: activos.length,
            alDia: alDia.length,
            segmentos: [
              { id: 'al-dia', cantidad: alDia.length, color: 'var(--primary-color)' },
              { id: 'por-vencer', cantidad: porVencer.length + enGracia.length, color: 'var(--yellow-color)' },
              { id: 'atrasado', cantidad: atrasados.length, color: 'var(--rosa)' },
            ],
          }}
          mes={{ cobrado, esperado: cobrado + pendienteMes }}
          solicitudes={solicitudes.length}
          onProximo={() => abrirModal('cobros')}
          onSocios={() => abrirModal('socios')}
          onMes={() => abrirModal('mes')}
          onNuevoSocio={() => abrirModal('nuevoSocio')}
          onSolicitudes={() => abrirModal('solicitudes')}
        />

        {conTurnos && (
          <TurnosSocios
            turnos={turnos}
            duracion={configTurnos.duracion}
            onTurno={(id) => abrirModal('turno', { id })}
            onAjustes={() => abrirModal('turnos')}
          />
        )}

        <div className="negocio-citas">
          <header className="negocio-citas-encabezado">
            <div>
              <h2 className="negocio-citas-titulo">Tus clientes</h2>
              <p className="negocio-citas-fecha">
                <span>{format(ahora, "EEEE d 'de' MMMM", { locale: es })}</span>
              </p>
            </div>
            <div className="negocio-citas-acciones">
              <p className="negocio-citas-contador">
                <strong>{activos.length}</strong> pagando
              </p>
              <button
                type="button"
                className="negocio-citas-pdf"
                onClick={exportarPdf}
                disabled={!socios.length}
                aria-label="Descargar la lista de clientes en PDF"
              >
                <FileDown size={16} strokeWidth={2.25} aria-hidden="true" />
                PDF
              </button>
            </div>
          </header>

          {(atrasados.length > 0 || enGracia.length + porVencer.length > 0) && (
            <div className="socios-alertas">
              {atrasados.length > 0 && (
                <button
                  type="button"
                  className="socios-alerta socios-alerta--rosa"
                  aria-pressed={filtro === 'atrasados'}
                  onClick={() => setFiltro('atrasados')}
                >
                  <AlertTriangle size={17} strokeWidth={2.25} aria-hidden="true" />
                  <span>
                    <b>
                      {atrasados.length} {atrasados.length === 1 ? 'se pasó' : 'se pasaron'} de fecha
                    </b>
                    <small>Deben {deudaAtrasados} CUP con el recargo</small>
                  </span>
                </button>
              )}
              {enGracia.length + porVencer.length > 0 && (
                <button
                  type="button"
                  className="socios-alerta socios-alerta--mostaza"
                  aria-pressed={filtro === 'por-vencer'}
                  onClick={() => setFiltro('por-vencer')}
                >
                  <BellRing size={17} strokeWidth={2.25} aria-hidden="true" />
                  <span>
                    <b>
                      {enGracia.length + porVencer.length} {enGracia.length + porVencer.length === 1 ? 'tiene' : 'tienen'} que pagar ya
                    </b>
                    <small>
                      {[
                        porVencer.filter((x) => x.situacion.dias === 0).length &&
                          `${porVencer.filter((x) => x.situacion.dias === 0).length} hoy`,
                        enGracia.length && `${enGracia.length} en días de gracia`,
                      ]
                        .filter(Boolean)
                        .join(' · ') || 'En los próximos días'}
                    </small>
                  </span>
                </button>
              )}
            </div>
          )}

          <FiltroCitas opciones={opcionesFiltro} activo={filtro} onCambiar={setFiltro} />

          <div className="socios-lista">
            {visibles.length === 0 ? (
              <div className="negocio-citas-vacio">
                <span className="negocio-citas-vacio-luna" aria-hidden="true" />
                <p>{VACIO[filtro]}</p>
              </div>
            ) : (
              visibles.map((x) => (
                <SocioDueno
                  key={x.socio.id}
                  socio={x.socio}
                  situacion={x.situacion}
                  local={local}
                  turno={turnoDeSocio(turnos, x.socio)}
                  conTurnos={conTurnos}
                  onCobrar={() => cobrar(x)}
                  onAceptar={() => aceptar(x)}
                  onRechazar={() => rechazar(x)}
                  onCambiarPlan={(planId) => actualizar(x.socio.id, { planId })}
                  onCambiarTurno={() => {
                    const actual = turnoDeSocio(turnos, x.socio) ?? turnos[0]
                    abrirModal('turno', { id: actual.id, moviendo: x.socio.id })
                  }}
                  onCambiarFecha={(iso) => cambiarFecha(x.socio, iso)}
                  onBaja={() => actualizar(x.socio.id, { estado: 'baja' })}
                />
              ))
            )}
          </div>
        </div>

        {ficha}
      </div>

      <ModalNegocioShell
        abierto={modalAbierto}
        titulo={modal?.titulo ?? configModal.titulo}
        subtitulo={configModal.subtitulo}
        tono={configModal.tono}
        Icono={configModal.Icono}
        vista={`${modal?.tipo}-${modal?.id ?? modal?.seccion ?? ''}`}
        onCerrar={cerrarModal}
      >
        {MODALES_FICHA.has(modal?.tipo) ? (
          <ContenidoFichaLocal
            modal={modal}
            local={local}
            onPortada={(foto) => guardarFicha({ url: foto, urls: fotos })}
            onAgregarFotos={(nuevas) => guardarFicha({ urls: [...fotos, ...nuevas], url: local.url || nuevas[0] })}
            onQuitarFoto={(foto) => {
              const urls = fotos.filter((f) => f !== foto)
              return guardarFicha({ urls, url: foto === local.url ? urls[0] : local.url })
            }}
            onGuardar={(cambios) => {
              guardarFicha(cambios)
              cerrarModal()
            }}
          />
        ) : MODALES_SOCIOS.has(modal?.tipo) ? (
          <ContenidoSocios
            modal={modal}
            local={local}
            lista={conSituacion}
            turnos={turnos}
            configTurnos={configTurnos}
            ahora={ahora}
            onNavegar={setModal}
            onCobrar={cobrar}
            onAceptar={aceptar}
            onRechazar={rechazar}
            onMover={mover}
            onProponer={proponer}
            onConfirmarPropuesta={confirmarPropuesta}
            onCupoTurno={cupoTurno}
            onGuardar={(cambios) => {
              guardarFicha(cambios)
              setAviso('Turnos guardados')
              cerrarModal()
            }}
          />
        ) : (
          <ContenidoPlanes
            modal={modal}
            local={local}
            hoy={ahora}
            turnos={turnos}
            sociosPorPlan={sociosPorPlan}
            onNavegar={setModal}
            onGuardar={(cambios, siguiente) => {
              guardarFicha(cambios)
              if (siguiente) setModal(siguiente)
              else cerrarModal()
            }}
            onAgregarSocio={(socio) => {
              setSocios((prev) => [socio, ...prev])
              setFiltro('todos')
              setAviso(`${socio.nombre.split(' ')[0]} apuntado`)
              cerrarModal()
            }}
          />
        )}
      </ModalNegocioShell>

      <AvisoBreve texto={aviso} />
    </>
  )
}

export default NegocioSuscripcion
