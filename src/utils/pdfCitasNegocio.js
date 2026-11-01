import { jsPDF } from 'jspdf'
import { textoEstadoReserva } from './estadosCita.js'

const MARGEN = 8
const ANCHO = 210
const ALTO = 297
const UTIL = ANCHO - MARGEN * 2

const COLUMNAS = [
  { key: 'hora', titulo: 'Hora', w: 16 },
  { key: 'cliente', titulo: 'Cliente', w: 36 },
  { key: 'telefono', titulo: 'Teléfono', w: 26 },
  { key: 'linea', titulo: 'Servicio / mesa', w: 34 },
  { key: 'detalle', titulo: 'Con', w: 26 },
  { key: 'duracion', titulo: 'Dur.', w: 14 },
  { key: 'precio', titulo: 'CUP', w: 16 },
  { key: 'estado', titulo: 'Estado', w: 26 },
]

function duracionCorta(min) {
  if (!min) return '—'
  if (min < 60) return `${min}m`
  const h = Math.floor(min / 60)
  const m = min % 60
  return m ? `${h}h${m}` : `${h}h`
}

function telefonoCorto(tel) {
  const d = String(tel || '').replace(/\D/g, '')
  if (!d) return '—'
  if (d.length <= 8) return d
  return `${d.slice(-8, -4)} ${d.slice(-4)}`
}

function wrap(doc, texto, ancho, maxLineas = 2) {
  const lineas = doc.splitTextToSize(String(texto || '—'), ancho)
  return lineas.slice(0, maxLineas)
}

function dibujarFila(doc, y, celdas, { cabezera = false, zebra = false } = {}) {
  const pad = 1.4
  const lineasPorCelda = celdas.map((c) => wrap(doc, c.texto, c.w - pad * 2))
  const n = Math.max(1, ...lineasPorCelda.map((l) => l.length))
  const h = Math.max(6, n * 3.4 + 2.2)

  if (cabezera) {
    doc.setFillColor(18, 20, 19)
    doc.rect(MARGEN, y, UTIL, h, 'F')
  } else if (zebra) {
    doc.setFillColor(245, 245, 243)
    doc.rect(MARGEN, y, UTIL, h, 'F')
  }

  let x = MARGEN
  doc.setFont('helvetica', cabezera ? 'bold' : 'normal')
  doc.setFontSize(cabezera ? 7 : 8)
  doc.setTextColor(cabezera ? 255 : 22, cabezera ? 255 : 22, cabezera ? 255 : 22)

  lineasPorCelda.forEach((lineas, i) => {
    const celda = celdas[i]
    const tx = celda.align === 'right' ? x + celda.w - pad : x + pad
    doc.text(lineas, tx, y + 4, { align: celda.align || 'left' })
    x += celda.w
  })

  doc.setDrawColor(210, 210, 206)
  doc.setLineWidth(0.15)
  doc.line(MARGEN, y + h, MARGEN + UTIL, y + h)

  return h
}

/* Hoja de agenda: texto vectorial, sin fotos. Pesa pocos KB y se lee en el móvil. */
export function descargarPdfCitas({
  localNombre,
  fechaTexto,
  filtroLabel,
  citas,
}) {
  const doc = new jsPDF({ unit: 'mm', format: 'a4', compress: true })
  let y = MARGEN

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11)
  doc.setTextColor(0, 194, 173)
  doc.text('CITALY', MARGEN, y + 4)

  doc.setTextColor(22, 22, 22)
  doc.setFontSize(12)
  doc.text(localNombre || 'Local', ANCHO - MARGEN, y + 4, { align: 'right' })
  y += 7

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.setTextColor(90, 90, 90)
  doc.text(`Citas de hoy · ${fechaTexto}`, MARGEN, y + 3)
  doc.text(`${filtroLabel} · ${citas.length} ${citas.length === 1 ? 'cita' : 'citas'}`, ANCHO - MARGEN, y + 3, {
    align: 'right',
  })
  y += 6

  doc.setDrawColor(0, 194, 173)
  doc.setLineWidth(0.4)
  doc.line(MARGEN, y, MARGEN + UTIL, y)
  y += 2

  const encabezado = COLUMNAS.map((c) => ({
    texto: c.titulo,
    w: c.w,
    align: c.key === 'precio' || c.key === 'duracion' ? 'right' : 'left',
  }))
  y += dibujarFila(doc, y, encabezado, { cabezera: true })

  const valoresDe = (cita) => ({
    hora: cita.horaTexto || cita.horario,
    cliente: cita.cliente || '—',
    telefono: telefonoCorto(cita.telefono),
    linea: cita.linea || '—',
    detalle: (cita.detalle || '—').replace(/^Con\s+/i, ''),
    duracion: duracionCorta(cita.duracion),
    precio: cita.precio != null ? String(cita.precio) : '—',
    estado: cita.estadoPdf || textoEstadoReserva(cita.estadoReserva, { dueno: true }),
  })

  citas.forEach((cita, i) => {
    const valores = valoresDe(cita)
    const fila = COLUMNAS.map((c) => ({
      texto: valores[c.key],
      w: c.w,
      align: c.key === 'precio' || c.key === 'duracion' ? 'right' : 'left',
    }))
    const altoFila = Math.max(6, Math.max(...fila.map((c) => wrap(doc, c.texto, c.w - 2.8).length)) * 3.4 + 2.2)
    if (y + altoFila > ALTO - 12) {
      doc.addPage()
      y = MARGEN
      y += dibujarFila(doc, y, encabezado, { cabezera: true })
    }
    y += dibujarFila(doc, y, fila, { zebra: i % 2 === 1 })
  })

  y += 4
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(7)
  doc.setTextColor(120, 120, 120)
  const pie = `Solo texto · hoja de trabajo · ${citas.length} filas`
  doc.text(pie, MARGEN, Math.min(y, ALTO - 6))
  doc.text('No incluye fotos ni marcas', ANCHO - MARGEN, Math.min(y, ALTO - 6), { align: 'right' })

  const slug = String(localNombre || 'local')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
  const dia = (citas[0]?.fecha || new Date().toISOString().slice(0, 10)).replace(/-/g, '')
  doc.save(`${slug}-citas-${dia}.pdf`)
}
