import { useCallback, useEffect, useRef, useState } from 'react'
import { hayApi } from '../services/api.js'
import { saveCitas } from '../services/storage.js'
import {
  cambiosAsistencia,
  cambiosCancelar,
  cambiosOpinion,
  cambiosVoyPaAlla,
  cargarMisCitas,
  guardarAsistencia,
  guardarCancelar,
  guardarOpinion,
  guardarOpinionOmitida,
  guardarVoyPaAlla,
  leerCitasLocales,
} from '../services/misCitas.js'
import { caducarPendientes } from '../utils/estadosCita.js'

/* Las citas del cliente en Mis citas.

   estado:  'cargando' (solo con backend, la primera vez) | 'listo' | 'error'
   aviso:   frase corta para enseñar tras una acción ({ tono, texto }) o null

   Cada acción pinta el cambio al instante y lo guarda después:
     · crítica (cancelar, «voy pa allá»): si el servidor la rechaza se deshace
       y se avisa. No puede quedar como hecha una cita que el local sigue
       viendo viva.
     · secundaria (asistencia, opinión): si el servidor aún no la admite, el
       cambio se queda en este dispositivo y se avisa de ello. */

const AVISO_MS = 4500
const TEXTO_NO_GUARDADO = 'No pudimos guardarlo en el servidor. Queda en este dispositivo.'

export function useMisCitas() {
  const [citas, setCitas] = useState(() => (hayApi ? [] : leerCitasLocales()))
  const [estado, setEstado] = useState(hayApi ? 'cargando' : 'listo')
  const [aviso, setAviso] = useState(null)
  const carga = useRef(0)
  const relojAviso = useRef(0)

  const avisar = useCallback((tono, texto) => {
    window.clearTimeout(relojAviso.current)
    setAviso({ tono, texto })
    relojAviso.current = window.setTimeout(() => setAviso(null), AVISO_MS)
  }, [])

  const recargar = useCallback(async ({ silencioso = false } = {}) => {
    const mia = ++carga.current
    if (!silencioso) setEstado('cargando')
    try {
      const lista = await cargarMisCitas()
      if (mia !== carga.current) return
      setCitas(lista)
      setEstado('listo')
    } catch {
      if (mia !== carga.current) return
      /* Una recarga en segundo plano que falla no tira abajo lo que ya se ve. */
      setEstado((previo) => (silencioso && previo === 'listo' ? 'listo' : 'error'))
    }
  }, [])

  useEffect(() => {
    if (!hayApi) return undefined
    /* Primera carga. Ya arranca en 'cargando', así que no hace falta decirlo otra vez. */
    const mia = ++carga.current
    cargarMisCitas()
      .then((lista) => {
        if (mia !== carga.current) return
        setCitas(lista)
        setEstado('listo')
      })
      .catch(() => {
        if (mia === carga.current) setEstado('error')
      })
    /* Al volver a la pestaña: el local pudo aceptar o cancelar mientras tanto. */
    const alVolver = () => {
      if (document.visibilityState === 'visible') recargar({ silencioso: true })
    }
    document.addEventListener('visibilitychange', alVolver)
    return () => {
      document.removeEventListener('visibilitychange', alVolver)
      window.clearTimeout(relojAviso.current)
    }
  }, [recargar])

  /* El plazo de 15 min del dueño: la cita pendiente se ve cancelada al llegar. */
  useEffect(() => {
    const id = window.setInterval(
      () =>
        setCitas((prev) => {
          const vigentes = caducarPendientes(prev)
          /* Sin backend la cancelación por plazo se guarda; con backend la hace el servidor. */
          if (vigentes !== prev && !hayApi) saveCitas(vigentes)
          return vigentes
        }),
      30000,
    )
    return () => window.clearInterval(id)
  }, [])

  const aplicar = (id, cambios) =>
    setCitas((prev) => prev.map((c) => (c.id === id ? { ...c, ...cambios } : c)))

  const deshacer = (cita) => setCitas((prev) => prev.map((c) => (c.id === cita.id ? cita : c)))

  /* Acción crítica: pinta, guarda y, si falla, vuelve atrás. Devuelve si salió bien. */
  const critica = async (cita, cambios, guardar, textoError) => {
    aplicar(cita.id, cambios)
    try {
      await guardar(cita, cambios)
      return true
    } catch {
      deshacer(cita)
      avisar('error', textoError)
      return false
    }
  }

  /* Acción secundaria: pinta, guarda y, si falla, se queda y se avisa. */
  const secundaria = async (cita, cambios, guardar) => {
    aplicar(cita.id, cambios)
    try {
      await guardar()
      return true
    } catch {
      avisar('aviso', TEXTO_NO_GUARDADO)
      return false
    }
  }

  const voyPaAlla = (cita) =>
    critica(cita, cambiosVoyPaAlla(), guardarVoyPaAlla, 'No pudimos confirmar tu cita. Prueba otra vez en un momento.')

  const cancelar = (cita) =>
    critica(cita, cambiosCancelar(), guardarCancelar, 'No pudimos cancelar tu cita. Prueba otra vez en un momento.')

  /** `asistencia`: 'si' | 'no' | null. */
  const marcarAsistencia = (cita, asistencia) =>
    secundaria(cita, cambiosAsistencia(asistencia), () => guardarAsistencia(cita, asistencia))

  const publicarOpinion = (cita, opinion) =>
    secundaria(cita, cambiosOpinion(opinion), () => guardarOpinion(cita, opinion))

  const omitirOpinion = (cita, omitida = true) => {
    aplicar(cita.id, { opinionOmitida: omitida })
    guardarOpinionOmitida(cita, omitida)
  }

  return {
    citas,
    estado,
    aviso,
    recargar,
    voyPaAlla,
    cancelar,
    marcarAsistencia,
    publicarOpinion,
    omitirOpinion,
  }
}
