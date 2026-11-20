import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { format, parse } from 'date-fns'
import { es } from 'date-fns/locale'
import { ArrowUp, CalendarCheck, MapPin, RotateCcw, Star, X } from 'lucide-react'
import Taly from '../Taly/Taly.jsx'
import { guardarCitaDelChat } from './guardarCita.js'
import './chatTaly.css'

const CLAVE = 'citaly_chat_taly'
const SUGERENCIAS = [
  'Busco barbería para mañana',
  '¿Qué spas hay?',
  'Quiero hacerme las uñas',
  '¿Qué puedes hacer?',
]
/* En estas rutas hay barras de reserva fijas abajo: el botón se aparta. */
const RUTAS_SIN_BOTON = /^\/local\//

const hoyLocal = () => format(new Date(), 'yyyy-MM-dd')
let contador = 0
const nuevoId = () => `${Date.now().toString(36)}-${++contador}`

function leerGuardado() {
  try {
    return JSON.parse(sessionStorage.getItem(CLAVE)) ?? []
  } catch {
    return []
  }
}

/* **negrita** y saltos de línea; el resto, texto plano (nada de HTML del modelo). */
function Texto({ children }) {
  return String(children)
    .split(/(\*\*[^*]+\*\*)/g)
    .map((trozo, i) =>
      trozo.startsWith('**') && trozo.endsWith('**') ? <strong key={i}>{trozo.slice(2, -2)}</strong> : trozo,
    )
}

function enlaceReserva(local) {
  if (local.tipo_reserva === 'mesa') return { to: `/local/${local.id}/reservar`, texto: 'Reservar mesa' }
  if (local.tipo_reserva === 'suscripcion') return { to: `/local/${local.id}/unirse`, texto: 'Ver planes' }
  return { to: `/local/${local.id}`, texto: 'Ver local' }
}

function TarjetasLocales({ locales, alNavegar }) {
  return (
    <ul className="chat-taly-locales" aria-label="Locales encontrados">
      {locales.map((l) => {
        const enlace = enlaceReserva(l)
        return (
          <li key={l.id} className="chat-taly-local">
            <span className="chat-taly-local-nombre">{l.nombre}</span>
            <span className="chat-taly-local-meta">
              {l.categoria}
              {l.puntuacion && (
                <>
                  {' · '}
                  <Star size={11} fill="currentColor" aria-hidden /> {l.puntuacion}
                </>
              )}
            </span>
            {l.direccion && (
              <span className="chat-taly-local-meta">
                <MapPin size={11} aria-hidden /> {l.direccion}
              </span>
            )}
            <Link to={enlace.to} className="chat-taly-local-enlace" onClick={alNavegar}>
              {enlace.texto}
            </Link>
          </li>
        )
      })}
    </ul>
  )
}

function TarjetaCita({ cita, alNavegar }) {
  const fecha = parse(cita.fecha, 'yyyy-MM-dd', new Date())
  return (
    <div className="chat-taly-cita">
      <span className="chat-taly-cita-titulo">
        <CalendarCheck size={16} aria-hidden /> Cita reservada
      </span>
      <span className="chat-taly-cita-local">{cita.localNombre}</span>
      <span className="chat-taly-cita-detalle">
        {format(fecha, "EEEE d 'de' MMMM", { locale: es })} · {cita.horario}
      </span>
      {cita.servicios?.[0] && (
        <span className="chat-taly-cita-detalle">
          {cita.servicios[0].nombre} · {cita.precioTotal} CUP
        </span>
      )}
      <Link to="/citas" className="chat-taly-cita-enlace" onClick={alNavegar}>
        Ver en Mis Citas
      </Link>
    </div>
  )
}

export default function ChatTaly({ url }) {
  const { pathname } = useLocation()
  const [abierto, setAbierto] = useState(false)
  const [mensajes, setMensajes] = useState(leerGuardado)
  const [texto, setTexto] = useState('')
  const [pensando, setPensando] = useState(false)
  const [celebrando, setCelebrando] = useState(false)
  const [esperaLarga, setEsperaLarga] = useState(false)
  const raizRef = useRef(null)
  const listaRef = useRef(null)
  const entradaRef = useRef(null)
  const botonRef = useRef(null)

  useEffect(() => {
    try {
      sessionStorage.setItem(CLAVE, JSON.stringify(mensajes.slice(-30)))
    } catch {
      /* sin sessionStorage: la conversación vive solo en memoria */
    }
  }, [mensajes])

  /* El botón flota justo por encima de la barra de navegación, mida lo que mida. */
  useLayoutEffect(() => {
    const barra = document.querySelector('.navbar')
    const raiz = raizRef.current
    if (!barra || !raiz) return undefined
    const medir = () => raiz.style.setProperty('--chat-taly-barra', `${barra.offsetHeight}px`)
    medir()
    const ro = new ResizeObserver(medir)
    ro.observe(barra)
    return () => ro.disconnect()
  }, [])

  useEffect(() => {
    listaRef.current?.scrollTo({ top: listaRef.current.scrollHeight, behavior: 'smooth' })
  }, [mensajes, pensando, esperaLarga])

  /* Si el servidor tiene cola, la respuesta puede tardar: a los 6 s se avisa. */
  useEffect(() => {
    if (!pensando) return undefined
    const t = setTimeout(() => setEsperaLarga(true), 6000)
    return () => {
      clearTimeout(t)
      setEsperaLarga(false)
    }
  }, [pensando])

  useEffect(() => {
    if (!abierto) return undefined
    entradaRef.current?.focus({ preventScroll: true })
    const alTeclear = (e) => e.key === 'Escape' && cerrar()
    window.addEventListener('keydown', alTeclear)
    return () => window.removeEventListener('keydown', alTeclear)
  }, [abierto])

  function cerrar() {
    setAbierto(false)
    botonRef.current?.focus({ preventScroll: true })
  }

  async function enviar(contenido) {
    const limpio = contenido.trim()
    if (!limpio || pensando) return
    const propio = { id: nuevoId(), role: 'user', content: limpio }
    const siguientes = [...mensajes.filter((m) => !m.error), propio]
    setMensajes(siguientes)
    setTexto('')
    setPensando(true)
    try {
      const historial = siguientes.map(({ role, content, datos }) => ({ role, content, datos }))
      const r = await fetch(`${url}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ historial, hoy: hoyLocal() }),
      })
      const data = await r.json().catch(() => ({}))
      if (!r.ok) throw new Error(data.error || 'No pude responder ahora mismo.')

      const citas = (data.citas ?? []).map(guardarCitaDelChat)
      if (citas.length) {
        setCelebrando(true)
        setTimeout(() => setCelebrando(false), 2400)
      }
      setMensajes((prev) => [
        ...prev,
        {
          id: nuevoId(),
          role: 'assistant',
          content: data.respuesta || '…',
          datos: data.datos,
          // si ya hay cita, la tarjeta de la cita sustituye a las de locales
          locales: citas.length ? [] : data.locales ?? [],
          citas,
        },
      ])
    } catch (e) {
      const sinConexion = e instanceof TypeError
      setMensajes((prev) => [
        ...prev,
        {
          id: nuevoId(),
          role: 'assistant',
          error: true,
          content: sinConexion
            ? 'No encuentro mi servidor. ¿Está encendido el prototipo (npm start)?'
            : e.message,
          reintentar: limpio,
        },
      ])
    } finally {
      setPensando(false)
    }
  }

  function reiniciar() {
    setMensajes([])
    entradaRef.current?.focus()
  }

  const ocultarBoton = RUTAS_SIN_BOTON.test(pathname)
  const escena = pensando ? 'loader' : null
  const pose = pensando ? undefined : celebrando ? 'contento' : 'reposo'

  return (
    <div ref={raizRef} className="chat-taly">
      {!abierto && !ocultarBoton && (
        <button
          ref={botonRef}
          type="button"
          className="chat-taly-boton"
          onClick={() => setAbierto(true)}
          aria-label="Abrir el chat con Taly"
          title="Pregúntale a Taly"
        >
          <Taly pose="reposo" encuadre="compacto" tamano={30} titulo="" />
        </button>
      )}

      {abierto && (
        <>
          <div className="chat-taly-velo" onClick={cerrar} aria-hidden />
          <section className="chat-taly-panel" role="dialog" aria-label="Chat con Taly">
            <header className="chat-taly-cabecera">
              <div className="chat-taly-avatar">
                <Taly escena={escena ?? 'loader'} pose={pose} encuadre="compacto" tamano={26} titulo="" />
              </div>
              <div className="chat-taly-titulos">
                <strong>Taly</strong>
                <span>{pensando ? 'Buscando…' : 'Asistente de reservas · prueba'}</span>
              </div>
              {mensajes.length > 0 && (
                <button type="button" className="chat-taly-icono" onClick={reiniciar} aria-label="Empezar de nuevo" title="Empezar de nuevo">
                  <RotateCcw size={18} />
                </button>
              )}
              <button type="button" className="chat-taly-icono" onClick={cerrar} aria-label="Cerrar chat">
                <X size={20} />
              </button>
            </header>

            <div className="chat-taly-lista" ref={listaRef} aria-live="polite">
              {mensajes.length === 0 && (
                <div className="chat-taly-bienvenida">
                  <Taly pose="reposo" tamano={56} titulo="" />
                  <p>
                    ¡Hola! Soy Taly. Te busco locales, te digo precios y horas libres, y te reservo la cita sin
                    salir de aquí.
                  </p>
                  <div className="chat-taly-sugerencias">
                    {SUGERENCIAS.map((s) => (
                      <button key={s} type="button" onClick={() => enviar(s)}>
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {mensajes.map((m) => (
                <div key={m.id} className={`chat-taly-fila chat-taly-fila--${m.role === 'user' ? 'yo' : 'taly'}`}>
                  <p className={`chat-taly-burbuja ${m.error ? 'chat-taly-burbuja--error' : ''}`}>
                    <Texto>{m.content}</Texto>
                  </p>
                  {m.reintentar && (
                    <button type="button" className="chat-taly-reintentar" onClick={() => enviar(m.reintentar)}>
                      Reintentar
                    </button>
                  )}
                  {m.locales?.length > 0 && <TarjetasLocales locales={m.locales} alNavegar={cerrar} />}
                  {m.citas?.map((c) => <TarjetaCita key={c.id} cita={c} alNavegar={cerrar} />)}
                </div>
              ))}

              {pensando && (
                <div className="chat-taly-fila chat-taly-fila--taly">
                  <p className="chat-taly-burbuja chat-taly-escribiendo" aria-label="Taly está escribiendo">
                    <span />
                    <span />
                    <span />
                  </p>
                  {esperaLarga && (
                    <p className="chat-taly-espera">Hay bastante gente hablando conmigo. Enseguida te atiendo…</p>
                  )}
                </div>
              )}
            </div>

            <form
              className="chat-taly-entrada"
              onSubmit={(e) => {
                e.preventDefault()
                enviar(texto)
              }}
            >
              <input
                ref={entradaRef}
                value={texto}
                onChange={(e) => setTexto(e.target.value)}
                placeholder="Escribe a Taly…"
                maxLength={500}
                enterKeyHint="send"
                autoComplete="off"
              />
              <button type="submit" disabled={!texto.trim() || pensando} aria-label="Enviar">
                <ArrowUp size={20} />
              </button>
            </form>
          </section>
        </>
      )}
    </div>
  )
}
