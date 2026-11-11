import { Link } from 'react-router-dom'
import {
  ChevronRight,
  Clock3,
  Info,
  MessageSquareQuote,
  Phone,
  Scissors,
  Star,
  Users,
} from 'lucide-react'
import {
  COMODIDADES,
  DIAS,
  aMinutos,
  duracionTexto,
  fotoAncho,
  horaAmPm,
  iniciales,
  minutosAbierto,
  notaDeComentarios,
  precioTexto,
  tipoLocalTexto,
  turnosDelDia,
} from '../../utils/fichaLocal.js'
import { profesionalesActivos } from '../../services/usuarios.js'
import './fichaLocal.css'

/**
 * La ficha pública del local, resumida en tres grupos de filas.
 * Cada fila enseña un dato y abre la hoja de la ficha en la pestaña que le toca.
 */
function FichaLocal({ local, onEditar, onOpiniones, onCatalogo }) {
  const servicios = local.servicios ?? []
  const profesionales = local.profesionales ?? []
  const activos = profesionalesActivos(local).length
  const pendientes = profesionales.length - activos
  const precios = servicios.map((s) => Number(s.precio) || 0)
  const ini = aMinutos(local.horarioApertura)
  const fin = ini + minutosAbierto(local.horarioApertura, local.horarioCierre)
  const turnos = turnosDelDia(local.horarioApertura, local.horarioCierre, local.intervaloMinutos)
  const comodidades = COMODIDADES.filter((c) => local.iconos?.some((i) => i.id === c.id))
  const { nota, cantidad: opiniones } = notaDeComentarios(local)

  /* Solo los locales de citas tienen catálogo; los de mesas no lo usan al reservar. */
  const catalogo = local.lugar
    ? []
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
          {
            id: 'equipo',
            alAbrir: () => onCatalogo('equipo'),
            Icono: Users,
            titulo: 'Equipo',
            valor: profesionales.length
              ? [
                  `${activos} ${activos === 1 ? 'activo' : 'activos'}`,
                  pendientes && `${pendientes} ${pendientes === 1 ? 'invitación' : 'invitaciones'}`,
                ]
                  .filter(Boolean)
                  .join(' · ')
              : 'Añade quién atiende',
            extra: profesionales.length > 0 && (
              <span className="ficha-local-pila" aria-hidden="true">
                {profesionales.slice(0, 3).map((p) =>
                  p.url ? (
                    <img key={p.id} src={fotoAncho(p.url, 56)} alt="" width={26} height={26} loading="lazy" decoding="async" />
                  ) : (
                    <span key={p.id}>{iniciales(p.name)}</span>
                  )
                )}
                {profesionales.length > 3 && <span>+{profesionales.length - 3}</span>}
              </span>
            ),
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
        titulo: 'Horario y turnos',
        valor: `${horaAmPm(ini)} – ${horaAmPm(fin)} · ${turnos.length} turnos de ${duracionTexto(local.intervaloMinutos)}`,
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
        valor: [local.categoria, tipoLocalTexto(local.lugar), comodidades.length && `${comodidades.length} comodidades`]
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
        valor: `${opiniones} opiniones`,
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
