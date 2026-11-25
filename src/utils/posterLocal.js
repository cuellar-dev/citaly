/* El cartel descargable del local: el mismo de la pantalla de Compartir
   (toldo, nombre, QR en marco de pegatina, Taly con su bocadillo y la firma
   de Citaly), dibujado en un canvas.

   Se dibuja en un canvas aparte en vez de capturar la pantalla, por dos
   razones: la captura de pantalla reescala y emborrona justo lo que no puede
   emborronarse (el QR), y aquí se controla la resolución exacta de salida.

   Va sobre papel claro, no sobre el fondo oscuro de la app. No es un capricho
   de estilo: un QR se lee mucho mejor oscuro sobre claro, y así una hoja
   impresa no se come un cartucho de tinta.

   Las medidas van en `u`, el 1 % del ancho, igual que los cqi del CSS de
   compartirNegocio.css: si se toca una, tocar la otra. */

import talyAMano from '../components/Taly/taly-a-mano.svg'

const ANCHO = 1080
/* Proporción de un A4 con márgenes (190 × 277 mm), la misma de la hoja. */
const ALTO = Math.round((ANCHO * 277) / 190)
const u = ANCHO / 100

/* Lado del QR dentro del póster, en píxeles del póster (48u). Lo exporta para
   que la pantalla pida el canvas de origen a esta misma medida. */
export const LADO_QR = 48 * u

const PAPEL = '#f7f5ef'
const TINTA = '#0e2e2a'
const TINTA_SUAVE = '#4d5a57'
const TEAL = '#00c2ad'
const TEAL_OSCURO = '#00897a'
const MOSTAZA = '#ffd166'

/** El horario para enseñar: el texto del local o apertura – cierre. */
export function horarioDe(local) {
  if (!local) return ''
  if (local.horario) return local.horario
  if (local.horarioApertura && local.horarioCierre) return `${local.horarioApertura} – ${local.horarioCierre}`
  return ''
}

function rectRedondo(ctx, x, y, w, h, r) {
  ctx.beginPath()
  ctx.roundRect(x, y, w, h, r)
}

/* Baja el cuerpo hasta que el texto entra en el ancho dado. */
function cuerpoQueEntra(ctx, texto, familia, peso, inicial, maxAncho, minimo = 24) {
  let tam = inicial
  do {
    ctx.font = `${peso} ${tam}px ${familia}`
    if (ctx.measureText(texto).width <= maxAncho) break
    tam -= 2
  } while (tam > minimo)
  return tam
}

/* Parte el texto en líneas que entren en el ancho. */
function lineas(ctx, texto, maxAncho) {
  const palabras = texto.split(/\s+/)
  const out = []
  let actual = ''
  for (const p of palabras) {
    const prueba = actual ? `${actual} ${p}` : p
    if (actual && ctx.measureText(prueba).width > maxAncho) {
      out.push(actual)
      actual = p
    } else {
      actual = prueba
    }
  }
  if (actual) out.push(actual)
  return out
}

/* Para textos sin espacios (un enlace): corta donde ya no cabe. */
function partirPorCaracteres(ctx, texto, maxAncho) {
  const out = []
  let actual = ''
  for (const c of texto) {
    if (actual && ctx.measureText(actual + c).width > maxAncho) {
      out.push(actual)
      actual = c
    } else {
      actual += c
    }
  }
  if (actual) out.push(actual)
  return out
}

function cargarImagen(src) {
  return new Promise((resolve) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => resolve(null)
    img.src = src
  })
}

function toldo(ctx) {
  const s = ANCHO / 200
  ctx.lineJoin = 'round'
  ctx.lineWidth = 1.1 * s
  ctx.strokeStyle = TINTA
  for (let i = 0; i < 10; i++) {
    const x = i * 20 * s
    ctx.beginPath()
    ctx.moveTo(x, -2 * s)
    ctx.lineTo(x + 20 * s, -2 * s)
    ctx.lineTo(x + 20 * s, 16 * s)
    ctx.arc(x + 10 * s, 16 * s, 10 * s, 0, Math.PI)
    ctx.closePath()
    ctx.fillStyle = i % 2 ? PAPEL : TEAL
    ctx.fill()
    ctx.stroke()
  }
  return 26 * s
}

/**
 * Dibuja el póster y devuelve el canvas.
 * `canvasQR` es el canvas que ya pintó qrcode.react; se escala al hueco.
 */
export async function dibujarPoster({ canvasQR, nombre, categoria, direccion, horario, enlace }) {
  /* Sin esto el canvas dibuja con la tipografía del sistema: las fuentes de
     la app pueden no haber terminado de cargar cuando se pulsa Descargar. */
  if (document.fonts?.ready) await document.fonts.ready
  const taly = await cargarImagen(talyAMano)

  const canvas = document.createElement('canvas')
  canvas.width = ANCHO
  canvas.height = ALTO
  const ctx = canvas.getContext('2d')
  const centro = ANCHO / 2
  const anchoTexto = ANCHO - 16 * u

  ctx.fillStyle = PAPEL
  ctx.fillRect(0, 0, ANCHO, ALTO)

  let y = toldo(ctx) + 3.5 * u
  ctx.textAlign = 'center'
  ctx.textBaseline = 'top'

  if (categoria) {
    ctx.fillStyle = TEAL_OSCURO
    ctx.font = `700 ${3.1 * u}px Quicksand, sans-serif`
    ctx.letterSpacing = `${0.16 * 3.1 * u}px`
    ctx.fillText(categoria.toUpperCase(), centro, y)
    ctx.letterSpacing = '0px'
    y += 3.1 * u * 1.2 + 1.2 * u
  }

  // Nombre: hasta dos líneas, bajando de cuerpo si hace falta.
  const familiaNombre = 'drink, sans-serif'
  let tamNombre = nombre.length > 28 ? 7 * u : nombre.length > 16 ? 9 * u : 11.5 * u
  ctx.font = `700 ${tamNombre}px ${familiaNombre}`
  let filas = lineas(ctx, nombre, anchoTexto)
  while (filas.length > 2 && tamNombre > 5 * u) {
    tamNombre -= 0.5 * u
    ctx.font = `700 ${tamNombre}px ${familiaNombre}`
    filas = lineas(ctx, nombre, anchoTexto)
  }
  ctx.fillStyle = TINTA
  for (const fila of filas.slice(0, 2)) {
    const tam = cuerpoQueEntra(ctx, fila, familiaNombre, 700, tamNombre, anchoTexto, 4 * u)
    ctx.font = `700 ${tam}px ${familiaNombre}`
    ctx.fillText(fila, centro, y)
    y += tamNombre
  }

  if (direccion) {
    y += 2 * u
    const tam = cuerpoQueEntra(ctx, direccion, 'Quicksand, sans-serif', 600, 3.4 * u, anchoTexto, 2.4 * u)
    ctx.fillStyle = TINTA_SUAVE
    ctx.font = `600 ${tam}px Quicksand, sans-serif`
    ctx.fillText(direccion, centro, y)
    y += tam * 1.35
  }

  if (horario) {
    y += 2.4 * u
    const tam = 3.2 * u
    ctx.font = `700 ${tam}px Quicksand, sans-serif`
    const icono = 3.4 * u
    const hueco = 1.4 * u
    const anchoChip = icono + hueco + ctx.measureText(horario).width + 6 * u
    const altoChip = tam * 1.2 + 2 * u
    const x0 = centro - anchoChip / 2
    rectRedondo(ctx, x0, y, anchoChip, altoChip, altoChip / 2)
    ctx.fillStyle = MOSTAZA
    ctx.fill()
    ctx.lineWidth = 0.45 * u
    ctx.strokeStyle = TINTA
    ctx.stroke()
    // Relojito a mano.
    const cx = x0 + 3 * u + icono / 2
    const cy = y + altoChip / 2
    ctx.lineWidth = 0.32 * u
    ctx.lineCap = 'round'
    ctx.beginPath()
    ctx.arc(cx, cy, icono / 2 - 0.2 * u, 0, Math.PI * 2)
    ctx.moveTo(cx, cy - icono * 0.24)
    ctx.lineTo(cx, cy)
    ctx.lineTo(cx + icono * 0.18, cy + icono * 0.12)
    ctx.stroke()
    ctx.fillStyle = TINTA
    ctx.textAlign = 'left'
    ctx.textBaseline = 'middle'
    ctx.fillText(horario, x0 + 3 * u + icono + hueco, cy + 0.15 * u)
    ctx.textAlign = 'center'
    ctx.textBaseline = 'top'
    y += altoChip
  }

  /* El QR en su marco de pegatina. El lado lo manda el póster, NUNCA el
     canvas de origen: qrcode.react pinta a la resolución de la pantalla
     (size × devicePixelRatio), así que canvasQR.width no vale LADO_QR. */
  y += 3.5 * u
  const pad = 1.6 * u
  const borde = 0.7 * u
  const marco = LADO_QR + 2 * pad + 2 * borde
  const xMarco = centro - marco / 2
  rectRedondo(ctx, xMarco + 1.8 * u, y + 1.8 * u, marco, marco, 4.5 * u)
  ctx.fillStyle = TEAL
  ctx.fill()
  rectRedondo(ctx, xMarco + borde / 2, y + borde / 2, marco - borde, marco - borde, 4.5 * u - borde / 2)
  ctx.fillStyle = '#ffffff'
  ctx.fill()
  ctx.lineWidth = borde
  ctx.strokeStyle = TINTA
  ctx.stroke()
  /* Suavizado alto: el origen llega a size × devicePixelRatio, que puede no
     ser entero, y sin suavizado los módulos saldrían de anchos desiguales. */
  ctx.imageSmoothingEnabled = true
  ctx.imageSmoothingQuality = 'high'
  ctx.drawImage(
    canvasQR,
    0,
    0,
    canvasQR.width,
    canvasQR.height,
    xMarco + borde + pad,
    y + borde + pad,
    LADO_QR,
    LADO_QR,
  )
  ctx.imageSmoothingEnabled = true
  y += marco + 3.5 * u

  // Taly y su bocadillo.
  const ladoTaly = 18 * u
  const xTaly = 6 * u
  if (taly) ctx.drawImage(taly, xTaly, y, ladoTaly, ladoTaly)

  const xBoc = xTaly + ladoTaly + 1 * u
  const anchoBoc = ANCHO - 8 * u - xBoc
  const tamCta = 3.8 * u
  ctx.font = `700 ${tamCta}px Quicksand, sans-serif`
  const filasCta = lineas(ctx, '¡Escanea con la cámara y pide tu cita!', anchoBoc - 6.8 * u)
  const altoBoc = 4.8 * u + filasCta.length * tamCta * 1.25
  const yBoc = y + ladoTaly / 2 - altoBoc / 2
  const cyBoc = yBoc + altoBoc / 2

  ctx.lineWidth = 0.5 * u
  ctx.strokeStyle = TINTA
  ctx.fillStyle = '#ffffff'
  rectRedondo(ctx, xBoc, yBoc, anchoBoc, altoBoc, 4 * u)
  ctx.fill()
  ctx.stroke()
  // Piquito hacia Taly.
  ctx.beginPath()
  ctx.moveTo(xBoc + 0.3 * u, cyBoc - 2 * u)
  ctx.lineTo(xBoc - 2.8 * u, cyBoc)
  ctx.lineTo(xBoc + 0.3 * u, cyBoc + 2 * u)
  ctx.closePath()
  ctx.fill()
  ctx.beginPath()
  ctx.moveTo(xBoc, cyBoc - 2.2 * u)
  ctx.lineTo(xBoc - 2.8 * u, cyBoc)
  ctx.lineTo(xBoc, cyBoc + 2.2 * u)
  ctx.stroke()

  ctx.textAlign = 'left'
  let yTexto = yBoc + 2.4 * u
  ctx.fillStyle = TINTA
  ctx.font = `700 ${tamCta}px Quicksand, sans-serif`
  for (const fila of filasCta) {
    ctx.fillText(fila, xBoc + 3.4 * u, yTexto)
    yTexto += tamCta * 1.25
  }

  /* El enlace, en su propia línea y a todo el ancho: los de los locales
     propios llevan un id largo y dentro del bocadillo se salía. Baja de
     cuerpo hasta entrar; si ni así, se parte por caracteres. */
  y += ladoTaly + 2 * u
  ctx.textAlign = 'center'
  ctx.fillStyle = TEAL_OSCURO
  const tamEnlace = cuerpoQueEntra(ctx, enlace, 'Quicksand, sans-serif', 700, 3.6 * u, anchoTexto, 2.6 * u)
  ctx.font = `700 ${tamEnlace}px Quicksand, sans-serif`
  for (const fila of partirPorCaracteres(ctx, enlace, anchoTexto)) {
    ctx.fillText(fila, centro, y)
    y += tamEnlace * 1.25
  }

  // Firma de Citaly, en la franja de tinta del pie.
  const altoPie = 11 * u
  ctx.fillStyle = TINTA
  ctx.fillRect(0, ALTO - altoPie, ANCHO, altoPie)
  ctx.textBaseline = 'alphabetic'
  ctx.textAlign = 'left'
  const lema = 'Reserva en los lugares de tu barrio'
  ctx.font = `700 ${5.4 * u}px drink, sans-serif`
  const anchoMarca = ctx.measureText('Citaly').width
  ctx.font = `600 ${3.1 * u}px Quicksand, sans-serif`
  const anchoLema = ctx.measureText(lema).width
  const xFirma = centro - (anchoMarca + 2.6 * u + anchoLema) / 2
  const base = ALTO - altoPie / 2 + 1.8 * u
  ctx.fillStyle = TEAL
  ctx.font = `700 ${5.4 * u}px drink, sans-serif`
  ctx.fillText('Citaly', xFirma, base)
  ctx.fillStyle = '#cfe9e4'
  ctx.font = `600 ${3.1 * u}px Quicksand, sans-serif`
  ctx.fillText(lema, xFirma + anchoMarca + 2.6 * u, base)

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
