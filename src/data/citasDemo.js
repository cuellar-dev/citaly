import { addDays, format, subDays } from 'date-fns'

function dia(offset, hora) {
  const fecha = offset >= 0 ? addDays(new Date(), offset) : subDays(new Date(), Math.abs(offset))
  return { fecha: format(fecha, 'yyyy-MM-dd'), horario: hora }
}

/** Citas de prueba (servicio + mesa, próximas + pasadas). Solo se usan si el storage está vacío. */
export function citasDemo() {
  const ahora = new Date().toISOString()
  return [
    {
      id: 'demo-sara-proxima',
      esLugar: false,
      localId: 'sara',
      localNombre: 'Sara',
      ...dia(1, '10:00'),
      servicios: [
        { id: 'corte-dama', nombre: 'Corte dama', precio: 450, duracion: '45 min' },
        { id: 'manicura', nombre: 'Manicura', precio: 250, duracion: '40 min' },
      ],
      profesional: { id: 'pro-sara-1', name: 'Laura Méndez' },
      precioTotal: 700,
      demoraMinutos: 85,
      estadoReserva: 1,
      creadaEn: ahora,
    },
    {
      id: 'demo-almedio-proxima',
      esLugar: true,
      localId: 'al-medio-1',
      localNombre: 'Al Medio',
      ...dia(3, '19:00'),
      mesa: {
        id: 'm-4',
        codigo: 'MESA-4',
        capacidad: 4,
        ubicacion: 'Salón principal',
      },
      precioReserva: 0,
      consumoMinimo: 2000,
      estadoReserva: 0,
      creadaEn: ahora,
    },
    {
      id: 'demo-sara-hoy',
      esLugar: false,
      localId: 'sara',
      localNombre: 'Sara',
      ...dia(0, '16:30'),
      servicios: [{ id: 'corte-caballero', nombre: 'Corte caballero', precio: 300, duracion: '30 min' }],
      profesional: { id: 'pro-sara-2', name: 'Carlos Ruiz' },
      precioTotal: 300,
      demoraMinutos: 30,
      estadoReserva: 2,
      creadaEn: ahora,
    },
    {
      id: 'demo-itaka-proxima',
      esLugar: true,
      localId: 'itaka',
      localNombre: 'Itaka',
      ...dia(6, '21:00'),
      mesa: {
        id: 'm-5',
        codigo: 'MESA-5',
        capacidad: 4,
        ubicacion: 'Frente al escenario',
      },
      precioReserva: 0,
      consumoMinimo: 2000,
      estadoReserva: 1,
      creadaEn: ahora,
    },
    {
      id: 'demo-sara-pasada',
      esLugar: false,
      localId: 'sara',
      localNombre: 'Sara',
      ...dia(-5, '11:00'),
      servicios: [{ id: 'tinte', nombre: 'Tinte completo', precio: 1200, duracion: '2h' }],
      profesional: { id: 'pro-sara-1', name: 'Laura Méndez' },
      precioTotal: 1200,
      demoraMinutos: 120,
      estadoReserva: 1,
      creadaEn: ahora,
    },
    {
      id: 'demo-almedio-pasada',
      esLugar: true,
      localId: 'al-medio-1',
      localNombre: 'Al Medio',
      ...dia(-2, '13:00'),
      mesa: {
        id: 'm-1',
        codigo: 'MESA-1',
        capacidad: 2,
        ubicacion: 'Junto a la entrada',
      },
      precioReserva: 0,
      consumoMinimo: 2000,
      estadoReserva: 3,
      creadaEn: ahora,
    },
  ]
}
