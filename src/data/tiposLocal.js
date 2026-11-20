import { CalendarClock, Ticket, UtensilsCrossed } from 'lucide-react'

/* Los tres tipos de local que hay en Citaly, explicados para quien no ha
   usado nunca una app de reservas. El tipo decide cómo reservan los clientes
   y qué panel ve el dueño en Mi Negocio; por eso se elige en el primer paso
   y no se puede cambiar luego sin escribirnos. */

export const TIPOS = [
  {
    id: 'servicio',
    nombre: 'Citas',
    Icono: CalendarClock,
    corto: 'El cliente viene a una hora a que le hagas algo.',
    paraQuien: 'Peluquerías, barberías, uñas, spa, tatuajes, talleres…',
    comoFunciona: [
      'Pones tus servicios con su precio y lo que tardan (un corte, 30 min).',
      'El cliente elige servicio, día y hora libre de tu agenda.',
      'Tú aceptas o rechazas cada cita desde Mi Negocio.',
    ],
    pista: '¿Atiendes a una persona detrás de otra? Este es el tuyo.',
    categorias: ['Peluquería', 'Barbería', 'Uñas', 'Spa', 'Tatuajes', 'Arte y talleres'],
  },
  {
    id: 'mesa',
    nombre: 'Mesas',
    Icono: UtensilsCrossed,
    corto: 'El cliente reserva un sitio para sentarse.',
    paraQuien: 'Restaurantes, cafeterías, bares, terrazas, paladares…',
    comoFunciona: [
      'Tu sala sale como un plano con las mesas y sus sillas.',
      'El cliente elige mesa, día, hora y cuántos van.',
      'Decides si reservar es gratis, con consumo mínimo o con precio.',
    ],
    pista: '¿La gente viene a comer o a tomar algo? Este.',
    categorias: ['Restaurante', 'Cafetería', 'Bar', 'Terraza', 'Comida saludable', 'Ocio'],
  },
  {
    id: 'suscripcion',
    nombre: 'Mensual',
    Icono: Ticket,
    corto: 'El cliente se apunta y paga cada mes.',
    paraQuien: 'Gimnasios, academias, clases de baile, idiomas, cursos…',
    comoFunciona: [
      'Pones tus planes: precio al mes y lo que incluye cada uno.',
      'El cliente pide unirse y tú lo aceptas como socio.',
      'Llevas los pagos, quién se atrasa y, si quieres, los turnos.',
    ],
    pista: '¿Tus clientes vuelven todas las semanas y pagan por mes? Este.',
    categorias: ['Gimnasio', 'Arte y talleres', 'Ocio', 'Spa'],
  },
]

export function getTipo(id) {
  return TIPOS.find((t) => t.id === id) ?? null
}

/* Cómo se guarda cada tipo en el local (ver utils/fichaLocal.js → tipoDeLocal). */
export function banderasDeTipo(id) {
  if (id === 'mesa') return { lugar: true, suscripcion: false }
  if (id === 'suscripcion') return { lugar: false, suscripcion: true }
  return { lugar: false, suscripcion: false }
}

/* La forma legal solo ayuda a quien revisa: no se enseña a los clientes. */
export const FORMAS_LEGALES = [
  { id: 'tcp', label: 'Trabajador por cuenta propia' },
  { id: 'mipyme', label: 'Mipyme' },
  { id: 'cooperativa', label: 'Cooperativa' },
  { id: 'estatal', label: 'Estatal' },
  { id: 'tramite', label: 'Lo estoy tramitando' },
]
