import { useEffect, useState } from 'react'
import { ESTADOS_V_KEY, getCitas, saveCitas } from '../services/storage.js'
import { caducarPendientes } from '../utils/estadosCita.js'

/* La versión anterior usaba 1 = confirmada y 2 = pendiente de confirmar.
   Ahora 1 = por ti y 2 = confirmada. Se traduce una sola vez. */
function leerCitas() {
  let citas = getCitas()
  if (localStorage.getItem(ESTADOS_V_KEY) !== '2') {
    citas = citas.map((cita) => {
      let estado = cita.estadoReserva ?? 0
      if (estado === 1) estado = 2
      else if (estado === 2) estado = 1
      return { ...cita, estadoReserva: estado }
    })
    localStorage.setItem(ESTADOS_V_KEY, '2')
    saveCitas(citas)
  }
  const vigentes = caducarPendientes(citas)
  if (vigentes !== citas) saveCitas(vigentes)
  return vigentes
}

export function useCitas() {
  const [citas, setCitas] = useState(leerCitas)

  useEffect(() => {
    const tick = () => {
      setCitas((prev) => {
        const vigentes = caducarPendientes(prev)
        if (vigentes === prev) return prev
        saveCitas(vigentes)
        return vigentes
      })
    }
    const id = setInterval(tick, 30000)
    return () => clearInterval(id)
  }, [])

  const updateCitas = (nuevasCitas) => {
    setCitas(nuevasCitas)
    saveCitas(nuevasCitas)
  }

  const agregarCita = (cita) => {
    setCitas((prev) => {
      const next = [...prev, cita]
      saveCitas(next)
      return next
    })
  }

  const actualizarCita = (id, cambios) => {
    setCitas((prev) => {
      const next = prev.map((cita) => (cita.id === id ? { ...cita, ...cambios } : cita))
      saveCitas(next)
      return next
    })
  }

  return { citas, updateCitas, agregarCita, actualizarCita }
}
