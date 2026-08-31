import { useState } from 'react'
import { getCitas, saveCitas } from '../services/storage.js'

export function useCitas() {
  const [citas, setCitas] = useState(() => getCitas())

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

  return { citas, updateCitas, agregarCita }
}
