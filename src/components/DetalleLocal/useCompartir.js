import { useCallback, useEffect, useState } from 'react'

const AVISO_MS = 2600

/* Compartir el local: la hoja nativa si existe; si no (o si falla), copiar
   el enlace y avisarlo con un aviso de la app en vez de un alert(). */
export function useCompartir(local) {
  const [aviso, setAviso] = useState(null)

  useEffect(() => {
    if (!aviso) return undefined
    const t = setTimeout(() => setAviso(null), AVISO_MS)
    return () => clearTimeout(t)
  }, [aviso])

  const compartir = useCallback(async () => {
    if (!local) return
    const url = `${window.location.origin}/local/${local.id}`
    const copiar = async () => {
      try {
        await navigator.clipboard.writeText(url)
        setAviso('Enlace copiado')
      } catch {
        setAviso('No se pudo copiar el enlace')
      }
    }

    if (!navigator.share) {
      await copiar()
      return
    }
    try {
      await navigator.share({
        title: `${local.localName} · Citaly`,
        text: `Mira ${local.localName} en Citaly`,
        url,
      })
    } catch (error) {
      if (error?.name !== 'AbortError') await copiar()
    }
  }, [local])

  return { compartir, aviso }
}
