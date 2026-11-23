const FORMATOS = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
const MAX_BYTES = 8 * 1024 * 1024

/** Mensaje de error si el archivo no sirve como foto de perfil; null si vale. */
export function archivoDeFotoValido(file) {
  if (!file) return 'No se eligió ninguna imagen.'
  if (!FORMATOS.includes(file.type)) return 'Usa JPG, PNG, WEBP o GIF.'
  if (file.size > MAX_BYTES) return 'La imagen pesa más de 8 MB.'
  return null
}
