import { getCitas, saveCitas } from '../../services/storage.js'

/* Convierte la cita que devuelve el servidor del chat al formato de Citaly
   (el mismo que crea ReservarSinLugar) y la guarda para que salga en Mis Citas. */
export function guardarCitaDelChat(cita) {
  const servicios = cita.servicio ? [cita.servicio] : []
  const nueva = {
    id: crypto.randomUUID(),
    esLugar: false,
    localId: cita.localId,
    localNombre: cita.localNombre,
    fecha: cita.fecha,
    horario: cita.hora,
    servicios,
    precioTotal: servicios.reduce((t, s) => t + (s.precio ?? 0), 0),
    demoraMinutos: servicios.reduce((t, s) => t + (s.duracion ?? 0), 0) || null,
    estadoReserva: 0,
    creadaEn: new Date().toISOString(),
    origen: 'chat-taly',
  }
  saveCitas([...getCitas(), nueva])
  return nueva
}
