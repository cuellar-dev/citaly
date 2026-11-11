import { useEffect, useState } from 'react'
import { differenceInCalendarDays } from 'date-fns'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import AvisoDeshacer from '../components/Notificaciones/AvisoDeshacer.jsx'
import CaraGiratoria from '../components/Notificaciones/CaraGiratoria.jsx'
import EscenaTendedero from '../components/Notificaciones/EscenaTendedero.jsx'
import FilaNoti from '../components/Notificaciones/FilaNoti.jsx'
import { getLocalById } from '../services/locales.js'
import { borrarNoti, getNotificaciones, marcarLeidas, minutosRestantes, requiereAccion, restaurarNoti } from '../services/notificaciones.js'
import { getPerfiles } from '../services/storage.js'
import { getUsuarioById } from '../services/usuarios.js'
import './notificaciones.css'

/* La misma cuenta de prueba que Perfil: Laura, dueña de Sara. Todavía no se
   comprueba si la cuenta tiene local; el giro sale siempre. */
const ID_USUARIO = 'u-laura-mendez'
const ID_LOCAL = 'sara'

/* Las cuentas atrás ("Quedan 9 min") van por minutos; con medio minuto de
   refresco nunca se ven desfasadas más de eso. */
const REFRESCO_MS = 30 * 1000

/* Como Instagram: por cuándo pasó. Hoy, ayer, esta semana y lo de antes.
   Leída o no, cada aviso se queda en su día. */
const GRUPOS = [
  { id: 'hoy', titulo: 'Hoy' },
  { id: 'ayer', titulo: 'Ayer' },
  { id: 'semana', titulo: 'Últimos 7 días' },
  { id: 'antes', titulo: 'Antes' },
]

function grupoDe(noti, ahora) {
  const dias = differenceInCalendarDays(ahora, new Date(noti.creadaEn))
  if (dias <= 0) return 'hoy'
  if (dias === 1) return 'ayer'
  if (dias < 7) return 'semana'
  return 'antes'
}

function agrupar(lista, ahora) {
  return GRUPOS.map((g) => ({ ...g, notis: lista.filter((n) => grupoDe(n, ahora) === g.id) })).filter(
    (g) => g.notis.length,
  )
}

/* Las que piden una acción con plazo, la que antes vence primero. */
function fijadasDe(lista, ahora) {
  return lista
    .filter((n) => requiereAccion(n, ahora))
    .sort((x, y) => minutosRestantes(x, ahora) - minutosRestantes(y, ahora))
}

function Notificaciones() {
  const navigate = useNavigate()
  const [notis, setNotis] = useState(getNotificaciones)
  const [lado, setLado] = useState('personal')
  const [ahora, setAhora] = useState(() => new Date())
  /* El último aviso borrado, mientras dura su deshacer. */
  const [borrada, setBorrada] = useState(null)

  /* Como Instagram: abrir la página ya cuenta como haberlas visto, y se marcan
     al momento (la campana baja al volver). Pero durante esta visita las que
     eran nuevas siguen señaladas, para que sepas cuáles son. */
  const [nuevasVisita] = useState(() => new Set(notis.filter((n) => !n.leida).map((n) => n.id)))
  useEffect(() => {
    marcarLeidas([...nuevasVisita])
  }, [nuevasVisita])

  useEffect(() => {
    const id = setInterval(() => setAhora(new Date()), REFRESCO_MS)
    return () => clearInterval(id)
  }, [])

  const usuario = { ...getUsuarioById(ID_USUARIO), ...getPerfiles()[ID_USUARIO] }
  const datosLocal = getLocalById(ID_LOCAL)

  const persona = {
    nombre: usuario.nombre,
    foto: usuario.foto,
    etiqueta: 'Tus avisos',
    detalle: usuario.usuario ? `@${usuario.usuario}` : 'Tu cuenta',
  }
  const local = {
    nombre: datosLocal?.localName ?? 'Tu local',
    foto: datosLocal?.url,
    etiqueta: 'Avisos de tu local',
    detalle: datosLocal?.categoria ?? '',
  }
  const quien = lado === 'personal' ? persona : local

  /* Lo que "pide atención" en cada lado: lo nuevo de esta visita y lo que
     tiene un plazo corriendo. Es lo que cuentan los sobres y el numerito del
     botón de girar. */
  const pideAtencion = (n) => nuevasVisita.has(n.id) || requiereAccion(n, ahora)

  const delLado = notis.filter((n) => n.ambito === lado)
  const fijadas = fijadasDe(delLado, ahora)
  const grupos = agrupar(
    delLado.filter((n) => !fijadas.includes(n)),
    ahora,
  )
  const atencionLado = delLado.filter(pideAtencion).length
  const atencionOtroLado = notis.filter((n) => n.ambito !== lado && pideAtencion(n)).length

  /* Borrar es inmediato y se guarda ya; el aviso de abajo solo da la opción
     de arrepentirse. Si se borra otra con el aviso abierto, el aviso pasa a
     ser de la nueva y la anterior se queda borrada. */
  const borrar = (noti) => {
    borrarNoti(noti.id)
    setNotis(getNotificaciones())
    setBorrada({ noti, vez: Date.now() })
  }

  const deshacer = () => {
    if (!borrada) return
    restaurarNoti(borrada.noti.id)
    setNotis(getNotificaciones())
    setBorrada((b) => ({ ...b, deshecha: true }))
  }

  /* Venir de un enlace directo deja el historial vacío: entonces "Volver"
     lleva a Descubre en vez de sacar de la app. */
  const volver = () => {
    if (window.history.state?.idx > 0) navigate(-1)
    else navigate('/')
  }

  return (
    <section className="notis" aria-labelledby="notis-titulo">
      {/* El temblor a pluma de los trazos pequeños (flechas de girar). */}
      <svg width="0" height="0" className="notis-defs" aria-hidden="true" focusable="false">
        <defs>
          <filter id="noti-pulso" x="-15%" y="-15%" width="130%" height="130%">
            <feTurbulence type="fractalNoise" baseFrequency="0.06" numOctaves="2" seed="5" result="r" />
            <feDisplacementMap in="SourceGraphic" in2="r" scale="1.4" xChannelSelector="R" yChannelSelector="G" />
          </filter>
        </defs>
      </svg>

      <header className="notis-cabecera">
        <div className="notis-barra">
          <button type="button" className="notis-volver" onClick={volver} aria-label="Volver">
            <ArrowLeft size={19} strokeWidth={2.25} aria-hidden="true" />
          </button>
          <h1 className="notis-titulo" id="notis-titulo">
            Notificaciones
          </h1>
        </div>

        <EscenaTendedero sobres={atencionLado} />

        <div className="notis-quien">
          <CaraGiratoria
            lado={lado}
            persona={persona}
            local={local}
            nuevasOtroLado={atencionOtroLado}
            onGirar={() => setLado((l) => (l === 'personal' ? 'negocio' : 'personal'))}
          />
          {/* La key reinicia el fundido al girar. aria-live para que el
              lector anuncie de quién son ahora los avisos. */}
          <div className="notis-quien-textos" key={lado} aria-live="polite">
            <p className="notis-quien-etiqueta">{quien.etiqueta}</p>
            <h2 className="notis-quien-nombre">{quien.nombre}</h2>
            {quien.detalle && <p className="notis-quien-detalle">{quien.detalle}</p>}
          </div>
        </div>
      </header>

      <div className="notis-cuerpo" key={lado}>
        {delLado.length === 0 ? (
          <p className="notis-vacio">
            {lado === 'personal' ? 'Aún no tienes avisos.' : 'Tu local está tranquilo por ahora.'}
          </p>
        ) : (
          <>
            {fijadas.length > 0 && (
              <section className="notis-fijadas" aria-label="Pendientes de responder">
                <ul className="notis-fijadas-lista">
                  {fijadas.map((n) => (
                    <FilaNoti key={n.id} noti={n} ahora={ahora} nueva fijada onAbrir={() => {}} onBorrar={borrar} />
                  ))}
                </ul>
              </section>
            )}
            {grupos.map((g) => (
              <section className="notis-grupo" key={g.id} aria-labelledby={`notis-grupo-${g.id}`}>
                <h3 className="notis-grupo-titulo" id={`notis-grupo-${g.id}`}>
                  {g.titulo}
                </h3>
                <ul className="notis-hilo">
                  {g.notis.map((n) => (
                    <FilaNoti
                      key={n.id}
                      noti={n}
                      grupo={g.id}
                      ahora={ahora}
                      nueva={nuevasVisita.has(n.id)}
                      vuelve={borrada?.deshecha && borrada.noti.id === n.id}
                      onAbrir={() => {}}
                      onBorrar={borrar}
                    />
                  ))}
                </ul>
              </section>
            ))}
          </>
        )}
      </div>

      {borrada && !borrada.deshecha && (
        <AvisoDeshacer
          key={borrada.vez}
          noti={borrada.noti}
          onDeshacer={deshacer}
          onFin={() => setBorrada(null)}
        />
      )}
    </section>
  )
}

export default Notificaciones
