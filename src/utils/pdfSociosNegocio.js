import { ALTO, ANCHO, MARGEN, UTIL, dibujarFila, telefonoCorto, wrap } from './pdfCitasNegocio.js'

/* La lista de socios de un local de suscripción en PDF: quiénes son, cómo
   localizarlos, qué plan y turno tienen y cómo van con el pago. Mismo estilo
   que la hoja de citas: solo texto, pesa pocos KB. */

const COLUMNAS = [
  { key: 'nombre', titulo: 'Cliente', w: 36 },
  { key: 'telefono', titulo: 'Teléfono', w: 22 },
  { key: 'plan', titulo: 'Plan', w: 20 },
  { key: 'turno', titulo: 'Turno', w: 30 },
  { key: 'desde', titulo: 'Desde', w: 18 },
  { key: 'proximo', titulo: 'Paga el', w: 18 },
  { key: 'estado', titulo: 'Estado', w: 30 },
  { key: 'debe', titulo: 'A cobrar', w: 20, align: 'right' },
]

/**
 * filas: [{ nombre, telefono, plan, turno, desde, proximo, estado, debe }]
 * resumen: línea de cuentas bajo el título ("11 pagando · 3 atrasados…")
 */
export async function descargarPdfSocios({ localNombre, fechaTexto, resumen, filas, pie, conTurnos = true }) {
  const { jsPDF } = await import('jspdf')
  const doc = new jsPDF({ unit: 'mm', format: 'a4', compress: true })

  /* Sin turnos, su ancho pasa al nombre. */
  const columnas = conTurnos
    ? COLUMNAS
    : COLUMNAS.filter((c) => c.key !== 'turno').map((c) => (c.key === 'nombre' ? { ...c, w: c.w + 30 } : c))

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
  doc.text(`Clientes · ${fechaTexto}`, MARGEN, y + 3)
  doc.text(`${filas.length} ${filas.length === 1 ? 'persona' : 'personas'}`, ANCHO - MARGEN, y + 3, { align: 'right' })
  y += 5
  if (resumen) {
    doc.setTextColor(40, 40, 40)
    doc.text(wrap(doc, resumen, UTIL, 2), MARGEN, y + 3)
    y += 5
  }

  doc.setDrawColor(0, 194, 173)
  doc.setLineWidth(0.4)
  doc.line(MARGEN, y, MARGEN + UTIL, y)
  y += 2

  const encabezado = columnas.map((c) => ({ texto: c.titulo, w: c.w, align: c.align }))
  y += dibujarFila(doc, y, encabezado, { cabezera: true })

  filas.forEach((fila, i) => {
    const celdas = columnas.map((c) => ({
      texto: c.key === 'telefono' ? telefonoCorto(fila.telefono) : (fila[c.key] ?? '—'),
      w: c.w,
      align: c.align,
    }))
    const alto = Math.max(6, Math.max(...celdas.map((c) => wrap(doc, c.texto, c.w - 2.8).length)) * 3.4 + 2.2)
    if (y + alto > ALTO - 14) {
      doc.addPage()
      y = MARGEN
      y += dibujarFila(doc, y, encabezado, { cabezera: true })
    }
    y += dibujarFila(doc, y, celdas, { zebra: i % 2 === 1 })
  })

  y += 5
  if (pie) {
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(8.5)
    doc.setTextColor(22, 22, 22)
    doc.text(pie, ANCHO - MARGEN, Math.min(y, ALTO - 10), { align: 'right' })
    y += 5
  }
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(7)
  doc.setTextColor(120, 120, 120)
  doc.text('Hoja de trabajo · datos de contacto: no la compartas', MARGEN, Math.min(y, ALTO - 6))

  const slug = String(localNombre || 'local')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
  doc.save(`${slug}-clientes-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}.pdf`)
}
