import { useMemo, useReducer, useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  Copy,
  Link2,
  Minus,
  Plus,
  Redo2,
  RotateCw,
  Trash2,
  Undo2,
} from 'lucide-react'
import Asistente from '../../components/NuevoLocal/Asistente.jsx'
import TalyMomento from '../../components/Taly/TalyMomento.jsx'
import { getLocalById } from '../../services/locales.js'
import { getMiLocal } from '../../services/misLocales.js'
import { useCitas } from '../../hooks/useCitas.js'
import { reservasMesaDemo } from '../../data/reservasMesaDemo.js'
import Lienzo from './Lienzo.jsx'
import { IconoPieza } from '../Piezas.jsx'
import Plano from '../Plano.jsx'
import VisorPlano, { PestanasPisos } from '../VisorPlano.jsx'
import {
  CATALOGO,
  FORMAS,
  LIMITES,
  NOMBRES_PISO,
  NOMBRES_ZONA,
  NOMBRE_LADO,
  RASGOS,
  TAMANOS,
  capDeJunta,
  crearPieza,
  esMesa,
  huecoLibre,
  mesasDe,
  nuevoId,
  parejasCercanas,
  reubicar,
  textoLimpio,
  validarPlano,
} from '../modelo.js'
import { PLANTILLAS, crearPlantilla } from '../plantillas.js'
import { borrarBorrador, guardarBorrador, guardarPlano, leerBorrador, planoDeLocal, tienePlanoPropio } from '../local.js'
import { mesasDeReserva } from '../reserva.js'
import { problemasDelPlano } from './problemas.js'
import './editor.css'

/* El editor de la sala. A pantalla completa, un paso cada vez y con Taly
   explicando qué se hace en cada uno. Pensado para alguien que nunca ha
   dibujado un plano:

     Empezar  → una sala parecida a la tuya (o la que ya tienes)
     Tu local → tamaño (pequeño, mediano, grande), forma y pisos
     Lo fijo  → entrada, barra, baños, cocina, zonas…
     Mesas    → colocar mesas y decir cuántas personas caben
     Juntar   → qué mesas se unen para grupos
     Revisar  → lo que falta, y cómo lo verá el cliente

   Nada de dibujo libre: piezas de un catálogo, en casillas de 25 cm. El
   plano pasa por validarPlano() al cargar y al guardar. */

const FIJAS = ['entrada', 'barra', 'banos', 'cocina', 'caja', 'escalera', 'escenario', 'ventana', 'tabique', 'planta', 'rampa', 'zona']
const MESAS = ['mesa-redonda', 'mesa-cuadrada', 'mesa-rect', 'sofa', 'taburetes']
const HISTORIAL = 60

/* ---------- historial (deshacer / rehacer) ---------- */

function reductor(estado, accion) {
  switch (accion.tipo) {
    case 'aplicar': {
      const siguiente = validarPlano(accion.plano)
      if (!siguiente) return estado
      return { plano: siguiente, pasado: [...estado.pasado, estado.plano].slice(-HISTORIAL), futuro: [] }
    }
    case 'deshacer':
      if (!estado.pasado.length) return estado
      return { plano: estado.pasado.at(-1), pasado: estado.pasado.slice(0, -1), futuro: [estado.plano, ...estado.futuro] }
    case 'rehacer':
      if (!estado.futuro.length) return estado
      return { plano: estado.futuro[0], pasado: [...estado.pasado, estado.plano], futuro: estado.futuro.slice(1) }
    default:
      return estado
  }
}

/* ---------- piezas pequeñas ---------- */

/* Campo de texto que se guarda al salir (o con Intro), no en cada tecla:
   así se puede borrar entero para reescribirlo y no llena el historial. */
function CampoTexto({ etiqueta, valor, max, onCambiar }) {
  const [texto, setTexto] = useState(valor)
  const confirmar = () => {
    const limpio = textoLimpio(texto, max)
    if (limpio && limpio !== valor) onCambiar(limpio)
    else setTexto(valor)
  }
  return (
    <label className="ed-campo">
      <span>{etiqueta}</span>
      <input
        value={texto}
        maxLength={max}
        onChange={(e) => setTexto(e.target.value)}
        onBlur={confirmar}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault()
            confirmar()
          }
        }}
      />
    </label>
  )
}

function Paso({ etiqueta, valor, min, max, onCambiar, texto }) {
  return (
    <div className="ed-paso">
      <span className="ed-paso-etiqueta">{etiqueta}</span>
      <div className="ed-paso-control">
        <button type="button" aria-label={`${etiqueta}: menos`} disabled={valor <= min} onClick={() => onCambiar(valor - 1)}>
          <Minus size={16} strokeWidth={2.5} aria-hidden="true" />
        </button>
        <output aria-live="polite">{texto ?? valor}</output>
        <button type="button" aria-label={`${etiqueta}: más`} disabled={valor >= max} onClick={() => onCambiar(valor + 1)}>
          <Plus size={16} strokeWidth={2.5} aria-hidden="true" />
        </button>
      </div>
    </div>
  )
}

function Paleta({ tipos, onAnadir, plano }) {
  const visibles = tipos.filter((t) => t !== 'escalera' || plano.pisos.length > 1)
  return (
    <div className="ed-paleta" role="group" aria-label="Piezas para añadir">
      {visibles.map((t) => (
        <button key={t} type="button" className="ed-paleta-pieza" onClick={() => onAnadir(t)}>
          <span className="ed-paleta-icono" aria-hidden="true">
            <IconoPieza tipo={t} />
          </span>
          <span>{CATALOGO[t].nombre}</span>
        </button>
      ))}
    </div>
  )
}

/* ---------- herramientas de la pieza elegida ---------- */

function Herramientas({ pieza, onCambiar, onMover, onGirar, onDuplicar, onQuitar, aviso }) {
  const def = CATALOGO[pieza.tipo]
  const fijo = Boolean(def.alto)
  const cuadrada = Boolean(def.cuadrada)
  const ancho = (w) => onCambiar({ w, h: cuadrada ? w : pieza.h })

  return (
    <div className="ed-herramientas" aria-label={`Herramientas de ${esMesa(pieza) || pieza.tipo === 'zona' ? pieza.nombre : def.nombre}`}>
      <p className="ed-herramientas-titulo">
        {esMesa(pieza) || pieza.tipo === 'zona' ? pieza.nombre : def.nombre}
        <small>{def.nombre !== pieza.nombre && (esMesa(pieza) || pieza.tipo === 'zona') ? ` · ${def.nombre}` : ''}</small>
      </p>
      <div className="ed-herramientas-fila">
        <Paso etiqueta={cuadrada ? 'Tamaño' : 'Largo'} valor={pieza.w} min={def.min} max={def.max} onCambiar={ancho} texto={`${(pieza.w * 0.25).toFixed(2).replace(/\.?0+$/, '')} m`} />
        {!fijo && !cuadrada && (
          <Paso etiqueta="Ancho" valor={pieza.h} min={def.min} max={def.max} onCambiar={(h) => onCambiar({ h })} texto={`${(pieza.h * 0.25).toFixed(2).replace(/\.?0+$/, '')} m`} />
        )}
      </div>
      <div className="ed-herramientas-fila ed-herramientas-fila--botones">
        {pieza.tipo !== 'zona' && (
          <button type="button" className="ed-boton" onClick={onGirar}>
            <RotateCw size={16} strokeWidth={2.3} aria-hidden="true" />
            Girar
          </button>
        )}
        <button type="button" className="ed-boton" onClick={onDuplicar}>
          <Copy size={16} strokeWidth={2.3} aria-hidden="true" />
          Duplicar
        </button>
        <button type="button" className="ed-boton ed-boton--peligro" onClick={onQuitar}>
          <Trash2 size={16} strokeWidth={2.3} aria-hidden="true" />
          Quitar
        </button>
        <div className="ed-cruceta" role="group" aria-label="Mover una casilla">
          <button type="button" aria-label="Mover a la izquierda" onClick={() => onMover(-1, 0)}>
            <ArrowLeft size={15} strokeWidth={2.4} aria-hidden="true" />
          </button>
          <button type="button" aria-label="Mover arriba" onClick={() => onMover(0, -1)}>
            <ArrowUp size={15} strokeWidth={2.4} aria-hidden="true" />
          </button>
          <button type="button" aria-label="Mover abajo" onClick={() => onMover(0, 1)}>
            <ArrowDown size={15} strokeWidth={2.4} aria-hidden="true" />
          </button>
          <button type="button" aria-label="Mover a la derecha" onClick={() => onMover(1, 0)}>
            <ArrowRight size={15} strokeWidth={2.4} aria-hidden="true" />
          </button>
        </div>
      </div>
      {aviso && (
        <p className="ed-aviso" role="alert">
          {aviso}
        </p>
      )}

      {esMesa(pieza) && <DatosMesa pieza={pieza} onCambiar={onCambiar} />}
      {pieza.tipo === 'zona' && <DatosZona pieza={pieza} onCambiar={onCambiar} />}
    </div>
  )
}

function DatosMesa({ pieza, onCambiar }) {
  const { min, normal, max } = pieza.cap
  const tope = max ?? normal
  const cap = (c) => onCambiar({ cap: c })
  return (
    <div className="ed-datos">
      <CampoTexto etiqueta="Nombre" valor={pieza.nombre} max={LIMITES.nombre} onCambiar={(nombre) => onCambiar({ nombre })} />
      <Paso
        etiqueta="Cómoda"
        valor={normal}
        min={1}
        max={LIMITES.capacidad}
        texto={`${normal} ${normal === 1 ? 'persona' : 'personas'}`}
        onCambiar={(n) => cap({ min: Math.min(min, n), normal: n, max: max != null ? Math.max(max, n) : null })}
      />
      <Paso etiqueta="Mínimo" valor={min} min={1} max={normal} onCambiar={(n) => cap({ min: n, normal, max })} />
      <Paso
        etiqueta="Apretados"
        valor={tope}
        min={normal}
        max={LIMITES.capacidad}
        texto={tope > normal ? `hasta ${tope}` : 'no'}
        onCambiar={(n) => cap({ min, normal, max: n > normal ? n : null })}
      />
      <div className="ed-segmentado" role="group" aria-label="Quién la puede coger">
        <button type="button" aria-pressed={pieza.online} onClick={() => onCambiar({ online: true })}>
          Se reserva por Citaly
        </button>
        <button type="button" aria-pressed={!pieza.online} onClick={() => onCambiar({ online: false })}>
          Solo en el local
        </button>
      </div>
      <div className="ed-chips" role="group" aria-label="Cómo es la mesa">
        {RASGOS.map((r) => {
          const tiene = pieza.rasgos.includes(r.id)
          return (
            <button
              key={r.id}
              type="button"
              aria-pressed={tiene}
              onClick={() => onCambiar({ rasgos: tiene ? pieza.rasgos.filter((x) => x !== r.id) : [...pieza.rasgos, r.id] })}
            >
              {r.nombre}
            </button>
          )
        })}
      </div>
    </div>
  )
}

function DatosZona({ pieza, onCambiar }) {
  return (
    <div className="ed-datos">
      <CampoTexto key={pieza.nombre} etiqueta="Nombre de la zona" valor={pieza.nombre} max={LIMITES.nombre} onCambiar={(nombre) => onCambiar({ nombre })} />
      <div className="ed-chips" role="group" aria-label="Nombres habituales">
        {NOMBRES_ZONA.map((n) => (
          <button key={n} type="button" aria-pressed={pieza.nombre === n} onClick={() => onCambiar({ nombre: n })}>
            {n}
          </button>
        ))}
      </div>
      <p className="ed-nota">Las mesas que pongas dentro dicen que están en «{pieza.nombre}».</p>
    </div>
  )
}

/* ---------- la página ---------- */

export default function EditorPlano() {
  const { id } = useParams()
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const local = getLocalById(id)
  const { citas } = useCitas()
  const volverA = params.get('volver') === 'completar' ? `/negocio/completar/${id}` : '/negocio'

  const [borrador] = useState(() => (local ? leerBorrador(id) : null))
  const conPlano = local ? tienePlanoPropio(local) : false
  const inicial = useMemo(() => borrador?.plano ?? (local ? planoDeLocal(local) : null), [borrador, local])
  const [estado, despachar] = useReducer(reductor, { plano: inicial, pasado: [], futuro: [] })
  const [usaBorrador, setUsaBorrador] = useState(Boolean(borrador))

  const pasos = useMemo(
    () => (conPlano ? ['Tu local', 'Lo fijo', 'Mesas', 'Juntar', 'Revisar'] : ['Empezar', 'Tu local', 'Lo fijo', 'Mesas', 'Juntar', 'Revisar']),
    [conPlano],
  )
  const [paso, setPaso] = useState(0)
  const nombrePaso = pasos[paso]

  const [piso, setPiso] = useState('p0')
  const [activa, setActiva] = useState(null)
  const [aviso, setAviso] = useState(null)
  const [paraJuntar, setParaJuntar] = useState([])
  const [vez, setVez] = useState(0)
  const [anuncio, setAnuncio] = useState('')
  const [plantilla, setPlantilla] = useState(borrador || conPlano ? 'actual' : null)

  /* Mesas con reservas próximas: no se pueden quitar (ni perderse al
     cambiar de plantilla). Reservas del local + las del propio usuario. */
  const protegidas = useMemo(() => {
    if (!local) return new Map()
    const hoy = new Date().toISOString().slice(0, 10)
    const cuentas = new Map()
    /* Las reservas de ejemplo van sobre el plano de ejemplo: un local que aún
       no ha dibujado su sala no tiene nada que proteger. */
    const demo = tienePlanoPropio(local) || !getMiLocal(id) ? reservasMesaDemo(local) : []
    for (const r of [...demo, ...citas.filter((c) => c.localId === id)]) {
      if (r.estadoReserva === 3 || !r.fecha || r.fecha < hoy) continue
      for (const m of mesasDeReserva(r)) cuentas.set(m, (cuentas.get(m) ?? 0) + 1)
    }
    return cuentas
  }, [local, citas, id])

  if (!local || !local.lugar) {
    return (
      <section className="editor-plano editor-plano--centrado">
        <TalyMomento
          escena="loader"
          pose="busca"
          titulo="Este local no reserva mesas"
          texto="El plano de sala es para locales de mesas (restaurantes, cafeterías, bares…)."
          accion="Volver a Mi Negocio"
          onAccion={() => navigate('/negocio')}
        />
      </section>
    )
  }

  const plano = estado.plano
  const pisoActual = plano.pisos.some((p) => p.id === piso) ? piso : plano.pisos[0].id
  const piezaActiva = plano.piezas.find((p) => p.id === activa && p.piso === pisoActual) ?? null
  const problemas = problemasDelPlano(plano)
  const marcadas = new Set(problemas.flatMap((p) => p.ids))
  const bloquean = problemas.filter((p) => p.bloquea)

  const aplicar = (nuevo, texto) => {
    despachar({ tipo: 'aplicar', plano: nuevo })
    guardarBorrador(id, validarPlano(nuevo))
    setUsaBorrador(true)
    if (texto) setAnuncio(texto)
  }
  const cambiarPieza = (pid, cambios) =>
    aplicar({ ...plano, piezas: plano.piezas.map((p) => (p.id === pid ? { ...p, ...cambios } : p)) })

  const anadir = (tipo) => {
    const nueva = huecoLibre(plano, crearPieza(plano, tipo, pisoActual))
    aplicar({ ...plano, piezas: [...plano.piezas, nueva] }, `Añadida: ${esMesa(nueva) || tipo === 'zona' ? nueva.nombre : CATALOGO[tipo].nombre}`)
    setActiva(nueva.id)
    setAviso(null)
  }

  const quitar = (pid) => {
    const pieza = plano.piezas.find((p) => p.id === pid)
    if (!pieza) return
    const reservas = protegidas.get(pid) ?? 0
    if (reservas) {
      setAviso(`${pieza.nombre} tiene ${reservas} ${reservas === 1 ? 'reserva próxima' : 'reservas próximas'}. Cancélalas o muévelas antes de quitarla.`)
      return
    }
    aplicar(
      {
        ...plano,
        piezas: plano.piezas.filter((p) => p.id !== pid),
        juntas: plano.juntas.map((j) => ({ ...j, mesas: j.mesas.filter((m) => m !== pid) })),
      },
      'Pieza quitada',
    )
    setActiva(null)
    setAviso(null)
  }

  const girar = (pid) => {
    const pieza = plano.piezas.find((p) => p.id === pid)
    if (!pieza || pieza.tipo === 'zona') return
    const paso45 = esMesa(pieza) ? 45 : 90
    cambiarPieza(pid, { rot: (pieza.rot + paso45) % 360 })
  }

  const duplicar = (pid) => {
    const pieza = plano.piezas.find((p) => p.id === pid)
    if (!pieza) return
    const copia = { ...pieza, id: nuevoId(esMesa(pieza) ? 'mesa' : 'p') }
    if (esMesa(pieza)) Object.assign(copia, { nombre: crearPieza(plano, pieza.tipo, pieza.piso).nombre, rasgos: [...pieza.rasgos] })
    const colocada = huecoLibre(plano, copia)
    aplicar({ ...plano, piezas: [...plano.piezas, colocada] }, 'Pieza duplicada')
    setActiva(colocada.id)
  }

  const moverPaso = (dx, dy) => piezaActiva && cambiarPieza(piezaActiva.id, { x: piezaActiva.x + dx, y: piezaActiva.y + dy })

  /* ---------- pasos ---------- */

  const elegirPlantilla = (pid) => {
    setPlantilla(pid)
    aplicar(pid === 'actual' ? (borrador?.plano ?? planoDeLocal(local)) : crearPlantilla(pid), pid === 'actual' ? 'Tu sala de antes' : 'Plantilla puesta')
    setActiva(null)
  }
  const hayProtegidas = mesasDe(plano).some((m) => protegidas.get(m.id))

  const cambiarPisos = (n) => {
    const actuales = plano.pisos
    if (n < actuales.length) {
      const fuera = actuales.slice(n).map((p) => p.id)
      const conMesas = plano.piezas.some((p) => fuera.includes(p.piso) && protegidas.get(p.id))
      if (conMesas) {
        setAviso('Ese piso tiene mesas con reservas próximas: no se puede quitar todavía.')
        return
      }
      aplicar({ ...plano, pisos: actuales.slice(0, n), piezas: plano.piezas.filter((p) => !fuera.includes(p.piso)) })
    } else {
      const nuevos = Array.from({ length: n - actuales.length }, (_, i) => {
        const k = actuales.length + i
        return { id: `p${k}-${nuevoId('').slice(2)}`, nombre: NOMBRES_PISO[k] ?? `Piso ${k + 1}` }
      })
      aplicar({ ...plano, pisos: [...actuales, ...nuevos] })
    }
    setAviso(null)
  }

  const crearJunta = (ids) => {
    const siguiente = { ...plano, juntas: [...plano.juntas, { id: nuevoId('junta'), mesas: ids, cap: capDeJunta(plano, ids) }] }
    aplicar(siguiente, 'Mesas juntadas')
    setParaJuntar([])
  }

  const tocarParaJuntar = (mid) => {
    setAviso(null)
    setParaJuntar((lista) => {
      if (lista.includes(mid)) return lista.filter((x) => x !== mid)
      const mesa = plano.piezas.find((p) => p.id === mid)
      const otra = plano.piezas.find((p) => p.id === lista[0])
      if (otra && otra.piso !== mesa.piso) {
        setAviso('Solo se pueden juntar mesas del mismo piso.')
        return lista
      }
      return lista.length >= LIMITES.mesasPorJunta ? lista : [...lista, mid]
    })
  }

  const seguir = () => {
    if (nombrePaso === 'Empezar' && !plantilla) {
      setVez((v) => v + 1)
      return
    }
    if (nombrePaso === 'Revisar') {
      if (bloquean.length) {
        setVez((v) => v + 1)
        return
      }
      if (!guardarPlano(id, plano)) {
        setAviso('El navegador no tiene sitio para guardarlo. Libera espacio y vuelve a probar.')
        return
      }
      borrarBorrador(id)
      navigate(volverA)
      return
    }
    setActiva(null)
    setAviso(null)
    setPaso((p) => Math.min(p + 1, pasos.length - 1))
  }

  const atras =
    paso > 0
      ? () => {
          setActiva(null)
          setAviso(null)
          setPaso((p) => p - 1)
        }
      : undefined

  const descartarBorrador = () => {
    borrarBorrador(id)
    despachar({ tipo: 'aplicar', plano: planoDeLocal(local) })
    setUsaBorrador(false)
  }

  /* ---------- lo que dice Taly ---------- */

  const TALY = {
    Empezar: { tono: 'consejo', texto: 'Elige la sala que más se parezca a la tuya. Luego cambias todo lo que quieras.' },
    'Tu local': { tono: 'consejo', texto: 'El tamaño elígelo por cuántas mesas tienes, no por los metros. Lo rayado no es local.' },
    'Lo fijo': { tono: 'consejo', texto: 'Empieza por la entrada: así tus clientes se ubican al mirar el plano. Con «Zona» marcas la terraza o el salón.' },
    Mesas: { tono: 'consejo', texto: 'Toca una mesa para elegirla y arrástrala a su sitio. Cada silla dibujada es una persona; abajo cambias cuántas caben.' },
    Juntar: { tono: 'consejo', texto: 'Si dos mesas se suelen juntar para grupos, únelas aquí. El cliente las podrá reservar juntas.' },
    Revisar: bloquean.length
      ? { tono: 'error', texto: bloquean[0].texto, vez }
      : { tono: 'bien', texto: '¡Lista! Así la verán tus clientes. Guarda y ya está.' },
  }
  /* Una pieza fuera del local o encima de otra se avisa en cuanto pasa, no al
     final: lo marcado en rosa es lo que hay que mover. */
  const deUna = ['Tu local', 'Lo fijo', 'Mesas'].includes(nombrePaso) ? bloquean.find((p) => /^(fuera|choque)-/.test(p.id)) : null
  const taly =
    nombrePaso === 'Empezar' && !plantilla && vez
      ? { tono: 'error', texto: 'Elige una de las salas para empezar.', vez }
      : deUna
        ? { tono: 'error', texto: `${deUna.texto} Lo marcado en rosa hay que moverlo.` }
        : TALY[nombrePaso]

  const conLienzo = ['Lo fijo', 'Mesas', 'Juntar'].includes(nombrePaso)
  const enJuntar = nombrePaso === 'Juntar'
  const estadosJuntar = enJuntar ? new Map(mesasDe(plano).map((m) => [m.id, m.online ? 'libre' : 'local'])) : undefined
  const sugerencias = enJuntar ? parejasCercanas(plano) : []
  const nombreDe = (mid) => plano.piezas.find((p) => p.id === mid)?.nombre ?? '?'

  return (
    <Asistente
      titulo={`Tu sala · ${local.localName}`}
      pasos={pasos}
      paso={paso}
      onCerrar={() => navigate(volverA)}
      onAtras={atras}
      onSeguir={seguir}
      textoSeguir={nombrePaso === 'Revisar' ? 'Guardar la sala' : 'Siguiente'}
      seguirDeshabilitado={nombrePaso === 'Revisar' && bloquean.length > 0}
      taly={taly}
    >
      <div className="editor-plano">
        <p className="sr-only" aria-live="polite">
          {anuncio}
        </p>

        {usaBorrador && borrador && paso === 0 && (
          <div className="ed-borrador" role="status">
            Seguimos con lo que dejaste a medias.
            <button type="button" onClick={descartarBorrador}>
              Empezar de cero
            </button>
          </div>
        )}

        {nombrePaso === 'Empezar' && (
          <>
            <div className="paso-cabeza">
              <h2 className="paso-titulo" tabIndex={-1}>
                Dibuja tu sala
              </h2>
              <p className="paso-texto">
                Con este plano tus clientes eligen dónde sentarse. Empieza desde la sala que más se parezca a la tuya.
              </p>
            </div>
            {hayProtegidas && (
              <p className="ed-nota ed-nota--aviso">
                Tu plano actual tiene mesas con reservas próximas, así que se parte de él para no perderlas.
              </p>
            )}
            <div className="ed-plantillas" role="radiogroup" aria-label="Sala de partida">
              {borrador && (
                <button
                  type="button"
                  role="radio"
                  aria-checked={plantilla === 'actual'}
                  className="ed-plantilla"
                  onClick={() => elegirPlantilla('actual')}
                >
                  <span className="ed-plantilla-dibujo" aria-hidden="true">
                    <VisorMini plano={borrador.plano} />
                  </span>
                  <strong>La que dejaste a medias</strong>
                  <small>Sigue donde lo dejaste</small>
                </button>
              )}
              {PLANTILLAS.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  role="radio"
                  aria-checked={plantilla === p.id}
                  disabled={hayProtegidas}
                  className="ed-plantilla"
                  onClick={() => elegirPlantilla(p.id)}
                >
                  <span className="ed-plantilla-dibujo" aria-hidden="true">
                    <VisorMini plano={crearPlantilla(p.id)} />
                  </span>
                  <strong>{p.nombre}</strong>
                  <small>{p.texto}</small>
                </button>
              ))}
            </div>
          </>
        )}

        {nombrePaso === 'Tu local' && (
          <>
            <div className="paso-cabeza">
              <h2 className="paso-titulo" tabIndex={-1}>
                Cómo es tu local
              </h2>
              <p className="paso-texto">El tamaño solo da más o menos sitio para poner cosas. El cliente lo ve igual de grande.</p>
            </div>

            <fieldset className="ed-grupo">
              <legend>Tamaño</legend>
              <div className="ed-opciones">
                {Object.values(TAMANOS).map((t) => (
                  <button key={t.id} type="button" aria-pressed={plano.tamano === t.id} className="ed-opcion" onClick={() => aplicar(reubicar({ ...plano, tamano: t.id }))}>
                    <strong>{t.nombre}</strong>
                    <small>{t.ejemplo}</small>
                  </button>
                ))}
              </div>
            </fieldset>

            <fieldset className="ed-grupo">
              <legend>Forma</legend>
              <div className="ed-opciones ed-opciones--formas">
                {Object.values(FORMAS).map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    aria-pressed={plano.forma.tipo === f.id}
                    className="ed-opcion ed-opcion--forma"
                    onClick={() => aplicar(reubicar({ ...plano, forma: { tipo: f.id, lado: f.lados[0] ?? null } }))}
                  >
                    <span className="ed-forma-dibujo" aria-hidden="true">
                      <VisorMini plano={{ ...plano, forma: { tipo: f.id, lado: f.lados[0] ?? null }, piezas: [], juntas: [] }} />
                    </span>
                    <strong>{f.nombre}</strong>
                  </button>
                ))}
              </div>
              {FORMAS[plano.forma.tipo].lados.length > 0 && (
                <div className="ed-chips" role="group" aria-label="Hacia dónde">
                  {FORMAS[plano.forma.tipo].lados.map((l) => (
                    <button key={l} type="button" aria-pressed={plano.forma.lado === l} onClick={() => aplicar(reubicar({ ...plano, forma: { ...plano.forma, lado: l } }))}>
                      {NOMBRE_LADO[l]}
                    </button>
                  ))}
                </div>
              )}
            </fieldset>

            <fieldset className="ed-grupo">
              <legend>Pisos</legend>
              <div className="ed-segmentado" role="group" aria-label="Cuántos pisos">
                {[1, 2, 3].map((n) => (
                  <button key={n} type="button" aria-pressed={plano.pisos.length === n} onClick={() => cambiarPisos(n)}>
                    {n === 1 ? 'Un piso' : `${n} pisos`}
                  </button>
                ))}
              </div>
              {plano.pisos.length > 1 && (
                <div className="ed-pisos-nombres">
                  {plano.pisos.map((p, i) => (
                    <CampoTexto
                      key={p.id}
                      etiqueta={`Piso ${i + 1}`}
                      valor={p.nombre}
                      max={LIMITES.nombrePiso}
                      onCambiar={(nombre) => aplicar({ ...plano, pisos: plano.pisos.map((x) => (x.id === p.id ? { ...x, nombre } : x)) })}
                    />
                  ))}
                  <p className="ed-nota">Todos los pisos tienen la misma forma. Lo que no exista en un piso, déjalo vacío o tápalo con paredes.</p>
                </div>
              )}
              {aviso && (
                <p className="ed-aviso" role="alert">
                  {aviso}
                </p>
              )}
            </fieldset>

            <div className="ed-lienzo-mini" aria-hidden="true">
              <VisorMini plano={plano} />
            </div>
          </>
        )}

        {conLienzo && (
          <>
            <div className="paso-cabeza">
              <h2 className="paso-titulo" tabIndex={-1}>
                {nombrePaso === 'Lo fijo' ? 'Lo que no se mueve' : nombrePaso === 'Mesas' ? 'Tus mesas' : 'Mesas que se juntan'}
              </h2>
              <p className="paso-texto">
                {nombrePaso === 'Lo fijo'
                  ? 'Toca una pieza para añadirla y arrástrala a su sitio. Al soltar se acomoda sola.'
                  : nombrePaso === 'Mesas'
                    ? 'Pon cada mesa donde está de verdad. Las sillas salen solas según las personas.'
                    : 'Toca dos o más mesas que se puedan unir y pulsa «Juntar».'}
              </p>
            </div>

            <div className="ed-barra">
              <PestanasPisos
                plano={plano}
                piso={pisoActual}
                onPiso={(p) => {
                  setPiso(p)
                  setActiva(null)
                }}
              />
              <div className="ed-historial">
                <button type="button" aria-label="Deshacer" disabled={!estado.pasado.length} onClick={() => despachar({ tipo: 'deshacer' })}>
                  <Undo2 size={17} strokeWidth={2.3} aria-hidden="true" />
                </button>
                <button type="button" aria-label="Rehacer" disabled={!estado.futuro.length} onClick={() => despachar({ tipo: 'rehacer' })}>
                  <Redo2 size={17} strokeWidth={2.3} aria-hidden="true" />
                </button>
              </div>
            </div>

            <div className="ed-lienzo">
              <Lienzo
                plano={plano}
                piso={pisoActual}
                activa={enJuntar ? null : activa}
                onActivar={(pid) => {
                  setActiva(pid)
                  setAviso(null)
                }}
                onMover={(pid, x, y) => cambiarPieza(pid, { x, y })}
                onGirar={girar}
                onQuitar={quitar}
                problemas={marcadas}
                modoMesas={enJuntar}
                estados={estadosJuntar}
                elegidas={enJuntar ? paraJuntar : []}
                onMesa={enJuntar ? tocarParaJuntar : undefined}
              />
            </div>

            {!enJuntar && (
              <>
                {piezaActiva ? (
                  <Herramientas
                    key={piezaActiva.id}
                    pieza={piezaActiva}
                    onCambiar={(c) => cambiarPieza(piezaActiva.id, c)}
                    onMover={moverPaso}
                    onGirar={() => girar(piezaActiva.id)}
                    onDuplicar={() => duplicar(piezaActiva.id)}
                    onQuitar={() => quitar(piezaActiva.id)}
                    aviso={aviso}
                  />
                ) : (
                  <p className="ed-nota">Toca una pieza del plano para moverla, girarla o cambiar sus datos.</p>
                )}
                <Paleta tipos={nombrePaso === 'Lo fijo' ? FIJAS : MESAS} onAnadir={anadir} plano={plano} />
              </>
            )}

            {enJuntar && (
              <div className="ed-juntar">
                <button
                  type="button"
                  className="ed-boton ed-boton--principal"
                  disabled={paraJuntar.length < 2}
                  onClick={() => crearJunta(paraJuntar)}
                >
                  <Link2 size={16} strokeWidth={2.3} aria-hidden="true" />
                  {paraJuntar.length < 2 ? 'Toca al menos dos mesas' : `Juntar ${paraJuntar.map(nombreDe).join(' + ')}`}
                </button>
                {aviso && (
                  <p className="ed-aviso" role="alert">
                    {aviso}
                  </p>
                )}

                {sugerencias.length > 0 && (
                  <div className="ed-sugerencias">
                    <p className="ed-subtitulo">Taly ve mesas pegadas:</p>
                    {sugerencias.slice(0, 4).map(([a, b]) => (
                      <div key={`${a.id}-${b.id}`} className="ed-sugerencia">
                        <span>
                          ¿{a.nombre} y {b.nombre} se pueden juntar?
                        </span>
                        <button type="button" onClick={() => crearJunta([a.id, b.id])}>
                          Sí, juntar
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <p className="ed-subtitulo">Mesas que ya se juntan</p>
                {plano.juntas.length === 0 && <p className="ed-nota">Aún ninguna. Sin juntas, el grupo más grande es el de tu mesa mayor.</p>}
                <ul className="ed-juntas">
                  {plano.juntas.map((j) => (
                    <li key={j.id} className="ed-junta">
                      <p className="ed-junta-nombre">{j.mesas.map(nombreDe).join(' + ')}</p>
                      <Paso
                        etiqueta="Cómodos"
                        valor={j.cap.normal}
                        min={2}
                        max={LIMITES.capacidad * 2}
                        onCambiar={(n) =>
                          aplicar({
                            ...plano,
                            juntas: plano.juntas.map((x) =>
                              x.id === j.id ? { ...x, cap: { min: Math.min(x.cap.min, n), normal: n, max: x.cap.max != null ? Math.max(x.cap.max, n) : null } } : x,
                            ),
                          })
                        }
                      />
                      <Paso
                        etiqueta="Desde"
                        valor={j.cap.min}
                        min={1}
                        max={j.cap.normal}
                        texto={`${j.cap.min} personas`}
                        onCambiar={(n) => aplicar({ ...plano, juntas: plano.juntas.map((x) => (x.id === j.id ? { ...x, cap: { ...x.cap, min: n } } : x)) })}
                      />
                      <button
                        type="button"
                        className="ed-boton ed-boton--peligro"
                        onClick={() => aplicar({ ...plano, juntas: plano.juntas.filter((x) => x.id !== j.id) }, 'Ya no se juntan')}
                      >
                        <Trash2 size={15} strokeWidth={2.3} aria-hidden="true" />
                        Separar
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </>
        )}

        {nombrePaso === 'Revisar' && (
          <>
            <div className="paso-cabeza">
              <h2 className="paso-titulo" tabIndex={-1}>
                Así la verán tus clientes
              </h2>
              <p className="paso-texto">
                {mesasDe(plano).length} mesas · {mesasDe(plano).filter((m) => m.online).length} se reservan por Citaly ·{' '}
                {plano.juntas.length} {plano.juntas.length === 1 ? 'grupo de mesas que se junta' : 'grupos de mesas que se juntan'}
              </p>
            </div>

            {problemas.length > 0 && (
              <ul className="ed-problemas">
                {problemas.map((p) => (
                  <li key={p.id} className={p.bloquea ? 'ed-problema ed-problema--bloquea' : 'ed-problema'}>
                    <span>{p.texto}</span>
                    {p.ids[0] && (
                      <button
                        type="button"
                        onClick={() => {
                          const pieza = plano.piezas.find((x) => x.id === p.ids[0])
                          setPiso(pieza.piso)
                          setActiva(pieza.id)
                          setPaso(pasos.indexOf(esMesa(pieza) ? 'Mesas' : 'Lo fijo'))
                        }}
                      >
                        Arreglar
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            )}

            <VisorPlano plano={plano} titulo={`Plano de ${local.localName}`} conGrande />
            {aviso && (
              <p className="ed-aviso" role="alert">
                {aviso}
              </p>
            )}
          </>
        )}
      </div>
    </Asistente>
  )
}

/* Plano pequeño, solo para mirar (plantillas, formas, vista previa). */
function VisorMini({ plano }) {
  const limpio = validarPlano(plano)
  if (!limpio) return null
  return <Plano plano={limpio} />
}
