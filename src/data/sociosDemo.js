import { addDays, addMonths, format } from 'date-fns'
import { getSuscripciones } from '../services/storage.js'

/* Los socios de prueba del local de suscripción (el ejemplo es Energym).
   Las fechas se calculan desde hoy para que siempre haya de todo: gente al
   día, alguno que paga hoy o mañana, otro en los días de gracia y un par de
   atrasados con recargo. Más las solicitudes que llegaron desde "Unirme". */

const SOCIOS = [
  // [nombre, teléfono, plan, días hasta el pago, meses de socio]
  ['Ana García', '+53 5412 7781', 'plan-completo', 12, 14],
  ['Jorge Martínez', '+53 5288 4410', 'plan-basico', -9, 6],
  ['Sofía Pérez', '+53 5367 1129', 'plan-personal', 2, 9],
  ['David Sánchez', '+53 5340 8865', 'plan-completo', 0, 3],
  ['Carmen Díaz', '+53 5590 2037', 'plan-basico', 21, 22],
  ['Elena Ruiz', '+53 5221 6643', 'plan-completo', -1, 5],
  ['Raúl Fonseca', '+53 5318 9902', 'plan-basico', -4, 2],
  ['Lianet Varona', '+53 5476 1150', 'plan-completo', 7, 11],
  ['Osniel Cabrera', '+53 5263 3381', 'plan-personal', 1, 4],
  ['Daylín Marrero', '+53 5390 7724', 'plan-basico', 17, 1],
  ['Yunior Llanes', '+53 5244 0016', 'plan-completo', 26, 8],
]

const SOLICITUDES = [
  ['Mónica Herrera', '+53 5302 5571', 'plan-completo', 0],
  ['Ernesto Guerra', '+53 5419 2268', 'plan-basico', 1],
]

const iso = (d) => format(d, 'yyyy-MM-dd')

export function sociosDemo(local, hoy = new Date()) {
  const planes = local.planes ?? []
  const precio = (planId) => Number(planes.find((p) => p.id === planId)?.precio) || 0

  const activos = SOCIOS.map(([nombre, telefono, planId, dias, meses], i) => {
    const proximo = addDays(hoy, dias)
    const ultimo = addMonths(proximo, -1)
    return {
      id: `socio-${i + 1}`,
      nombre,
      telefono,
      planId,
      desde: iso(addMonths(ultimo, -(meses - 1))),
      proximoPago: iso(proximo),
      estado: 'activo',
      pagos: [
        { fecha: iso(addMonths(ultimo, -1)), monto: precio(planId), recargo: 0 },
        { fecha: iso(ultimo), monto: precio(planId), recargo: 0 },
      ],
    }
  })

  const bajas = [
    {
      id: 'socio-baja-1',
      nombre: 'Rafael Ortega',
      telefono: '+53 5277 4409',
      planId: 'plan-basico',
      desde: iso(addMonths(hoy, -8)),
      proximoPago: iso(addDays(hoy, -40)),
      estado: 'baja',
      pagos: [],
    },
  ]

  const solicitudes = SOLICITUDES.map(([nombre, telefono, planId, haceDias], i) => ({
    id: `solicitud-${i + 1}`,
    nombre,
    telefono,
    planId,
    desde: iso(addDays(hoy, -haceDias)),
    proximoPago: iso(hoy),
    estado: 'solicitud',
    pagos: [],
  }))

  /* Las que mandaste tú desde la pantalla de Unirme también llegan aquí. */
  const tuyas = getSuscripciones()
    .filter((s) => s.localId === local.id && s.estado === 0)
    .map((s) => ({
      id: s.id,
      nombre: 'Tú (desde Unirme)',
      telefono: '',
      planId: s.plan.id,
      desde: s.creadaEn.slice(0, 10),
      proximoPago: iso(hoy),
      estado: 'solicitud',
      pagos: [],
    }))

  return [...tuyas, ...solicitudes, ...activos, ...bajas]
}
