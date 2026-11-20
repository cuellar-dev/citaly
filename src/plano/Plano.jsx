import { forwardRef, useId } from 'react'
import { DibujoPieza } from './Piezas.jsx'
import { CATALOGO, caja, contorno, dimensiones, recortes, zonaDe } from './modelo.js'
import { lineaTinta, poligonoTinta } from './trazo.js'
import './plano.css'

/* Dibuja un plano (o un piso de un plano) en vector. Es el mismo componente
   para el cliente que reserva, el dueño en Mi Negocio, el recibo de la cita
   y el editor.

   Props:
     plano, piso            qué dibujar
     estados                Map idMesa → 'libre' | 'ocupada' | 'nocabe' | 'local' | 'opcion' | 'apagada'
     elegidas               ids de las mesas elegidas (una, o varias)
     unir                   las elegidas van juntas: se unen con un trazo
     onMesa(id)             tocar una mesa (si falta, el plano es solo para mirar)
     tocarTodas             (dueño) se puede tocar cualquier mesa, no solo las libres
     onEscalera()           tocar la escalera (cambia de piso)
     modo                   'ver' | 'editar'
     activa, problemas      (editor) pieza seleccionada e ids con algún problema
     onPiezaDown(e, pieza)  (editor) empezar a arrastrar
     onFondoDown(e)         (editor) tocar el suelo vacío
*/

const ORDEN = { area: 0, fija: 1, mesa: 2 }
const TEXTO_ESTADO = {
  libre: 'libre',
  ocupada: 'ocupada a esa hora',
  nocabe: 'no es para tu grupo',
  local: 'se guarda para quien llega sin reserva',
  opcion: 'se puede juntar para tu grupo',
  apagada: '',
}

const Plano = forwardRef(function Plano(
  {
    plano,
    piso,
    estados,
    elegidas = [],
    unir = false,
    onMesa,
    tocarTodas = false,
    onEscalera,
    modo = 'ver',
    activa = null,
    problemas,
    onPiezaDown,
    onFondoDown,
    titulo,
    className = '',
  },
  ref,
) {
  const uid = useId().replace(/:/g, '')
  const { ancho, alto } = dimensiones(plano)
  const pisoActual = piso ?? plano.pisos[0]?.id
  const editar = modo === 'editar'
  const margen = 2.4
  const fs = Math.max(1.15, ancho / 26)

  const piezas = plano.piezas
    .filter((p) => p.piso === pisoActual)
    .sort((a, b) => ORDEN[CATALOGO[a.tipo].familia] - ORDEN[CATALOGO[b.tipo].familia])

  const elegidasSet = new Set(elegidas)
  const centros = elegidas
    .map((id) => piezas.find((p) => p.id === id))
    .filter(Boolean)
    .map((p) => {
      const c = caja(p)
      return [c.x + c.w / 2, c.y + c.h / 2]
    })

  return (
    <svg
      ref={ref}
      className={`plano plano--${modo} ${className}`.trim()}
      viewBox={`${-margen} ${-margen} ${ancho + margen * 2} ${alto + margen * 2}`}
      preserveAspectRatio="xMidYMid meet"
      role={titulo ? 'group' : undefined}
      aria-label={titulo}
      onPointerDown={editar ? onFondoDown : undefined}
    >
      <defs>
        <pattern id={`rayas-${uid}`} width="1.2" height="1.2" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <path className="plano-rayas" d="M0 0 V1.2" />
        </pattern>
        {editar && (
          <pattern id={`rejilla-${uid}`} width="2" height="2" patternUnits="userSpaceOnUse">
            <circle className="plano-rejilla" cx="0" cy="0" r="0.09" />
          </pattern>
        )}
      </defs>

      {/* Lo que no es local (formas en L, U o T): rayado. */}
      {recortes(plano).map((r, i) => (
        <g key={i} className="plano-recorte">
          <rect x={r.x} y={r.y} width={r.w} height={r.h} fill={`url(#rayas-${uid})`} />
          {editar && r.w > 8 && r.h > 4 && (
            <text className="plano-recorte-texto" x={r.x + r.w / 2} y={r.y + r.h / 2} fontSize={fs * 0.8} textAnchor="middle" dominantBaseline="central">
              Aquí no hay local
            </text>
          )}
        </g>
      ))}

      {/* El suelo del local y su contorno a pluma. */}
      <path className="plano-suelo" d={poligonoTinta(contorno(plano), 'suelo', 0)} />
      {editar && <path d={poligonoTinta(contorno(plano), 'suelo', 0)} fill={`url(#rejilla-${uid})`} pointerEvents="none" />}
      <path className="plano-contorno" d={poligonoTinta(contorno(plano), `contorno-${plano.tamano}`)} />

      {/* Las mesas que se juntan, unidas con un trazo discontinuo. */}
      {unir && centros.length > 1 && (
        <path
          className="plano-union"
          d={centros
            .slice(1)
            .map((c, i) => lineaTinta(centros[i][0], centros[i][1], c[0], c[1], `u${i}`))
            .join(' ')}
        />
      )}

      {piezas.map((p) => {
        const familia = CATALOGO[p.tipo].familia
        const esMesa = familia === 'mesa'
        const estado = esMesa ? (estados?.get(p.id) ?? (p.online ? 'libre' : 'local')) : null
        const tocable = !editar && esMesa && onMesa && (tocarTodas || estado === 'libre' || estado === 'opcion')
        const escalera = !editar && p.tipo === 'escalera' && onEscalera
        const clases = [
          'plano-pieza',
          `plano-pieza--${familia}`,
          `pz--${p.tipo}`,
          estado ? `plano-mesa--${estado}` : '',
          elegidasSet.has(p.id) ? 'plano-mesa--elegida' : '',
          activa === p.id ? 'plano-pieza--activa' : '',
          problemas?.has(p.id) ? 'plano-pieza--problema' : '',
          tocable || escalera ? 'plano-pieza--tocable' : '',
        ]
          .filter(Boolean)
          .join(' ')

        const etiqueta = esMesa
          ? [p.nombre, zonaDe(plano, p), elegidasSet.has(p.id) ? 'elegida' : TEXTO_ESTADO[estado]].filter(Boolean).join(', ')
          : CATALOGO[p.tipo].nombre

        const interaccion = tocable
          ? {
              role: 'button',
              tabIndex: 0,
              'aria-label': etiqueta,
              'aria-pressed': elegidasSet.has(p.id),
              onClick: () => onMesa(p.id),
              onKeyDown: (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  onMesa(p.id)
                }
              },
            }
          : escalera
            ? {
                role: 'button',
                tabIndex: 0,
                'aria-label': 'Escalera: ir al otro piso',
                onClick: onEscalera,
                onKeyDown: (e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    onEscalera()
                  }
                },
              }
            : editar
              ? {
                  role: 'button',
                  tabIndex: 0,
                  'aria-label': `${etiqueta}. Toca para elegirla y arrástrala para moverla.`,
                  'aria-pressed': activa === p.id,
                  'data-pieza': p.id,
                  onPointerDown: (e) => onPiezaDown?.(e, p),
                }
              : { 'aria-hidden': esMesa ? undefined : true, 'aria-label': esMesa ? etiqueta : undefined, role: esMesa ? 'img' : undefined }

        return (
          <g
            key={p.id}
            className={clases}
            transform={`translate(${p.x} ${p.y})${p.rot ? ` rotate(${p.rot} ${p.w / 2} ${p.h / 2})` : ''}`}
            {...interaccion}
          >
            {/* Área de toque generosa: la pieza + un margen, invisible. */}
            {(tocable || editar) && <rect className="plano-toque" x={-1} y={-1} width={p.w + 2} height={p.h + 2} rx={1} />}
            <DibujoPieza pieza={p} fs={fs} />
            {activa === p.id && <rect className="plano-seleccion" x={-0.6} y={-0.6} width={p.w + 1.2} height={p.h + 1.2} rx={0.9} />}
          </g>
        )
      })}
    </svg>
  )
})

export default Plano
