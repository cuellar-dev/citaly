import { useRef } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Trash2, X } from 'lucide-react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { minutosRestantes, vencida } from '../../services/notificaciones.js'
import './filaNoti.css'

/* Cada aviso es una cuenta en un hilo, como la agenda de Mi Negocio. El tipo
   lo dice el color de la cuenta, no un icono:
   - verde    → salió bien
   - rojo     → se cayó algo
   - mostaza  → te toca hacer algo o estar atento
   - menta    → para descubrir */
const TONOS = {
  porTi: 'mostaza',
  recordatorio: 'mostaza',
  cierre: 'mostaza',
  reserva: 'mostaza',
  porCaducar: 'mostaza',
  pausa: 'mostaza',
  aceptada: 'verde',
  confirmo: 'verde',
  lleno: 'verde',
  resumen: 'verde',
  rechazada: 'rojo',
  cancelo: 'rojo',
  caducada: 'rojo',
}

/* Deslizar para borrar: pasado este trozo del ancho se borra al soltar. Un
   gesto rápido también vale aunque no llegue (velocidad en px/ms). */
const UMBRAL = 0.38
const VELOCIDAD = 0.3
const MIN_RAPIDO = 40
/* Hasta aquí el dedo puede ir en cualquier dirección sin decidir nada. */
const ZONA_MUERTA = 8

/* La hora depende del grupo donde cae, para no repetir lo que ya dice el
   título del grupo: en Hoy "9 min" o "3 h", en Ayer la hora, en la semana el
   día, y más atrás la fecha. */
function cuando(iso, ahora, grupo) {
  const fecha = new Date(iso)
  const min = Math.floor((ahora - fecha) / 60000)
  if (grupo === 'hoy') {
    if (min < 1) return 'ahora'
    if (min < 60) return `${min} min`
    return `${Math.floor(min / 60)} h`
  }
  if (grupo === 'ayer') {
    const h = fecha.getHours()
    return `${h % 12 || 12}:${String(fecha.getMinutes()).padStart(2, '0')} ${h >= 12 ? 'PM' : 'AM'}`
  }
  if (grupo === 'semana') return format(fecha, 'EEEE', { locale: es })
  return format(fecha, 'd MMM', { locale: es }).replace('.', '')
}

function sinMovimiento() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

function FilaNoti({ noti, ahora, grupo, onAbrir, onBorrar, vuelve = false }) {
  const filaRef = useRef(null)
  const cartaRef = useRef(null)
  const gesto = useRef(null)
  const arrastro = useRef(false)

  const quedan = minutosRestantes(noti, ahora)
  const caducada = vencida(noti, ahora)
  const clases = [
    'fila-noti',
    `fila-noti--${TONOS[noti.tipo] ?? 'menta'}`,
    noti.leida ? 'fila-noti--leida' : 'fila-noti--nueva',
    vuelve && 'fila-noti--vuelve',
  ]
    .filter(Boolean)
    .join(' ')

  const volverASitio = () => {
    const carta = cartaRef.current
    filaRef.current?.classList.remove('fila-noti--arrastrando', 'fila-noti--listo')
    if (!carta) return
    carta.style.transition = 'transform 0.22s var(--ease-out)'
    carta.style.transform = ''
  }

  /* Sale por la izquierda y luego la fila se cierra, para que las de abajo
     suban sin salto. */
  const borrar = () => {
    const fila = filaRef.current
    const carta = cartaRef.current
    if (!fila || !carta) return
    const suave = sinMovimiento()
    fila.classList.add('fila-noti--yendo')
    if (!suave) {
      carta.style.transition = 'transform 0.2s var(--ease-out)'
      carta.style.transform = 'translateX(-105%)'
    }
    const alto = fila.offsetHeight
    fila
      .animate(
        [
          { height: `${alto}px`, opacity: 1 },
          { height: '0px', opacity: 0 },
        ],
        { duration: 220, delay: suave ? 0 : 150, easing: 'cubic-bezier(0.22, 1, 0.36, 1)', fill: 'forwards' },
      )
      .finished.then(() => onBorrar(noti))
      .catch(() => onBorrar(noti))
  }

  const alPulsar = (e) => {
    if (e.pointerType === 'mouse' && e.button !== 0) return
    gesto.current = { x: e.clientX, y: e.clientY, t: performance.now(), eje: null, dx: 0 }
    arrastro.current = false
  }

  const alMover = (e) => {
    const g = gesto.current
    const carta = cartaRef.current
    if (!g || !carta) return
    const dx = e.clientX - g.x
    const dy = e.clientY - g.y

    /* Decide el eje una sola vez. Si es vertical, el gesto es del scroll y
       aquí no se toca nada más. */
    if (!g.eje) {
      if (Math.abs(dx) > ZONA_MUERTA && Math.abs(dx) > Math.abs(dy)) {
        g.eje = 'x'
        g.x = e.clientX
        g.t = performance.now()
        arrastro.current = true
        carta.setPointerCapture(e.pointerId)
        carta.style.transition = 'none'
        filaRef.current?.classList.add('fila-noti--arrastrando')
      } else if (Math.abs(dy) > ZONA_MUERTA) {
        gesto.current = null
      }
      return
    }

    g.dx = dx
    /* Hacia la derecha no hay nada: se deja ir un poco con freno, en vez de
       chocar con una pared. */
    const x = dx < 0 ? dx : Math.sqrt(dx) * 3
    carta.style.transform = `translateX(${x}px)`
    filaRef.current?.classList.toggle('fila-noti--listo', -dx > carta.offsetWidth * UMBRAL)
  }

  const alSoltar = () => {
    const g = gesto.current
    gesto.current = null
    if (!g || g.eje !== 'x') return
    const ancho = cartaRef.current?.offsetWidth ?? 1
    const tiempo = Math.max(performance.now() - g.t, 1)
    const rapido = -g.dx > MIN_RAPIDO && -g.dx / tiempo > VELOCIDAD
    if (-g.dx > ancho * UMBRAL || rapido) borrar()
    else volverASitio()
  }

  const alCancelar = () => {
    if (gesto.current?.eje === 'x') volverASitio()
    gesto.current = null
  }

  return (
    <li className={clases} ref={filaRef}>
      <div className="fila-noti-fondo" aria-hidden="true">
        <Trash2 size={18} strokeWidth={2.2} />
        <span>Borrar</span>
      </div>

      <div
        className="fila-noti-carta"
        ref={cartaRef}
        onPointerDown={alPulsar}
        onPointerMove={alMover}
        onPointerUp={alSoltar}
        onPointerCancel={alCancelar}
      >
        <span className="fila-noti-cuenta" aria-hidden="true" />
        <Link
          to={noti.enlace ?? '#'}
          className="fila-noti-enlace"
          draggable={false}
          onClick={(e) => {
            /* Un arrastre termina con un click encima: ese no navega. */
            if (arrastro.current) {
              e.preventDefault()
              arrastro.current = false
              return
            }
            onAbrir(noti.id)
          }}
        >
          <span className="fila-noti-cabeza">
            <span className="fila-noti-titulo">{noti.titulo}</span>
            <time dateTime={noti.creadaEn}>{cuando(noti.creadaEn, ahora, grupo)}</time>
          </span>
          <span className="fila-noti-texto">{noti.texto}</span>
          {(quedan != null || caducada || noti.accion) && (
            <span className="fila-noti-pie">
              {quedan != null && <span className="fila-noti-plazo">Quedan {quedan} min</span>}
              {caducada && <span className="fila-noti-vencio">Se acabó el plazo</span>}
              {noti.accion && !caducada && (
                <span className="fila-noti-accion">
                  {noti.accion}
                  <ArrowRight size={14} strokeWidth={2.4} aria-hidden="true" />
                </span>
              )}
            </span>
          )}
          {!noti.leida && <span className="sr-solo">, sin leer</span>}
        </Link>
      </div>

      {/* Con ratón o teclado no hay dedo que deslice: el mismo borrar, a mano. */}
      <button type="button" className="fila-noti-quitar" onClick={borrar} aria-label={`Borrar: ${noti.titulo}`}>
        <X size={15} strokeWidth={2.4} aria-hidden="true" />
      </button>
    </li>
  )
}

export default FilaNoti
