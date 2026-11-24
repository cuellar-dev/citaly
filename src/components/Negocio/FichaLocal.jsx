import { Link } from 'react-router-dom'
import {
  ChevronRight,
  Clock3,
  Info,
  LayoutGrid,
  MessageSquareQuote,
  Percent,
  Ticket,
  UtensilsCrossed,
  Phone,
  Scissors,
  Star,
} from 'lucide-react'
import {
  COMODIDADES,
  DIAS,
  aMinutos,
  duracionTexto,
  horaAmPm,
  minutosAbierto,
  notaDeComentarios,
  precioPlanTexto,
  precioTexto,
  tipoDeLocal,
  tipoLocalTexto,
  turnosDelDia,
} from '../../utils/fichaLocal.js'
import { mesasDeLocal, textoCobroMesa } from '../../utils/mesas.js'
import { recargoDe } from '../../utils/socios.js'
import { DURACIONES_TURNO, listaTurnos, turnosDe } from '../../utils/turnos.js'
import './fichaLocal.css'

/**
 * La ficha pública del local, resumida en tres grupos de filas.
 * Cada fila enseña un dato y abre la hoja de la ficha en la pestaña que le toca.
 */
function FichaLocal({ local, onEditar, onOpiniones, onCatalogo }) {
  const servicios = local.servicios ?? []
  const precios = servicios.map((s) => Number(s.precio) || 0)
  const ini = aMinutos(local.horarioApertura)
  const fin = ini + minutosAbierto(local.horarioApertura, local.horarioCierre)
  const turnos = turnosDelDia(local.horarioApertura, local.horarioCierre, local.intervaloMinutos)
  const comodidades = COMODIDADES.filter((c) => local.iconos?.some((i) => i.id === c.id))
  const { nota, cantidad: opiniones } = notaDeComentarios(local)

  /* Lo primero de la ficha es lo que se vende, y cambia con el tipo de
     local: mesas y su cobro, planes y su recargo, o servicios. */
  const tipo = tipoDeLocal(local)
  const mesas = tipo === 'mesa' ? mesasDeLocal(local) : []
  const soloCalle = mesas.filter((m) => !m.online).length
  const planes = local.planes ?? []
  const recargo = recargoDe(local)
  const catalogo =
    tipo === 'mesa'
      ? [
          [
            {
              id: 'mesas',
              alAbrir: () => onCatalogo('mesas'),
              Icono: LayoutGrid,
              titulo: 'Mesas y plano',
              valor: [
                `${mesas.length} mesas · ${mesas.reduce((t, m) => t + m.capacidad, 0)} asientos`,
                soloCalle && `${soloCalle} solo en el local`,
              ]
                .filter(Boolean)
                .join(' · '),
            },
            {
              id: 'reservaMesa',
              alAbrir: () => onCatalogo('reservaMesa'),
              Icono: UtensilsCrossed,
              titulo: 'Precio de la reserva',
              valor: textoCobroMesa(local),
            },
          ],
        ]
      : tipo === 'suscripcion'
        ? [
            [
              {
                id: 'planes',
                alAbrir: () => onCatalogo('planes'),
                Icono: Ticket,
                titulo: 'Planes y precios',
                valor: planes.length
                  ? `${planes.length} ${planes.length === 1 ? 'plan' : 'planes'} · desde ${precioPlanTexto(
                      planes.reduce((a, b) => (Number(b.precio) < Number(a.precio) ? b : a)),
                    )}`
                  : 'Añade lo que cobras',
              },
              {
                id: 'recargo',
                alAbrir: () => onCatalogo('recargo'),
                Icono: Percent,
                titulo: 'Recargo por atraso',
                valor: recargo.porDia
                  ? [
                      `${recargo.porDia} CUP por día`,
                      recargo.diasGracia && `${recargo.diasGracia} días de gracia`,
                      recargo.tope && `tope ${recargo.tope}`,
                    ]
                      .filter(Boolean)
                      .join(' · ')
                  : 'Sin recargo',
              },
              {
                id: 'turnos',
                alAbrir: () => onCatalogo('turnos'),
                Icono: Clock3,
                titulo: 'Turnos',
                valor: (() => {
                  const config = turnosDe(local)
                  if (!config.activo) return 'Horario libre, sin turnos'
                  const duracion = DURACIONES_TURNO.find((d) => d.minutos === config.duracion)?.label ?? `${config.duracion} min`
                  return `${listaTurnos(local, config).length} turnos de ${duracion} · ${config.cupo} personas cada uno`
                })(),
              },
            ],
          ]
        : [
        [
          {
            id: 'servicios',
            alAbrir: () => onCatalogo('servicios'),
            Icono: Scissors,
            titulo: 'Servicios',
            valor: servicios.length
              ? `${servicios.length} ${servicios.length === 1 ? 'servicio' : 'servicios'} · desde ${precioTexto(Math.min(...precios))}`
              : 'Añade lo que ofreces',
          },
        ],
      ]

  /* Antes había siete filas y tres parejas abrían lo mismo (Horario y Turnos,
     Contacto y Dirección, Comodidades y Sobre el local), pasando además por
     una vista de solo lectura que repetía lo que ya enseña "Ver como
     cliente". Ahora cada fila resume un bloque y abre el editor justo en
     esa sección: ver y cambiar es un solo paso. */
  const grupos = [
    ...catalogo,
    [
      {
        id: 'horario',
        alAbrir: () => onEditar('horario'),
        Icono: Clock3,
        /* En los de suscripción los turnos tienen su propia fila (arriba). */
        titulo: tipo === 'suscripcion' ? 'Horario' : 'Horario y turnos',
        valor:
          tipo === 'suscripcion'
            ? `${horaAmPm(ini)} – ${horaAmPm(fin)} · ${local.dias.length} días a la semana`
            : `${horaAmPm(ini)} – ${horaAmPm(fin)} · ${turnos.length} turnos de ${duracionTexto(local.intervaloMinutos)}`,
        extra: (
          <span className="ficha-local-semana" aria-label={`Abre ${local.dias.length} días a la semana`}>
            {DIAS.map((d) => (
              <i key={d.id} className={local.dias.includes(d.id) ? 'abre' : undefined} />
            ))}
          </span>
        ),
      },
      {
        id: 'contacto',
        alAbrir: () => onEditar('contacto'),
        Icono: Phone,
        titulo: 'Contacto y dirección',
        valor: [local.telefono, local.direccion].filter(Boolean).join(' · ') || 'Sin rellenar',
        extra: local.whatsapp && <span className="ficha-local-pastilla">WhatsApp</span>,
      },
      {
        id: 'sobre',
        alAbrir: () => onEditar('local'),
        Icono: Info,
        titulo: 'Sobre el local',
        valor: [local.categoria, tipoLocalTexto(local), comodidades.length && `${comodidades.length} comodidades`]
          .filter(Boolean)
          .join(' · '),
        extra: comodidades.length > 0 && (
          <span className="ficha-local-iconos" aria-hidden="true">
            {comodidades.slice(0, 3).map(({ id, Icono }) => (
              <Icono key={id} size={15} strokeWidth={2} />
            ))}
          </span>
        ),
      },
    ],
    [
      {
        id: 'opiniones',
        alAbrir: onOpiniones,
        Icono: MessageSquareQuote,
        titulo: 'Opiniones',
        valor: `${opiniones} ${opiniones === 1 ? 'opinión' : 'opiniones'}`,
        extra: opiniones > 0 && (
          <span className="ficha-local-nota">
            <Star size={13} strokeWidth={2} fill="currentColor" aria-hidden="true" />
            {nota}
          </span>
        ),
      },
    ],
  ]

  return (
    <section className="ficha-local" aria-labelledby="ficha-local-titulo">
      <header className="ficha-local-cabecera">
        <div>
          <h2 id="ficha-local-titulo" className="ficha-local-titulo">
            Tu local
          </h2>
          <p className="ficha-local-sub">Lo que ven tus clientes</p>
        </div>
        <Link to={`/local/${local.id}`} className="ficha-local-ver">
          Ver como cliente
          <ChevronRight size={14} strokeWidth={2.25} aria-hidden="true" />
        </Link>
      </header>

      {grupos.map((filas) => (
        <ul key={filas[0].id} className="ficha-local-grupo">
          {filas.map(({ id, alAbrir, Icono, titulo, valor, extra }) => (
            <li key={id}>
              <button type="button" className="ficha-local-fila" onClick={alAbrir}>
                <span className="ficha-local-icono" aria-hidden="true">
                  <Icono size={17} strokeWidth={2} />
                </span>
                <span className="ficha-local-textos">
                  <span className="ficha-local-fila-titulo">{titulo}</span>
                  <span className="ficha-local-valor">{valor}</span>
                </span>
                {extra && <span className="ficha-local-extra">{extra}</span>}
                <ChevronRight className="ficha-local-flecha" size={16} strokeWidth={2} aria-hidden="true" />
              </button>
            </li>
          ))}
        </ul>
      ))}
    </section>
  )
}

export default FichaLocal
