import { addDays, format } from 'date-fns'
import { es } from 'date-fns/locale'
import locales from './locales.json'

/* Notificaciones de prueba de la cuenta de Laura (dueña de Sara).

   ambito: 'personal' → lo que le pasa a ella como clienta.
           'negocio'  → lo que pasa en su local.
   tipo:   decide el dibujo y el tono (ver IconoNoti).
   plazo:  minutos que tiene para actuar desde creadaEn. Si existe, la fila
           sale como urgente con la cuenta atrás.

   Las fechas se calculan desde ahora para que la demo siempre parezca viva. */

function hace(minutos) {
  return new Date(Date.now() - minutos * 60 * 1000).toISOString()
}

/* El resumen del día sale a la hora de cierre del local: si hoy ya cerró es
   el de hoy, si no, el de ayer. */
function cierreDelDia(idLocal) {
  const [h, m] = (locales.find((l) => l.id === idLocal)?.horarioCierre ?? '18:00').split(':').map(Number)
  const cierre = new Date()
  cierre.setHours(h, m, 0, 0)
  if (cierre > new Date()) cierre.setDate(cierre.getDate() - 1)
  return cierre.toISOString()
}

function diaTexto(offset) {
  const texto = format(addDays(new Date(), offset), 'EEEE d', { locale: es })
  return texto.charAt(0).toUpperCase() + texto.slice(1)
}

export function notificacionesDemo() {
  return [
    /* ---------- Personales ---------- */
    {
      id: 'p-por-ti-almedio',
      ambito: 'personal',
      tipo: 'porTi',
      titulo: 'Al Medio aceptó tu mesa',
      texto: `Mesa 4 el ${diaTexto(3).toLowerCase()} a las 7:00 PM. Confirma que vas o se libera.`,
      creadaEn: hace(6),
      plazo: 15,
      enlace: '/citas',
      accion: 'Confirmar que voy',
    },
    {
      id: 'p-recordatorio-sara',
      ambito: 'personal',
      tipo: 'recordatorio',
      titulo: 'Mañana te toca en Glam Studio',
      texto: 'Corte dama a las 10:00 AM con Lianet. Llega 5 min antes.',
      creadaEn: hace(48),
      enlace: '/citas',
    },
    {
      id: 'p-cierre-navaja',
      ambito: 'personal',
      tipo: 'cierre',
      titulo: 'Navaja de Oro cerró hoy',
      texto: 'Se fue la corriente en el local. Tu cita de las 4:30 PM se movió al viernes a la misma hora.',
      creadaEn: hace(130),
      enlace: '/local/navaja-de-oro',
    },
    {
      id: 'p-rechazada-diva',
      ambito: 'personal',
      tipo: 'rechazada',
      titulo: 'Diva Nails no pudo atenderte',
      texto: '“Ese día estamos de inventario, perdona.” Mira otro hueco en su agenda.',
      creadaEn: hace(60 * 5),
      enlace: '/local/diva-nails',
    },
    {
      id: 'p-caducada-caballero',
      ambito: 'personal',
      tipo: 'caducada',
      titulo: 'Tu cita en Caballero Fino caducó',
      texto: 'El local no respondió en 15 min y se canceló sola. Puedes pedir otro hueco.',
      creadaEn: hace(60 * 24 + 40),
      enlace: '/local/caballero-fino',
      accion: 'Pedir otro hueco',
    },
    {
      id: 'p-respuesta-glam',
      ambito: 'personal',
      tipo: 'respuesta',
      titulo: 'Glam Studio respondió a tu opinión',
      texto: '“Gracias, Laura. Hablamos con el equipo: el secado no se apura más.”',
      creadaEn: hace(60 * 24 * 2 + 90),
      /* Lleva a tu comentario en la ficha, abierto y resaltado. */
      enlace: '/local/glam-studio?opinion=laura-mendez-1',
      accion: 'Ver respuesta',
    },
    {
      id: 'p-hueco-grano',
      ambito: 'personal',
      tipo: 'hueco',
      titulo: 'Grano y Nube tiene mesa esta tarde',
      texto: 'Uno de tus guardados. Quedan 2 mesas libres entre las 5 y las 7.',
      creadaEn: hace(60 * 26),
      enlace: '/local/grano-y-nube',
      leida: true,
    },
    {
      id: 'p-resena-itaka',
      ambito: 'personal',
      tipo: 'resena',
      titulo: '¿Qué tal en Itaka?',
      texto: 'Estuviste el sábado. Tu opinión ayuda a quien va después.',
      creadaEn: hace(60 * 30),
      enlace: '/local/itaka',
      accion: 'Opinar',
      leida: true,
    },
    {
      id: 'p-nuevo-verde',
      ambito: 'personal',
      tipo: 'nuevo',
      titulo: 'Abrió Verde Vivo, cerca de ti',
      texto: 'Comida saludable en Cabaiguán. Ya acepta reservas.',
      creadaEn: hace(60 * 24 * 9),
      enlace: '/local/verde-vivo',
      leida: true,
    },

    /* ---------- Negocio ---------- */
    {
      id: 'n-reserva-lisandra',
      ambito: 'negocio',
      tipo: 'reserva',
      titulo: 'Lisandra Pérez quiere cita',
      texto: 'Manicura con Sofía, hoy a las 9:00 AM. Si no la aceptas, se cancela sola.',
      creadaEn: hace(4),
      plazo: 15,
      enlace: '/negocio',
      accion: 'Ver y aceptar',
    },
    {
      id: 'n-caduca-gretel',
      ambito: 'negocio',
      tipo: 'porCaducar',
      titulo: 'La cita de Gretel Rodríguez está por caducar',
      texto: 'Corte dama a las 12:00 PM con Sofía. Acéptala ya o se cancela sola.',
      creadaEn: hace(12),
      plazo: 15,
      enlace: '/negocio',
      accion: 'Aceptar ahora',
    },
    {
      id: 'n-pausa-agenda',
      ambito: 'negocio',
      tipo: 'pausa',
      titulo: 'Tu agenda lleva 3 h en pausa',
      texto: 'Desde la 1:00 PM nadie puede reservar en Sara. ¿Seguro que no se te olvidó?',
      creadaEn: hace(35),
      enlace: '/negocio',
      accion: 'Reanudar',
    },
    {
      id: `n-resumen-${cierreDelDia('sara').slice(0, 10)}`,
      ambito: 'negocio',
      tipo: 'resumen',
      titulo: 'Así cerraste el día: 7 citas',
      texto: '5 atendidas, 1 cancelada y 1 no vino. Entraron $3 250 y la hora más llena fue las 10:30 AM.',
      creadaEn: cierreDelDia('sara'),
      enlace: '/negocio',
      accion: 'Ver el día',
    },
    {
      id: 'n-voy-yosvany',
      ambito: 'negocio',
      tipo: 'confirmo',
      titulo: 'Yosvany Morales va para allá',
      texto: 'Confirmó su corte de las 10:30 AM con Carlos.',
      creadaEn: hace(22),
      enlace: '/negocio',
    },
    {
      id: 'n-cancelo-ernesto',
      ambito: 'negocio',
      tipo: 'cancelo',
      titulo: 'Ernesto Báez canceló',
      texto: 'Corte caballero de la 1:30 PM. Ese turno vuelve a estar libre.',
      creadaEn: hace(75),
      enlace: '/negocio',
    },
    {
      id: 'n-lleno-manana',
      ambito: 'negocio',
      tipo: 'lleno',
      titulo: 'Mañana tienes el día completo',
      texto: 'Los 6 turnos reservados. Estimado del día: $2 400.',
      creadaEn: hace(60 * 3),
      enlace: '/negocio',
    },
    {
      id: 'n-equipo-miguel',
      ambito: 'negocio',
      tipo: 'equipo',
      titulo: 'Miguel Torres dice que trabaja aquí',
      texto: 'Confírmalo y saldrá en tu equipo para que lo reserven.',
      creadaEn: hace(60 * 24 * 12),
      enlace: '/negocio',
      accion: 'Revisar',
    },
    {
      id: 'n-opinion-dayana',
      ambito: 'negocio',
      tipo: 'opinion',
      titulo: 'Dayana Ruiz dejó una opinión',
      texto: '“El tinte quedó igualito a la foto que le enseñé.”',
      creadaEn: hace(60 * 24 * 4),
      enlace: '/local/sara',
      leida: true,
    },
  ]
}
