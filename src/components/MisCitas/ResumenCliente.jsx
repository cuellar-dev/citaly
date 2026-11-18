import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { differenceInCalendarDays, format, parse } from 'date-fns'
import { es } from 'date-fns/locale'
import { CalendarCheck, CalendarX2, Check, Heart, Repeat, Undo2, Wallet, X } from 'lucide-react'
import CaraRating, { COLORES_PUNTUACION, ETIQUETAS_PUNTUACION } from '../CaraRating/CaraRating.jsx'
import TarjetaLocalCompacta from '../Descubre/TarjetaLocalCompacta.jsx'
import { FAVORITOS_EVENTO, getFavoritos } from '../../services/favoritos.js'
import { getLocalById } from '../../services/locales.js'
import { publicarOpinion } from '../../services/opiniones.js'
import Foto from '../Foto/Foto.jsx'
import { estadisticasCliente, sitiosFijos, ultimasCitas } from '../../utils/resumenCitas.js'
import './resumenCliente.css'

/* Debajo de citas y suscripciones: cómo le va al cliente con Citaly. Sus
   números del año, los sitios a los que ya vuelve (con atajo para reservar
   lo de siempre), sus últimas citas para preguntarle si fue y qué tal, y
   los locales que guardó. */

function fechaHora(cita) {
  const d = parse(`${cita.fecha} ${cita.horario}`, 'yyyy-MM-dd HH:mm', new Date())
  return format(d, "EEE d 'de' MMM · h:mm a", { locale: es })
}

function queFue(cita) {
  if (cita.esLugar) return cita.mesa?.capacidad ? `Mesa para ${cita.mesa.capacidad}` : 'Reserva de mesa'
  return (cita.servicios ?? []).map((s) => s.nombre).join(', ') || 'Cita'
}

function Dato({ Icono, etiqueta, valor, tono }) {
  return (
    <div className={`resumen-dato${tono ? ` resumen-dato--${tono}` : ''}`}>
      <Icono size={16} strokeWidth={2.2} aria-hidden="true" />
      <strong>{valor}</strong>
      <span>{etiqueta}</span>
    </div>
  )
}

/* ---------- Sitios de siempre ---------- */

/* Cómo se llama «tu sitio» según lo que es. */
const TU_SITIO = {
  Peluquería: 'Tu peluquería',
  Barbería: 'Tu barbería',
  Uñas: 'Tu sitio de uñas',
  Dentista: 'Tu dentista',
  Veterinaria: 'Tu veterinaria',
}

function haceCuanto(fecha) {
  const dias = differenceInCalendarDays(new Date(), parse(fecha, 'yyyy-MM-dd', new Date()))
  if (dias <= 0) return 'hoy'
  if (dias === 1) return 'ayer'
  if (dias < 7) return `hace ${dias} días`
  if (dias < 14) return 'hace una semana'
  if (dias < 31) return `hace ${Math.round(dias / 7)} semanas`
  return `hace ${Math.round(dias / 30)} meses`
}

/* Un sitio al que ya vuelves merece su tarjeta grande: foto, cuánto llevas
   yendo, tu última nota y lo de siempre con su precio, listo para repetir. */
function SitioFijo({ fijo }) {
  const { local, veces, ultima, deSiempre } = fijo
  const ids = deSiempre.map((s) => s.id).join(',')
  const destino = `/local/${local.id}/reservar-cita${ids ? `?servicio=${encodeURIComponent(ids)}` : ''}`
  const precios = new Map((local.servicios ?? []).map((s) => [s.id, Number(s.precio) || 0]))
  const total = deSiempre.reduce((t, s) => t + (precios.get(s.id) ?? 0), 0)
  const nota = [...fijo.idas].reverse().find((c) => c.opinion)?.opinion?.puntuacion

  return (
    <article className="fijo">
      <Link to={`/local/${local.id}`} className="fijo-portada tema-oscuro-fijo">
        <Foto src={local.url} anchos={[480, 720]} sizes="(max-width: 532px) calc(100vw - 32px), 500px" />
        <span className="fijo-velo" aria-hidden="true" />
        <span className="fijo-sello">{TU_SITIO[local.categoria] ?? 'Tu sitio'}</span>
        <span className="fijo-nombre">{local.localName}</span>
      </Link>

      <div className="fijo-cuerpo">
        <dl className="fijo-datos">
          <div>
            <dt>Visitas</dt>
            <dd>{veces}</dd>
          </div>
          <div>
            <dt>La última</dt>
            <dd>{haceCuanto(ultima.fecha)}</dd>
          </div>
          <div>
            <dt>Tu nota</dt>
            <dd>{nota ? <CaraRating nivel={nota} size={22} /> : '—'}</dd>
          </div>
        </dl>

        {deSiempre.length > 0 && (
          <div className="fijo-siempre">
            <span className="fijo-siempre-titulo">Lo de siempre</span>
            <ul>
              {deSiempre.map((s) => (
                <li key={s.id}>
                  <span>{s.nombre}</span>
                  <span>{precios.get(s.id) ? `${precios.get(s.id)} CUP` : 'Gratis'}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        <Link to={destino} className="fijo-repetir">
          <Repeat size={17} strokeWidth={2.4} aria-hidden="true" />
          {deSiempre.length ? `Repetir lo de siempre · ${total} CUP` : 'Reservar otra vez'}
        </Link>
      </div>
    </article>
  )
}

/* ---------- Últimas citas ---------- */

function FormOpinion({ inicial, onPublicar, onCancelar, textoCancelar }) {
  const [puntuacion, setPuntuacion] = useState(inicial?.puntuacion ?? 0)
  const [texto, setTexto] = useState(inicial?.texto ?? '')
  return (
    <div className="ultima-opinion-form" style={puntuacion ? { '--nota-color': COLORES_PUNTUACION[puntuacion] } : undefined}>
      <p className="ultima-pregunta">¿Qué tal te fue?</p>
      <div className="ultima-caras" role="radiogroup" aria-label="Tu puntuación">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            role="radio"
            aria-checked={puntuacion === n}
            aria-label={ETIQUETAS_PUNTUACION[n]}
            className={`ultima-cara${puntuacion === n ? ' ultima-cara--elegida' : ''}`}
            onClick={() => setPuntuacion(n)}
          >
            <CaraRating nivel={n} size={30} />
          </button>
        ))}
      </div>
      {puntuacion > 0 && (
        <>
          <span className="ultima-cara-texto">{ETIQUETAS_PUNTUACION[puntuacion]}</span>
          <textarea
            className="ultima-texto"
            value={texto}
            maxLength={280}
            rows={3}
            placeholder="Cuéntalo en dos líneas (opcional)"
            onChange={(e) => setTexto(e.target.value)}
          />
        </>
      )}
      <div className="ultima-botones">
        <button type="button" className="ultima-boton ultima-boton--suave" onClick={onCancelar}>
          {textoCancelar}
        </button>
        <button
          type="button"
          className="ultima-boton ultima-boton--si"
          disabled={!puntuacion}
          onClick={() => onPublicar({ puntuacion, texto: texto.trim() })}
        >
          Publicar opinión
        </button>
      </div>
      <p className="ultima-nota">Sale en la ficha del local con tu nombre.</p>
    </div>
  )
}

/* Cada cita lleva un sello con su estado, y la tarjeta entera cambia con él:
   pregunta (mostaza), fuiste (verde), no fuiste (apagada, rosa). */
const SELLOS = {
  pregunta: { texto: '¿Fuiste?', Icono: null },
  fue: { texto: 'Fuiste', Icono: Check },
  opino: { texto: 'Fuiste · opinaste', Icono: Check },
  nofue: { texto: 'No fuiste', Icono: X },
}

function UltimaCita({ cita, onActualizar }) {
  const [editando, setEditando] = useState(false)
  const [recien, setRecien] = useState(false)

  const publicar = (opinion) => {
    publicarOpinion(cita, opinion)
    onActualizar(cita.id, { opinion: { ...opinion, en: new Date().toISOString() }, opinionOmitida: false })
    setEditando(false)
    setRecien(true)
  }

  const estado = !cita.asistencia ? 'pregunta' : cita.asistencia === 'no' ? 'nofue' : cita.opinion ? 'opino' : 'fue'
  const sello = SELLOS[estado]
  const IconoSello = sello.Icono

  let cuerpo
  if (estado === 'pregunta') {
    cuerpo = (
      <div className="ultima-asistencia">
        <p className="ultima-pregunta">¿Fuiste al final?</p>
        <div className="ultima-botones">
          <button type="button" className="ultima-boton ultima-boton--no" onClick={() => onActualizar(cita.id, { asistencia: 'no' })}>
            <X size={16} strokeWidth={2.6} aria-hidden="true" />
            No fui
          </button>
          <button type="button" className="ultima-boton ultima-boton--si" onClick={() => onActualizar(cita.id, { asistencia: 'si' })}>
            <Check size={16} strokeWidth={2.6} aria-hidden="true" />
            Sí, fui
          </button>
        </div>
      </div>
    )
  } else if (estado === 'nofue') {
    cuerpo = (
      <div className="ultima-resultado">
        <span>No cuenta en tus números ni te pedimos opinión.</span>
        <button type="button" className="ultima-enlace" onClick={() => onActualizar(cita.id, { asistencia: null })}>
          <Undo2 size={14} strokeWidth={2.4} aria-hidden="true" />
          Deshacer
        </button>
      </div>
    )
  } else if (editando || (!cita.opinion && !cita.opinionOmitida)) {
    cuerpo = (
      <FormOpinion
        inicial={cita.opinion}
        textoCancelar={editando ? 'Cancelar' : 'Ahora no'}
        onCancelar={() => (editando ? setEditando(false) : onActualizar(cita.id, { opinionOmitida: true }))}
        onPublicar={publicar}
      />
    )
  } else if (cita.opinion) {
    const n = cita.opinion.puntuacion
    cuerpo = (
      <figure
        className={`ultima-opinion${recien ? ' ultima-opinion--recien' : ''}`}
        style={{ '--nota-color': COLORES_PUNTUACION[n] }}
      >
        <div className="ultima-opinion-cabecera">
          <CaraRating nivel={n} size={30} />
          <span className="ultima-opinion-titulos">
            <strong>{ETIQUETAS_PUNTUACION[n]}</strong>
            <small>{recien ? '¡Publicada en la ficha del local!' : 'Tu opinión, publicada en la ficha'}</small>
          </span>
          <button type="button" className="ultima-enlace" onClick={() => setEditando(true)}>
            Editar
          </button>
        </div>
        {cita.opinion.texto && <blockquote>{cita.opinion.texto}</blockquote>}
      </figure>
    )
  } else {
    cuerpo = (
      <div className="ultima-resultado">
        <span>Sin opinión, y está bien.</span>
        <button type="button" className="ultima-enlace" onClick={() => setEditando(true)}>
          Opinar ahora
        </button>
      </div>
    )
  }

  return (
    <li className={`ultima ultima--${estado}`}>
      <div className="ultima-cabecera">
        <Link to={`/local/${cita.localId}`} className="ultima-local">
          {cita.localNombre}
        </Link>
        {/* key: al cambiar de estado el sello vuelve a entrar con su animación. */}
        <span className={`ultima-sello ultima-sello--${estado}`} key={estado}>
          {IconoSello && <IconoSello size={12} strokeWidth={3} aria-hidden="true" />}
          {sello.texto}
        </span>
      </div>
      <span className="ultima-que">
        {queFue(cita)} · {fechaHora(cita)}
      </span>
      <div className="ultima-cuerpo" key={`${estado}-${editando}`}>
        {cuerpo}
      </div>
    </li>
  )
}

/* ---------- Todo junto ---------- */

function ResumenCliente({ citas, onActualizarCita }) {
  const [favoritos, setFavoritos] = useState(getFavoritos)

  useEffect(() => {
    const sync = () => setFavoritos(getFavoritos())
    window.addEventListener(FAVORITOS_EVENTO, sync)
    window.addEventListener('storage', sync)
    return () => {
      window.removeEventListener(FAVORITOS_EVENTO, sync)
      window.removeEventListener('storage', sync)
    }
  }, [])

  const stats = useMemo(() => estadisticasCliente(citas), [citas])
  const fijos = useMemo(() => sitiosFijos(citas, getLocalById), [citas])
  const ultimas = ultimasCitas(citas)
  const guardados = favoritos.map(getLocalById).filter(Boolean)

  return (
    <section className="mis-bloque" aria-labelledby="mis-resumen">
      <header className="mis-bloque-cabecera">
        <h2 id="mis-resumen">Tu año en Citaly</h2>
      </header>

      <div className="resumen-datos">
        <Dato Icono={CalendarCheck} etiqueta={stats.idas === 1 ? 'cita a la que fuiste' : 'citas a las que fuiste'} valor={stats.idas} tono="verde" />
        <Dato Icono={Wallet} etiqueta="CUP en citas" valor={stats.gastado.toLocaleString('es')} tono="amarillo" />
        <Dato Icono={CalendarX2} etiqueta={stats.canceladas === 1 ? 'cancelada' : 'canceladas'} valor={stats.canceladas} />
        <Dato
          Icono={Heart}
          etiqueta={stats.diaFavorito ? 'tu día de salir' : stats.masVisitado ? 'tu sitio más visitado' : 'todavía sin costumbre'}
          valor={stats.diaFavorito ? `Los ${stats.diaFavorito}` : stats.masVisitado?.nombre ?? '—'}
          tono="rosa"
        />
      </div>

      {fijos.length > 0 && (
        <div className="resumen-sub">
          <h3>Tus sitios de siempre</h3>
          <div className="resumen-fijos">
            {fijos.map((f) => (
              <SitioFijo key={f.local.id} fijo={f} />
            ))}
          </div>
        </div>
      )}

      {ultimas.length > 0 && (
        <div className="resumen-sub">
          <h3>Tus últimas citas</h3>
          <ul className="ultimas">
            {ultimas.map((c) => (
              <UltimaCita key={c.id} cita={c} onActualizar={onActualizarCita} />
            ))}
          </ul>
        </div>
      )}

      <div className="resumen-sub">
        <h3>Te gustaron</h3>
        {guardados.length ? (
          <div className="resumen-guardados">
            {guardados.map((l) => (
              <TarjetaLocalCompacta key={l.id} local={l} />
            ))}
          </div>
        ) : (
          <p className="mis-bloque-vacio">Toca el corazón en un local y lo tendrás aquí a mano.</p>
        )}
      </div>
    </section>
  )
}

export default ResumenCliente
