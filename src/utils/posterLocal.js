/* El póster descargable del local: nombre, datos, QR y enlace.

   Se dibuja en un canvas aparte en vez de capturar la pantalla, por dos
   razones: la captura de pantalla reescala y emborrona justo lo que no puede
   emborronarse (el QR), y aquí se controla la resolución exacta de salida.

   Va sobre papel claro, no sobre el fondo oscuro de la app. No es un capricho
   de estilo: un QR se lee mucho mejor oscuro sobre claro, y así una hoja
   impresa no se come un cartucho de tinta. */

const ANCHO = 1080
const ALTO = 1500

/* Lado del QR dentro del póster, en píxeles del póster. Lo exporta para que
   la pantalla pida el canvas de origen a esta misma medida y no se vayan por
   su cuenta. */
export const LADO_QR = 620

const PAPEL = '#f7f5ef'
const TINTA = '#121413'
const TINTA_SUAVE = '#6b706d'
const TEAL = '#00a894'
const MOSTAZA = '#ffd166'

/* La chispa de cuatro puntas de Taly, la misma curva que en el SVG. */
function chispa(ctx, x, y, s) {
  ctx.beginPath()
  ctx.moveTo(x, y - 9 * s)
  ctx.bezierCurveTo(x + 1.5 * s, y - 2.5 * s, x + 2.5 * s, y - 1.5 * s, x + 9 * s, y)
  ctx.bezierCurveTo(x + 2.5 * s, y + 1.5 * s, x + 1.5 * s, y + 2.5 * s, x, y + 9 * s)
  ctx.bezierCurveTo(x - 1.5 * s, y + 2.5 * s, x - 2.5 * s, y + 1.5 * s, x - 9 * s, y)
  ctx.bezierCurveTo(x - 2.5 * s, y - 1.5 * s, x - 1.5 * s, y - 2.5 * s, x, y - 9 * s)
  ctx.closePath()
  ctx.fill()
}

/* Baja el cuerpo hasta que el texto entra en el ancho dado. Un nombre largo
   no puede desbordar el papel ni partirse a la mitad. */
function cuerpoQueEntra(ctx, texto, familia, peso, inicial, maxAncho, minimo = 40) {
  let tam = inicial
  do {
    ctx.font = `${peso} ${tam}px ${familia}`
    if (ctx.measureText(texto).width <= maxAncho) break
    tam -= 4
  } while (tam > minimo)
  return tam
}

/**
 * Dibuja el póster y devuelve el canvas.
 * `canvasQR` es el canvas que ya pintó qrcode.react; se copia 1:1, sin
 * reescalar, para que los módulos salgan con el filo intacto.
 */
export async function dibujarPoster({ canvasQR, nombre, categoria, direccion, horario, enlace }) {
  /* Sin esto el canvas dibuja con la tipografía del sistema: las fuentes de
     la app pueden no haber terminado de cargar cuando se pulsa Descargar. */
  if (document.fonts?.ready) await document.fonts.ready

  const canvas = document.createElement('canvas')
  canvas.width = ANCHO
  canvas.height = ALTO
  const ctx = canvas.getContext('2d')
  const centro = ANCHO / 2

  ctx.fillStyle = PAPEL
  ctx.fillRect(0, 0, ANCHO, ALTO)

  ctx.fillStyle = MOSTAZA
  chispa(ctx, 118, 150, 3.1)
  chispa(ctx, 962, 212, 2.2)
  chispa(ctx, 902, 1332, 2.6)
  chispa(ctx, 152, 1286, 1.8)

  ctx.textAlign = 'center'
  ctx.textBaseline = 'alphabetic'

  // Nombre, lo primero y lo más grande.
  const tamNombre = cuerpoQueEntra(ctx, nombre, 'drink, sans-serif', 700, 112, ANCHO - 220, 48)
  ctx.fillStyle = TINTA
  ctx.font = `700 ${tamNombre}px drink, sans-serif`
  ctx.fillText(nombre, centro, 250)

  // Mini datos.
  const meta = [categoria, direccion].filter(Boolean).join('  ·  ')
  if (meta) {
    const tamMeta = cuerpoQueEntra(ctx, meta, 'Quicksand, sans-serif', 600, 36, ANCHO - 180, 24)
    ctx.fillStyle = TINTA_SUAVE
    ctx.font = `600 ${tamMeta}px Quicksand, sans-serif`
    ctx.fillText(meta, centro, 312)
  }
  if (horario) {
    ctx.fillStyle = TINTA_SUAVE
    ctx.font = '700 32px Quicksand, sans-serif'
    ctx.fillText(horario, centro, 364)
  }

  /* El lado del QR lo manda el póster, NUNCA el canvas de origen.
     qrcode.react pinta a la resolución de la pantalla (size x
     devicePixelRatio), así que canvasQR.width no vale LADO_QR: en un monitor
     normal vale el doble o más. Usarlo como medida de maquetado dibujaba el
     código a 1240 px sobre un cartel de 1080 y se comía el resto.
     Se escala el origen completo al hueco; si viene a más resolución, mejor,
     porque baja nítido en vez de ampliarse. */
  const xQR = Math.round(centro - LADO_QR / 2)
  const yQR = 440
  const aire = 28
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(xQR - aire, yQR - aire, LADO_QR + aire * 2, LADO_QR + aire * 2)
  ctx.strokeStyle = 'rgba(18, 20, 19, 0.14)'
  ctx.lineWidth = 2
  ctx.strokeRect(xQR - aire, yQR - aire, LADO_QR + aire * 2, LADO_QR + aire * 2)
  ctx.imageSmoothingEnabled = true
  ctx.imageSmoothingQuality = 'high'
  ctx.drawImage(canvasQR, 0, 0, canvasQR.width, canvasQR.height, xQR, yQR, LADO_QR, LADO_QR)

  const finQR = yQR + LADO_QR + aire

  ctx.fillStyle = TINTA
  ctx.font = '700 38px Quicksand, sans-serif'
  ctx.fillText('Escanea y reserva tu cita', centro, finQR + 86)

  const tamEnlace = cuerpoQueEntra(ctx, enlace, 'Quicksand, sans-serif', 700, 42, ANCHO - 180, 26)
  ctx.fillStyle = TEAL
  ctx.font = `700 ${tamEnlace}px Quicksand, sans-serif`
  ctx.fillText(enlace, centro, finQR + 150)

  ctx.strokeStyle = 'rgba(18, 20, 19, 0.12)'
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.moveTo(centro - 150, ALTO - 136)
  ctx.lineTo(centro + 150, ALTO - 136)
  ctx.stroke()

  ctx.fillStyle = TEAL
  ctx.font = '700 34px drink, sans-serif'
  ctx.fillText('Citaly', centro, ALTO - 78)

  return canvas
}

/** Lanza la descarga del póster como PNG. */
export async function descargarPoster(datos, nombreArchivo) {
  const canvas = await dibujarPoster(datos)
  const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/png'))
  if (!blob) throw new Error('No se pudo generar la imagen')

  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = nombreArchivo
  document.body.appendChild(a)
  a.click()
  a.remove()
  /* El revoke inmediato cancela la descarga en algunos navegadores. */
  setTimeout(() => URL.revokeObjectURL(url), 10000)
}
