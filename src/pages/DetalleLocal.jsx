import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { useEffect, useMemo, useState } from 'react'
import { format } from 'date-fns'
import { ArrowLeft } from 'lucide-react'
import { getLocalById } from '../services/locales.js'
import { saveFicha } from '../services/storage.js'
import { useCitas } from '../hooks/useCitas.js'
import { fotosDe, notaDeComentarios } from '../utils/fichaLocal.js'
import { estadoApertura } from '../utils/descubre.js'
import { CONFIRMADA } from '../utils/estadosCita.js'
import HeroLocal from '../components/DetalleLocal/HeroLocal.jsx'
import PestanasLocal from '../components/DetalleLocal/PestanasLocal.jsx'
import ServiciosLocal from '../components/DetalleLocal/ServiciosLocal.jsx'
import OpinionesLocal from '../components/DetalleLocal/OpinionesLocal.jsx'
import InfoLocal from '../components/DetalleLocal/InfoLocal.jsx'
import BarraReservaLocal from '../components/DetalleLocal/BarraReservaLocal.jsx'
import AvisoBreve from '../components/DetalleLocal/AvisoBreve.jsx'
import { TrazoCosido } from '../components/DetalleLocal/Tinta.jsx'
import { useCompartir } from '../components/DetalleLocal/useCompartir.js'
import VisorImagen from '../components/VisorImagen/VisorImagen.jsx'
import TalyMomento from '../components/Taly/TalyMomento.jsx'
import taly404 from '../components/Taly/taly-404-animado.svg'
import './DetalleLocal.css'

/* La ficha del local es su escaparate: está ordenada como un embudo.
   Primero lo que convence (fotos, nota, qué ofrece y a qué precio, qué dice
   la gente) y al final lo práctico (horario, cómo llegar, contacto). El botón
   de reservar va siempre a mano, en la barra de abajo. */
function DetalleLocal() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [local, setLocal] = useState(() => getLocalById(id))
  const [imagenActiva, setImagenActiva] = useState(null)
  const [comentarioNuevoId, setComentarioNuevoId] = useState(null)
  const { citas } = useCitas()
  const { compartir, aviso } = useCompartir(local)

  /* ?opinion=<id> llega desde Notificaciones ("respondió a tu opinión"): ese
     comentario sale abierto y resaltado, y la página baja hasta él. */
  const [searchParams] = useSearchParams()
  const opinionPedida = searchParams.get('opinion')

  useEffect(() => {
    if (!opinionPedida) return undefined
    /* Un frame de espera: el Layout sube el scroll arriba al cambiar de ruta,
       y su efecto corre después que este. */
    const frame = requestAnimationFrame(() => {
      const suave = !window.matchMedia('(prefers-reduced-motion: reduce)').matches
      document
        .getElementById(`opinion-${opinionPedida}`)
        ?.scrollIntoView({ block: 'center', behavior: suave ? 'smooth' : 'auto' })
    })
    return () => cancelAnimationFrame(frame)
  }, [opinionPedida])

  /* Cada local con su título en la pestaña (y en el historial). */
  const nombre = local?.localName
  useEffect(() => {
    if (!nombre) return undefined
    const previo = document.title
    document.title = `${nombre} · Citaly`
    return () => {
      document.title = previo
    }
  }, [nombre])

  const servicios = useMemo(() => local?.servicios ?? [], [local])
  const secciones = useMemo(
    () => [
      { id: 'local-servicios', label: local?.lugar ? 'Reservas' : 'Servicios' },
      { id: 'local-opiniones', label: 'Opiniones', cuenta: local?.comentarios?.length || null },
      { id: 'local-info', label: 'Info' },
    ],
    [local],
  )

  if (!local) {
    return (
      <section className="detalle-local detalle-local--error">
        <Link to="/" className="detalle-local-volver">
          <ArrowLeft size={20} />
          Volver a Descubre
        </Link>
        <TalyMomento
          ilustracion={<img src={taly404} alt="Taly buscando un local" />}
          titulo="Local no encontrado"
          texto={`No existe un local con el id “${id}”. Revisa el enlace e inténtalo de nuevo.`}
          accion="Volver a Descubre"
          onAccion={() => navigate('/')}
        />
      </section>
    )
  }

  const estado = estadoApertura(local)
  const { nota, cantidad } = notaDeComentarios(local)
  const fotos = fotosDe(local)

  const precios = servicios.map((s) => Number(s.precio) || 0).filter((p) => p > 0)
  const desde = precios.length ? `${Math.min(...precios)} CUP` : null

  /* Cifras que no repiten lo que ya dice la cabecera (la nota va arriba). */
  const cifras = [
    servicios.length ? { valor: desde ?? 'Gratis', label: desde ? 'Desde' : 'Reserva' } : null,
    servicios.length
      ? { valor: servicios.length, label: local.lugar ? 'Opciones' : servicios.length === 1 ? 'Servicio' : 'Servicios' }
      : null,
    { valor: `${local.metros} m`, label: 'Distancia' },
  ].filter(Boolean)

  /* Solo opina quien ya tuvo una cita confirmada aquí (hoy o antes). */
  const hoy = format(new Date(), 'yyyy-MM-dd')
  const puedeOpinar = citas.some(
    (c) => c.localId === id && c.estadoReserva === CONFIRMADA && c.fecha && c.fecha <= hoy,
  )

  function reservar(servicioId) {
    if (local.lugar) {
      navigate(`/local/${id}/reservar`)
      return
    }
    const sufijo = servicioId ? `?servicio=${encodeURIComponent(servicioId)}` : ''
    navigate(`/local/${id}/reservar-cita${sufijo}`)
  }

  function publicarOpinion({ comentario, calificacion }) {
    const nuevo = {
      id: crypto.randomUUID(),
      nombre: 'Tú',
      fecha: hoy,
      calificacion,
      comentario,
    }
    const comentarios = [nuevo, ...(local.comentarios ?? [])]
    const resumen = notaDeComentarios({ comentarios })
    const cambios = { comentarios, points: String(resumen.nota), opiniones: resumen.cantidad }
    saveFicha(id, cambios)
    setLocal((prev) => ({ ...prev, ...cambios }))
    setComentarioNuevoId(nuevo.id)
  }

  const notaBarra = [cantidad ? `★ ${nota}` : null, estado.texto].filter(Boolean).join(' · ')

  return (
    <article className="detalle-local">
      <HeroLocal
        local={local}
        fotos={fotos}
        estado={estado}
        nota={nota}
        cantidad={cantidad}
        onCompartir={compartir}
        onAbrirFoto={setImagenActiva}
      />

      <PestanasLocal secciones={secciones} />

      <div className="detalle-local-body">
        <div className="detalle-local-entra" style={{ '--i': 0 }}>
          <dl className="detalle-local-cifras">
            {cifras.map((c) => (
              <div key={c.label} className="detalle-local-cifra">
                <dt>{c.label}</dt>
                <dd>{c.valor}</dd>
              </div>
            ))}
          </dl>

          {local.descripcion ? (
            <div className="detalle-local-descripcion">
              <h2 className="detalle-local-titulo">{local.localName} es…</h2>
              <p>{local.descripcion}</p>
            </div>
          ) : null}
        </div>

        <section
          id="local-servicios"
          className="detalle-local-seccion detalle-local-entra"
          style={{ '--i': 1 }}
          aria-labelledby="local-servicios-titulo"
        >
          <h2 id="local-servicios-titulo" className="detalle-local-titulo">
            {local.lugar ? 'Qué puedes reservar' : 'Servicios'}
          </h2>
          <ServiciosLocal servicios={servicios} lugar={local.lugar} onReservar={reservar} />
        </section>

        <TrazoCosido />

        <section
          id="local-opiniones"
          className="detalle-local-seccion detalle-local-entra"
          style={{ '--i': 2 }}
          aria-labelledby="local-opiniones-titulo"
        >
          <h2 id="local-opiniones-titulo" className="detalle-local-titulo">
            Opiniones
          </h2>
          <OpinionesLocal
            comentarios={local.comentarios ?? []}
            nota={nota}
            cantidad={cantidad}
            opinionPedida={opinionPedida}
            comentarioNuevoId={comentarioNuevoId}
            puedeOpinar={puedeOpinar}
            onPublicar={publicarOpinion}
          />
        </section>

        <TrazoCosido pluma={false} />

        <section
          id="local-info"
          className="detalle-local-seccion detalle-local-entra"
          style={{ '--i': 3 }}
          aria-labelledby="local-info-titulo"
        >
          <h2 id="local-info-titulo" className="detalle-local-titulo">
            Info práctica
          </h2>
          <InfoLocal local={local} estado={estado} />
        </section>
      </div>

      <BarraReservaLocal precio={desde} nota={notaBarra} lugar={local.lugar} onReservar={() => reservar()} />

      {imagenActiva ? (
        <VisorImagen url={imagenActiva} alt={`Foto de ${local.localName}`} onClose={() => setImagenActiva(null)} />
      ) : null}

      <AvisoBreve texto={aviso} />
    </article>
  )
}

export default DetalleLocal
