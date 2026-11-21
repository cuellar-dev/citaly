import { useEffect, useState } from 'react'
import { saveCitas } from '../services/storage.js'
import { leerCitasLocales } from '../services/misCitas.js'
import { caducarPendientes } from '../utils/estadosCita.js'

/* Las citas de este navegador, síncronas: las usan las pantallas de reservar,
   la ficha del local y el editor del plano. Mis citas (la lista del cliente)
   usa useMisCitas, que además sabe hablar con el backend. */
export function useCitas() {
  const [citas, setCitas] = useState(leerCitasLocales)

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
