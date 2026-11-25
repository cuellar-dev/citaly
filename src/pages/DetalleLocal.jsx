import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { distanciaATi } from '../utils/distancia.js'
import { getUbicacion } from '../services/ubicacion.js'
import { useEffect, useMemo, useState } from 'react'
import { format } from 'date-fns'
import { ArrowLeft } from 'lucide-react'
import { useLocal } from '../hooks/useLocal.js'
import { hayApi } from '../services/api.js'
import { idUsuarioActual } from '../services/sesion.js'
import { cargarMisCitas, guardarOpinion } from '../services/misCitas.js'
import { PaginaEsqueleto } from '../components/Esqueletos/Esqueletos.jsx'
import { saveFicha } from '../services/storage.js'
import { useCitas } from '../hooks/useCitas.js'
import { TIPOS_LOCAL, fotosDe, notaDeComentarios, precioPlanTexto, tipoDeLocal } from '../utils/fichaLocal.js'
import { estadoApertura } from '../utils/descubre.js'
import { CONFIRMADA } from '../utils/estadosCita.js'
import HeroLocal from '../components/DetalleLocal/HeroLocal.jsx'
import PestanasLocal from '../components/DetalleLocal/PestanasLocal.jsx'
import ServiciosLocal from '../components/DetalleLocal/ServiciosLocal.jsx'
import PlanesPrecio from '../components/PlanesPrecio/PlanesPrecio.jsx'
import { ofertaMesas } from '../utils/mesas.js'
import OpinionesLocal from '../components/DetalleLocal/OpinionesLocal.jsx'
import InfoLocal from '../components/DetalleLocal/InfoLocal.jsx'
import LocalesCercanos from '../components/DetalleLocal/LocalesCercanos.jsx'
import BarraReservaLocal from '../components/DetalleLocal/BarraReservaLocal.jsx'
import AvisoBreve from '../components/DetalleLocal/AvisoBreve.jsx'
import { TrazoCosido } from '../components/DetalleLocal/Tinta.jsx'
import { useCompartir } from '../components/DetalleLocal/useCompartir.js'
import { aplicarDatosEstructurados, urlPublica, useMetaPagina } from '../hooks/useMetaPagina.js'
import { datosEstructuradosLocal, metaDeLocal } from '../utils/metaLocal.js'
import VisorImagen from '../components/VisorImagen/VisorImagen.jsx'
import TalyMomento from '../components/Taly/TalyMomento.jsx'
import taly404 from '../components/Taly/taly-404-animado.svg'
import './DetalleLocal.css'

const ETIQUETA_PESTANA = { mesa: 'Reservas', servicio: 'Servicios', suscripcion: 'Planes' }
const TITULO_SECCION = { mesa: 'Qué puedes reservar', servicio: 'Servicios', suscripcion: 'Planes y precios' }

function etiquetaCuenta(tipo, n) {
  if (tipo === 'mesa') return 'Opciones'
  if (tipo === 'suscripcion') return n === 1 ? 'Plan' : 'Planes'
  return n === 1 ? 'Servicio' : 'Servicios'
}

/* La ficha del local es su escaparate: está ordenada como un embudo.
   Primero lo que convence (fotos, nota, qué ofrece y a qué precio, qué dice
   la gente) y al final lo práctico (horario, cómo llegar, contacto). El botón
   de reservar va siempre a mano, en la barra de abajo. */
function DetalleLocal() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { local, setLocal, fresco } = useLocal(id)
  const [imagenActiva, setImagenActiva] = useState(null)
  const [comentarioNuevoId, setComentarioNuevoId] = useState(null)
  const { citas } = useCitas()
  const [citasCuenta, setCitasCuenta] = useState([])
  const [errorOpinion, setErrorOpinion] = useState(null)
  useEffect(() => {
    if (!hayApi || !idUsuarioActual()) return undefined
    let vivo = true
    cargarMisCitas()
      .then((lista) => {
        if (vivo) setCitasCuenta(lista)
      })
      .catch(() => {})
    return () => {
      vivo = false
    }
  }, [id])
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

  /* Cada local con su título, descripción y foto (pestaña, Google y vista
     previa al compartir) y sus datos estructurados para Google. */
  useMetaPagina(metaDeLocal(local))
  const urlFicha = local?.id ? urlPublica(`/local/${local.id}`) : null
  const datosLd = useMemo(() => datosEstructuradosLocal(local, urlFicha), [local, urlFicha])
  useEffect(() => {
    aplicarDatosEstructurados('ld-pagina', datosLd)
    return () => aplicarDatosEstructurados('ld-pagina', null)
  }, [datosLd])

  const tipo = tipoDeLocal(local)
  const esSuscripcion = tipo === TIPOS_LOCAL.suscripcion
  /* Un local de mesas ya configurado por el dueño enseña sus mesas con el
     cobro de la reserva; los demás, su lista de siempre. */
  const servicios = useMemo(
    () =>
      local?.lugar && local?.reservaMesa
        ? ofertaMesas(local, Number(local.intervaloMinutos) || 60)
        : (local?.servicios ?? []),
    [local],
  )
  const planes = useMemo(() => local?.planes ?? [], [local])
  const secciones = useMemo(
    () => [
      { id: 'local-servicios', label: ETIQUETA_PESTANA[tipo] },
      { id: 'local-opiniones', label: 'Opiniones', cuenta: local?.comentarios?.length || null },
      { id: 'local-info', label: 'Info' },
    ],
    [local, tipo],
  )

  if (!local && !fresco) {
    return (
      <section className="detalle-local" aria-busy="true">
        <PaginaEsqueleto />
      </section>
    )
  }

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
  /* En suscripción, el "desde" es la cuota más baja, con su periodo. */
  const planesPagados = planes.filter((p) => Number(p.precio) > 0)
  const planBarato = planesPagados.length
    ? planesPagados.reduce((a, b) => (Number(b.precio) < Number(a.precio) ? b : a))
    : null
  const desde = esSuscripcion
    ? planBarato && precioPlanTexto(planBarato)
    : precios.length
      ? `${Math.min(...precios)} CUP`
      : null
  const oferta = esSuscripcion ? planes : servicios
  const etiquetaDesde = esSuscripcion && planes.length === 1 ? 'Cuota' : 'Desde'

  /* Cifras que no repiten lo que ya dice la cabecera (la nota va arriba). */
  const cifras = [
    oferta.length ? { valor: desde ?? 'Gratis', label: desde ? etiquetaDesde : 'Reserva' } : null,
    oferta.length ? { valor: oferta.length, label: etiquetaCuenta(tipo, oferta.length) } : null,
    distanciaATi(local, getUbicacion())
      ? { valor: distanciaATi(local, getUbicacion()).replace(/^A /, ''), label: 'De ti' }
      : null,
  ].filter(Boolean)

  /* Solo opina quien ya tuvo una cita confirmada aquí (hoy o antes). */
  const hoy = format(new Date(), 'yyyy-MM-dd')
  /* Con backend: las citas de la cuenta, y una opinión por cita (la primera
     cita confirmada y ya pasada que aún no tenga la suya). */
  const fuenteCitas = hayApi ? citasCuenta : citas
  const citaParaOpinar = fuenteCitas.find(
    (c) =>
      c.localId === id &&
      c.estadoReserva === CONFIRMADA &&
      c.fecha &&
      c.fecha <= hoy &&
      !(hayApi && c.opinion),
  )
  const puedeOpinar = Boolean(citaParaOpinar)

  function reservar(servicioId) {
    if (esSuscripcion) {
      const sufijo = servicioId ? `?plan=${encodeURIComponent(servicioId)}` : ''
      navigate(`/local/${id}/unirse${sufijo}`)
      return
    }
    if (local.lugar) {
      navigate(`/local/${id}/reservar`)
      return
    }
    const sufijo = servicioId ? `?servicio=${encodeURIComponent(servicioId)}` : ''
    navigate(`/local/${id}/reservar-cita${sufijo}`)
  }

  async function publicarOpinion({ comentario, calificacion }) {
    const nuevo = {
      id: crypto.randomUUID(),
      nombre: 'Tú',
      fecha: hoy,
      calificacion,
      comentario,
    }
    const antes = local.comentarios ?? []
    const comentarios = [nuevo, ...antes]
    const resumen = notaDeComentarios({ comentarios })
    const cambios = { comentarios, points: String(resumen.nota), opiniones: resumen.cantidad }
    setLocal((prev) => ({ ...prev, ...cambios }))
    setComentarioNuevoId(nuevo.id)
    setErrorOpinion(null)
    if (!hayApi) {
      saveFicha(id, cambios)
      return
    }
    try {
      await guardarOpinion(citaParaOpinar, { puntuacion: calificacion, texto: comentario })
      setCitasCuenta((lista) =>
        lista.map((c) => (c.id === citaParaOpinar.id ? { ...c, opinion: { puntuacion: calificacion, texto: comentario } } : c)),
      )
    } catch (error) {
      setLocal((prev) => ({ ...prev, comentarios: antes }))
      setErrorOpinion(error?.message || 'No se pudo publicar tu opinión. Prueba otra vez.')
    }
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
            {TITULO_SECCION[tipo]}
          </h2>
          {esSuscripcion ? (
            <PlanesPrecio planes={planes} onElegir={reservar} nombreLocal={local.localName} />
          ) : (
            <ServiciosLocal servicios={servicios} lugar={local.lugar} onReservar={reservar} />
          )}
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
          {errorOpinion && (
            <p className="detalle-local-aviso-error" role="alert">
              {errorOpinion}
            </p>
          )}
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

        <LocalesCercanos local={local} style={{ '--i': 4 }} />
      </div>

      <BarraReservaLocal
        precio={desde}
        etiqueta={etiquetaDesde}
        nota={notaBarra}
        tipo={tipo}
        cerrado={!estado.abierto}
        onReservar={() => reservar()}
      />

      {imagenActiva ? (
        <VisorImagen url={imagenActiva} alt={`Foto de ${local.localName}`} onClose={() => setImagenActiva(null)} />
      ) : null}

      <AvisoBreve texto={aviso} />
    </article>
  )
}

export default DetalleLocal
