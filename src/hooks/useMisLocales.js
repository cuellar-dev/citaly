import { useEffect, useState } from 'react'
import { hayApi } from '../services/api.js'
import { MIS_LOCALES_EVENTO, getMisLocales, sincronizarMisLocales } from '../services/misLocales.js'
import { useSesion } from './useSesion.js'

/**
 * Los locales de la cuenta con la sesión abierta. Empieza con la copia del
 * navegador (pinta al momento) y, con backend, los pide al servidor: así Perfil
 * y Avisos saben que tienes un local aunque no hayas pasado antes por Mi Negocio.
 * Se vuelve a leer cada vez que cambia la copia (MIS_LOCALES_EVENTO).
 */
export function useMisLocales() {
  const { usuario } = useSesion()
  const yo = usuario?.id ?? null
  const [lista, setLista] = useState(() => getMisLocales())

  useEffect(() => {
    let vivo = true
    const leer = () => {
      if (vivo) setLista(getMisLocales())
    }
    leer()
    window.addEventListener(MIS_LOCALES_EVENTO, leer)
    if (hayApi && yo) sincronizarMisLocales().catch(() => {})
    return () => {
      vivo = false
      window.removeEventListener(MIS_LOCALES_EVENTO, leer)
    }
  }, [yo])

  return lista
}
