/* Fotos que sube el dueño. Mientras no haya servidor viven en el
   localStorage del navegador, que tiene unos 5 MB para toda la app: por eso
   se reducen antes de guardarlas. Una foto de móvil de 4 MB queda en unos
   150–250 KB a 1280 px, que para la galería sobra. */

const FORMATOS = ['image/jpeg', 'image/png', 'image/webp']
const MAX_BYTES = 15 * 1024 * 1024
const LADO_MAX = 1280
const CALIDAD = 0.82

export function errorDeFoto(file) {
  if (!FORMATOS.includes(file.type)) return 'Usa fotos JPG, PNG o WEBP.'
  if (file.size > MAX_BYTES) return 'Alguna foto pesa más de 15 MB.'
  return null
}

export function comprimirFoto(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      const escala = Math.min(1, LADO_MAX / Math.max(img.naturalWidth, img.naturalHeight))
      const canvas = document.createElement('canvas')
      canvas.width = Math.round(img.naturalWidth * escala)
      canvas.height = Math.round(img.naturalHeight * escala)
      canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height)
      URL.revokeObjectURL(url)
      resolve(canvas.toDataURL('image/jpeg', CALIDAD))
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('No se pudo leer la foto.'))
    }
    img.src = url
  })
}
