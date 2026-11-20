import { CATALOGO, rotuloCorto } from './modelo.js'
import { circuloTinta, lineaTinta, rectTinta } from './trazo.js'

/* Dibujo de cada pieza del plano, en coordenadas locales (0,0)–(w,h) y en
   casillas. <Plano> la coloca y la gira. Un único juego de piezas para
   todos los locales.

   Clases (los colores viven en plano.css, para los dos temas):
     pz-fondo   relleno de la pieza          pz-tinta   trazo de pluma
     pz-silla   sillas alrededor de la mesa  pz-rotulo  texto
     pz-detalle líneas finas de dentro       pz-cristal relleno de ventana

   Los textos se contra-giran para leerse siempre derechos. */

const SILLA = { largo: 1.1, ancho: 0.62, sep: 0.42 }

function legible(a) {
  const t = ((a % 360) + 360) % 360
  if (t > 90 && t <= 270) return t - 180
  return t > 270 ? t - 360 : t
}

function Rotulo({ x, y, rot, fs, children, clase = '' }) {
  return (
    <text
      x={x}
      y={y}
      className={`pz-rotulo ${clase}`}
      fontSize={fs}
      textAnchor="middle"
      dominantBaseline="central"
      transform={rot ? `rotate(${-rot} ${x} ${y})` : undefined}
    >
      {children}
    </text>
  )
}

/* ---------- sillas ---------- */

function sillasRedonda(n, w) {
  const r = w / 2
  return Array.from({ length: n }, (_, i) => {
    const a = (i / n) * Math.PI * 2 - Math.PI / 2
    const d = r + SILLA.sep + SILLA.ancho / 2
    return { cx: r + Math.cos(a) * d, cy: r + Math.sin(a) * d, giro: (a * 180) / Math.PI + 90 }
  })
}

/* Rectangulares: primero los dos lados largos, alternando, y si sobran,
   las cabeceras. Como se sienta la gente de verdad. */
function sillasRect(n, w, h) {
  const porLargo = Math.max(1, Math.floor(w / 1.7))
  const porCorto = Math.max(1, Math.floor(h / 1.7))
  const arriba = []
  const abajo = []
  const izq = []
  const der = []
  for (let i = 0; i < n; i++) {
    if (arriba.length < porLargo && arriba.length <= abajo.length) arriba.push(i)
    else if (abajo.length < porLargo) abajo.push(i)
    else if (izq.length <= der.length && izq.length < porCorto) izq.push(i)
    else if (der.length < porCorto) der.push(i)
  }
  const d = SILLA.sep + SILLA.ancho / 2
  const reparto = (lista, largo) => lista.map((_, k) => ((k + 1) / (lista.length + 1)) * largo)
  return [
    ...reparto(arriba, w).map((x) => ({ cx: x, cy: -d, giro: 0 })),
    ...reparto(abajo, w).map((x) => ({ cx: x, cy: h + d, giro: 0 })),
    ...reparto(izq, h).map((y) => ({ cx: -d, cy: y, giro: 90 })),
    ...reparto(der, h).map((y) => ({ cx: w + d, cy: y, giro: 90 })),
  ]
}

function Sillas({ lista }) {
  return (
    <g className="pz-sillas" aria-hidden="true">
      {lista.map((s, i) => (
        <rect
          key={i}
          className="pz-silla"
          x={s.cx - SILLA.largo / 2}
          y={s.cy - SILLA.ancho / 2}
          width={SILLA.largo}
          height={SILLA.ancho}
          rx={0.28}
          transform={`rotate(${s.giro} ${s.cx} ${s.cy})`}
        />
      ))}
    </g>
  )
}

/* ---------- mesas ---------- */

function Mesa({ p, fs }) {
  const { w, h, rot } = p
  const sillas = Math.min(p.cap?.normal ?? 2, 12)
  const rotulo = rotuloCorto(p.nombre)

  if (p.tipo === 'mesa-redonda') {
    const r = w / 2
    return (
      <>
        <Sillas lista={sillasRedonda(sillas, w)} />
        <circle className="pz-fondo" cx={r} cy={r} r={r} />
        <path className="pz-tinta" d={circuloTinta(r, r, r, p.id)} />
        <Rotulo x={r} y={r} rot={rot} fs={fs}>{rotulo}</Rotulo>
      </>
    )
  }

  if (p.tipo === 'sofa') {
    /* Banco en U alrededor de una mesa pequeña. */
    const g = 1.25
    const banco = `M0 0 H${w} V${h} H${w - g} V${g} H${g} V${h} H0 Z`
    return (
      <>
        <path className="pz-banco" d={banco} />
        <path className="pz-tinta" d={rectTinta(w, h, 0.5, `${p.id}-b`)} />
        <rect className="pz-fondo" x={g + 0.8} y={g + 0.6} width={w - 2 * g - 1.6} height={h - g - 1.2} rx={0.4} />
        <path
          className="pz-tinta"
          transform={`translate(${g + 0.8} ${g + 0.6})`}
          d={rectTinta(w - 2 * g - 1.6, h - g - 1.2, 0.4, p.id)}
        />
        <Rotulo x={w / 2} y={g + (h - g) / 2} rot={rot} fs={fs}>{rotulo}</Rotulo>
      </>
    )
  }

  if (p.tipo === 'taburetes') {
    /* Fila de taburetes altos: uno por plaza cómoda. */
    const n = Math.max(1, sillas)
    const paso = w / n
    return (
      <>
        <rect className="pz-fondo pz-fondo--suave" x={0} y={0} width={w} height={h} rx={h / 2} />
        {Array.from({ length: n }, (_, i) => (
          <g key={i}>
            <circle className="pz-taburete" cx={paso * (i + 0.5)} cy={h / 2} r={Math.min(0.62, paso / 2.4)} />
            <path className="pz-tinta" d={circuloTinta(paso * (i + 0.5), h / 2, Math.min(0.62, paso / 2.4), `${p.id}-${i}`, 0.06)} />
          </g>
        ))}
        <Rotulo x={w / 2} y={h + fs * 0.75} rot={rot} fs={fs * 0.8} clase="pz-rotulo--fuera">
          {rotulo}
        </Rotulo>
      </>
    )
  }

  /* Cuadrada y larga. */
  return (
    <>
      <Sillas lista={sillasRect(sillas, w, h)} />
      <rect className="pz-fondo" x={0} y={0} width={w} height={h} rx={0.45} />
      <path className="pz-tinta" d={rectTinta(w, h, 0.45, p.id)} />
      <Rotulo x={w / 2} y={h / 2} rot={rot} fs={fs}>{rotulo}</Rotulo>
    </>
  )
}

/* ---------- zonas comunes ---------- */

function Caja({ p, children, clase = '', radio = 0.4 }) {
  return (
    <>
      <rect className={`pz-fondo ${clase}`} x={0} y={0} width={p.w} height={p.h} rx={radio} />
      {children}
      <path className="pz-tinta" d={rectTinta(p.w, p.h, radio, p.id)} />
    </>
  )
}

function Fija({ p, fs }) {
  const { w, h, rot } = p
  const cx = w / 2
  const cy = h / 2
  const nombre = CATALOGO[p.tipo].nombre
  /* El texto va a lo largo de la pieza y siempre derecho: en una barra de pie
     se lee de arriba abajo, en vez de cruzarla en horizontal. */
  const rotT = rot - legible(rot + (h > w * 1.4 ? 90 : 0))
  const cabe = (texto, tam = fs) => texto.length * tam * 0.55 < Math.max(w, h) - 0.6

  switch (p.tipo) {
    case 'barra':
      return (
        <Caja p={p} clase="pz-fondo--fuerte">
          <path className="pz-detalle" d={lineaTinta(0.6, h * 0.36, w - 0.6, h * 0.36, `${p.id}-e`, 0.08)} />
          {cabe('Barra') && <Rotulo x={cx} y={h * 0.68} rot={rotT} fs={fs * 0.85}>Barra</Rotulo>}
        </Caja>
      )
    case 'entrada':
      /* Hueco de puerta con su barrido y una flecha que entra. */
      return (
        <>
          <rect className="pz-suelo-entrada" x={0} y={0} width={w} height={h} rx={0.3} />
          <path className="pz-tinta" d={`M0 ${h} V${h - 0.2} M${w} ${h} V${h - 0.2}`} />
          <path className="pz-detalle pz-detalle--puerta" d={`M0.3 ${h} A${w * 0.42} ${w * 0.42} 0 0 1 ${0.3 + w * 0.42} ${h - w * 0.42}`} />
          <path className="pz-flecha" d={`M${cx} ${h - 0.1} V${0.45} M${cx - 0.5} ${0.95} L${cx} ${0.45} L${cx + 0.5} ${0.95}`} />
          <Rotulo x={cx} y={-fs * 0.7} rot={rotT} fs={fs * 0.78} clase="pz-rotulo--fuera">Entrada</Rotulo>
        </>
      )
    case 'banos':
      return (
        <Caja p={p}>
          <g className="pz-icono" transform={`translate(${cx} ${cy - fs * 0.2})`}>
            <circle cx={-0.75} cy={-0.95} r={0.32} />
            <path d="M-1.15 -0.35 h0.8 l-0.15 1.2 h-0.5 Z" />
            <circle cx={0.75} cy={-0.95} r={0.32} />
            <path d="M0.4 -0.35 h0.7 l0.25 0.9 h-1.2 Z" />
          </g>
          <Rotulo x={cx} y={h - fs * 0.75} rot={rotT} fs={fs * 0.75}>Baños</Rotulo>
        </Caja>
      )
    case 'cocina':
      return (
        <Caja p={p} clase="pz-fondo--fuerte">
          {Array.from({ length: Math.ceil((w + h) / 1.4) }, (_, i) => (
            <path key={i} className="pz-rayado" d={`M${i * 1.4} 0 L${i * 1.4 - h} ${h}`} />
          ))}
          <rect className="pz-placa" x={cx - fs * 2} y={cy - fs * 0.75} width={fs * 4} height={fs * 1.5} rx={fs * 0.5} transform={rotT ? `rotate(${-rotT} ${cx} ${cy})` : undefined} />
          <Rotulo x={cx} y={cy} rot={rotT} fs={fs * 0.85}>Cocina</Rotulo>
        </Caja>
      )
    case 'caja':
      return (
        <Caja p={p}>
          <path className="pz-detalle" d={`M${w * 0.25} ${h * 0.34} h${w * 0.5}`} />
          <Rotulo x={cx} y={h * 0.66} rot={rotT} fs={fs * 0.75}>Caja</Rotulo>
        </Caja>
      )
    case 'escalera': {
      const n = Math.max(3, Math.floor(h / 0.8))
      return (
        <Caja p={p} radio={0.2}>
          {Array.from({ length: n - 1 }, (_, i) => (
            <path key={i} className="pz-detalle" d={`M0.25 ${((i + 1) / n) * h} H${w - 0.25}`} />
          ))}
          <path className="pz-flecha" d={`M${cx} ${h - 0.4} V0.6 M${cx - 0.55} 1.15 L${cx} 0.6 L${cx + 0.55} 1.15`} />
          <Rotulo x={cx} y={h + fs * 0.75} rot={rotT} fs={fs * 0.75} clase="pz-rotulo--fuera">Escalera</Rotulo>
        </Caja>
      )
    }
    case 'escenario':
      return (
        <Caja p={p} clase="pz-fondo--fuerte">
          <path className="pz-detalle pz-detalle--punteado" d={`M0.4 ${h - 0.5} H${w - 0.4}`} />
          {cabe('Escenario') && <Rotulo x={cx} y={cy - 0.2} rot={rotT} fs={fs * 0.85}>Escenario</Rotulo>}
        </Caja>
      )
    case 'ventana':
      return (
        <>
          <rect className="pz-cristal" x={0} y={0} width={w} height={h} />
          <path className="pz-tinta" d={rectTinta(w, h, 0.05, p.id, 0.05)} />
          <path className="pz-detalle" d={`M0 ${h / 2} H${w}`} />
        </>
      )
    case 'tabique':
      return <path className="pz-pared" d={rectTinta(w, h, 0.15, p.id, 0.06)} />
    case 'planta':
      return (
        <g className="pz-planta">
          <circle className="pz-maceta" cx={cx} cy={cy} r={w * 0.22} />
          {[0, 1, 2, 3, 4].map((i) => {
            const a = (i / 5) * Math.PI * 2
            return <ellipse key={i} cx={cx + Math.cos(a) * w * 0.26} cy={cy + Math.sin(a) * w * 0.26} rx={w * 0.2} ry={w * 0.12} transform={`rotate(${(a * 180) / Math.PI} ${cx + Math.cos(a) * w * 0.26} ${cy + Math.sin(a) * w * 0.26})`} />
          })}
        </g>
      )
    case 'rampa':
      return (
        <Caja p={p}>
          {Array.from({ length: Math.ceil(w / 0.9) }, (_, i) => (
            <path key={i} className="pz-rayado" d={`M${i * 0.9 + 0.3} ${h - 0.3} L${i * 0.9 + 0.9} 0.3`} />
          ))}
          <g className="pz-icono" transform={`translate(${cx} ${cy}) rotate(${-rot})`}>
            <circle cx={0} cy={-0.55} r={0.22} />
            <path d="M-0.1 -0.25 v0.55 h0.55 M0.05 0.05 A0.55 0.55 0 1 0 0.55 0.5" fill="none" />
          </g>
        </Caja>
      )
    default:
      return (
        <Caja p={p}>
          <Rotulo x={cx} y={cy} rot={rotT} fs={fs * 0.75}>{nombre}</Rotulo>
        </Caja>
      )
  }
}

function Zona({ p, fs }) {
  return (
    <>
      <rect className="pz-zona" x={0} y={0} width={p.w} height={p.h} rx={0.8} />
      <path className="pz-zona-borde" d={rectTinta(p.w, p.h, 0.8, p.id, 0.1)} />
      <text className="pz-zona-nombre" x={0.7} y={fs * 1.05} fontSize={fs * 0.85}>
        {p.nombre}
      </text>
    </>
  )
}

/** El dibujo de una pieza cualquiera, en sus coordenadas locales. */
export function DibujoPieza({ pieza, fs }) {
  const familia = CATALOGO[pieza.tipo]?.familia
  if (familia === 'mesa') return <Mesa p={pieza} fs={fs} />
  if (familia === 'area') return <Zona p={pieza} fs={fs} />
  return <Fija p={pieza} fs={fs} />
}

/* Miniatura de una pieza para la paleta del editor (en un cuadro de 48 px). */
export function IconoPieza({ tipo }) {
  const def = CATALOGO[tipo]
  const w = def.w
  const h = def.alto ?? (def.cuadrada ? def.w : def.h)
  const margen = def.familia === 'mesa' ? 1.4 : 0.8
  const lado = Math.max(w, h) + margen * 2
  const ejemplo = {
    id: `icono-${tipo}`,
    tipo,
    w,
    h,
    rot: 0,
    nombre: def.familia === 'area' ? 'Zona' : '1',
    cap: { normal: def.cap?.[1] ?? 0 },
  }
  return (
    <svg
      className="plano plano-icono"
      viewBox={`${-margen - (lado - margen * 2 - w) / 2} ${-margen - (lado - margen * 2 - h) / 2} ${lado} ${lado}`}
      aria-hidden="true"
      focusable="false"
    >
      <DibujoPieza pieza={ejemplo} fs={Math.max(1.3, lado / 6)} />
    </svg>
  )
}
