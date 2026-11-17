import { addDays, addMonths, format } from 'date-fns'

/* La suscripción de prueba del cliente: socia de Energym desde hace unos
   meses, en el turno de las 6 de la tarde. Solo se siembra una vez. */
export function suscripcionesDemo(hoy = new Date()) {
  const iso = (d) => format(d, 'yyyy-MM-dd')
  return [
    {
      id: 'demo-sus-energym',
      localId: 'energym',
      localNombre: 'Energym',
      plan: { id: 'plan-completo', nombre: 'Completo', precio: 2200, periodo: 'mes' },
      turno: '18:00',
      turnoTexto: '6:00 PM – 7:30 PM',
      /* 1 = el local la aceptó: ya es socia. */
      estado: 1,
      desde: iso(addMonths(hoy, -4)),
      proximoPago: iso(addDays(hoy, 6)),
      creadaEn: addMonths(hoy, -4).toISOString(),
    },
  ]
}
