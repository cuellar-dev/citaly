import { Link, useParams, useNavigate } from 'react-router-dom'
import { useState, useRef } from 'react'
import { format } from 'date-fns'
import { ArrowLeft, MapPin, Phone, Star, Share2, Send, Clock, ChevronRight, Images } from 'lucide-react'
import CaraRating from '../components/CaraRating/CaraRating.jsx'
import { getLocalById } from '../services/locales.js'
import { saveFicha } from '../services/storage.js'
import { estaAbierto, horarioDeLocal, notaDeComentarios } from '../utils/fichaLocal.js'
import Icons from '../components/Icons/Icons.jsx'
import ImagenLocal from '../components/imagenLocal/ImagenLocal.jsx'
import VisorImagen from '../components/VisorImagen/VisorImagen.jsx'
import './DetalleLocal.css'
import Opiniones from '../components/Opiniones/Opiniones.jsx'
import IconoWhatsApp from '../components/IconoWhatsApp/IconoWhatsApp.jsx'
import TalyMomento from '../components/Taly/TalyMomento.jsx'

const DIAS = [
  { id: 'l', letra: 'L' },
  { id: 'm', letra: 'M' },
  { id: 'x', letra: 'X' },
  { id: 'j', letra: 'J' },
  { id: 'v', letra: 'V' },
  { id: 's', letra: 'S' },
  { id: 'd', letra: 'D' },
]

function DetalleLocal() {
  const { id } = useParams()
  const [local, setLocal] = useState(() => getLocalById(id))
  const navigate = useNavigate()
  const [imagenActiva, setImagenActiva] = useState(null)
  const [errorComentario, setErrorComentario] = useState('')
  const [comentarioNuevoId, setComentarioNuevoId] = useState(null)

  const textareaRef = useRef(null)
  const [comentarioAbierto, setComentarioAbierto] = useState(null)
  const [textoComentario, setTextoComentario] = useState('')
  const [emojiSeleccionado, setEmojiSeleccionado] = useState(0)
  const [animarSubmit, setAnimarSubmit] = useState(false)
  const [animarLimpiar, setAnimarLimpiar] = useState(false)

  function handleTextoComentario(e) {
    e.preventDefault()
    const comentario = textoComentario.trim()
    if(!comentario){
      setErrorComentario('Escribe el comentario antes de enviarlo.')
      return
    }
    if(!emojiSeleccionado){
      setErrorComentario('Elige de 1 a 5 estrellas.')
      return
    }
    const nuevo = {
      id: crypto.randomUUID(),
      nombre: 'Tú',
      fecha: format(new Date(), 'yyyy-MM-dd'),
      calificacion: emojiSeleccionado,
      comentario,
    }
    const comentarios = [nuevo, ...(local.comentarios ?? [])]
    const { nota, cantidad } = notaDeComentarios({ comentarios })
    const cambios = { comentarios, points: String(nota), opiniones: cantidad }
    saveFicha(id, cambios)
    setLocal((prev) => ({ ...prev, ...cambios }))
    setComentarioNuevoId(nuevo.id)
    setErrorComentario('')
    setAnimarLimpiar(true)
    setAnimarSubmit(true)
    setTimeout(() => {
      setTextoComentario('')
      setEmojiSeleccionado(0)
      setAnimarLimpiar(false)
      if (textareaRef.current) {
        textareaRef.current.style.height = '20px'
      }
    }, 1000)
    setTimeout(() => {
      setAnimarSubmit(false)
    }, 3000)
  }
  if (!local) {
    return (
      <section className="detalle-local detalle-local--error">
        <Link to="/" className="detalle-local-volver">
          <ArrowLeft size={20} />
          Volver a Descubre
        </Link>
        <TalyMomento
          escena='loader'
          pose='busca'
          titulo='Local no encontrado'
          texto={`No existe un local con el id “${id}”. Revisa el enlace e inténtalo de nuevo.`}
          accion='Volver a Descubre'
          onAccion={() => navigate('/')}
        />
      </section>
    )
  }
  function handleReservar() {
    if (local.lugar) {
      navigate(`/local/${id}/reservar`)
      return
    }
    navigate(`/local/${id}/reservar-cita`)
  }
  const abiertoAhora = estaAbierto(local)
  const horarioTextoVisible = horarioDeLocal(local)
  const { nota, cantidad } = notaDeComentarios(local)
  const horarioClassName = abiertoAhora ? 'detalle-horario-abierto' : 'detalle-horario-cerrado'
  const textHorario = abiertoAhora ? 'Abierto' : 'Cerrado'
  const rating = Math.min(5, Math.max(0, Number(nota) || 0))
  let fillPercent = (rating / 5) * 100
  if (rating >= 3.8 && rating <= 5) {
    fillPercent = 75
  }
  if(rating <= 3.5) {
    fillPercent += 10
  }
  const iconos = local.iconos.map((icono) => {
    return (
      <Icons key={icono.id} id={icono.id} />
    )
  })

  const handleShare = async () => {
    const url = `${window.location.origin}/local/${id}`
    const shareData = {
      title: `${local.localName} · Citaly`,
      text: `Mira ${local.localName} en Citaly`,
      url,
    }

    try {
      if (navigator.share) {
        await navigator.share(shareData)
      } else {
        await navigator.clipboard.writeText(url)
        alert('Enlace copiado al portapapeles')
      }
    } catch (error) {
      if (error.name === 'AbortError') return
      try {
        await navigator.clipboard.writeText(url)
        alert('Enlace copiado al portapapeles')
      } catch {
        prompt('Copia este enlace:', url)
      }
    }
  }  
  function ajustarAltura() {
  const el = textareaRef.current
  if (!el) return 

  el.style.height = 'auto' 
  el.style.height = `${Math.min(el.scrollHeight, 80)}px` 
}

function handleMostrarComentario(id) {
  setComentarioAbierto((prev) => 
    (prev === id ? null : id))
}
function handleEmoji(id) {
  setEmojiSeleccionado((prev) => (prev === id ? 0 : id))
}

const urlGoogleMaps = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(local.direccion)}`
const urlLlamar = `tel:${local.telefono.replace(/\s/g, '')}`
const numeroWhatsApp = (local.whatsapp ?? local.telefono).replace(/\D/g, '')
const mensajeWhatsApp = encodeURIComponent(
  `Hola, vi ${local.localName} en Citaly y me gustaría consultar.`
)
const urlWhatsApp = `https://wa.me/${numeroWhatsApp}?text=${mensajeWhatsApp}`

return (
    <section className="detalle-local">
      <div
        className="detalle-local-hero"
        style={{
          backgroundImage: `
            linear-gradient(to top, rgba(0, 0, 0, 0.95) 0%, rgba(0, 0, 0, 0.72) 30%, rgba(0, 0, 0, 0.17) 70%),
            url(${local.url})
          `,
        }}
      >
        <div className='detalle-local-links-container'>
        <Link to="/" className="detalle-local-volver">
          <ArrowLeft size={20} />
          Descubre
        </Link>
        <button
          type="button"
          className="detalle-local-share-container"
          onClick={handleShare}
          aria-label="Compartir local"
        >
          <Share2 width={24} className="detalle-local-share" color="currentColor" />
        </button>
        </div>
        <div className="detalle-local-hero-content">
          <span className={`${horarioClassName} detalle-horario`}>{textHorario}</span>
          <h1 className="detalle-local-nombre">{local.localName}</h1>
          <div className="detalle-local-rating">
            <div className="star-rating">
              <div className="star-fill" style={{ width: `${fillPercent}%` }}>
                <Star size={20} strokeWidth={1} className="icono-estrella-rellena" />
              </div>
              <Star size={20} strokeWidth={1} className="icono-estrella-vacia" />
            </div>
            <span>{nota} ({cantidad} opiniones)</span>
            <span className="detalle-local-distancia">· A {local.metros} m</span>
          </div>
          
        </div>
      </div>

      <div className="detalle-local-body"> 
        <div className="detalle-local-stats">
          <div className="detalle-local-stat">
            <span className="detalle-local-stat-valor">{nota}</span>
            <span className="detalle-local-stat-label">Valoración</span>
          </div>
          <div className="detalle-local-stat">
            <span className="detalle-local-stat-valor">{cantidad}</span>
            <span className="detalle-local-stat-label">Opiniones</span>
          </div>
          <div className="detalle-local-stat">
            <span className="detalle-local-stat-valor">{local.metros} m</span>
            <span className="detalle-local-stat-label">Distancia</span>
          </div>
        </div>

        <section className="detalle-local-seccion">
          <h2 className="detalle-local-seccion-titulo">{local.localName} es...</h2>
          <div className='detalle-local-descripcion-container'>
            <p className="detalle-local-descripcion">{local.descripcion}</p>
            <div className='detalle-local-icons-container'>
              {iconos}
            </div>
          </div>
        </section>

        <section className="detalle-local-seccion">
          <h2 className="detalle-local-seccion-titulo">
            Horario
            <span className={`detalle-local-pastilla ${abiertoAhora ? '' : 'detalle-local-pastilla--cerrado'}`}>
              {textHorario}
            </span>
          </h2>
          <div className="detalle-local-grupo">
            <div className="detalle-local-fila detalle-local-fila--semana">
              {DIAS.map(({ id, letra }) => {
                const abre = local.dias.includes(id)
                return (
                  <div key={id} className='dia-div-container'>
                    <span className='dia-div-span'>{letra}</span>
                    <div className={`dia-div ${abre ? 'abierto' : 'cerrado'}`}>{abre ? '•' : '-'}</div>
                  </div>
                )
              })}
            </div>
            <div className="detalle-local-fila">
              <span className="detalle-local-fila-icono"><Clock size={19} /></span>
              <span className="detalle-local-fila-textos">
                <span className="detalle-local-fila-titulo">Abierto de</span>
                <span className="detalle-local-fila-valor">{horarioTextoVisible}</span>
              </span>
            </div>
          </div>
        </section>

        <section className="detalle-local-seccion">
          <h2 className="detalle-local-seccion-titulo">Contacto</h2>
          <div className="detalle-local-grupo">
            <a
              className="detalle-local-fila detalle-local-fila--link"
              href={urlGoogleMaps}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`Cómo llegar a ${local.localName}`}
            >
              <span className="detalle-local-fila-icono"><MapPin size={19} /></span>
              <span className="detalle-local-fila-textos">
                <span className="detalle-local-fila-titulo">Cómo llegar</span>
                <span className="detalle-local-fila-valor">{local.direccion}</span>
              </span>
              <ChevronRight size={18} className="detalle-local-fila-flecha" />
            </a>
            <a
              className="detalle-local-fila detalle-local-fila--link"
              href={urlLlamar}
              aria-label={`Llamar a ${local.localName}`}
            >
              <span className="detalle-local-fila-icono"><Phone size={19} /></span>
              <span className="detalle-local-fila-textos">
                <span className="detalle-local-fila-titulo">Llamar</span>
                <span className="detalle-local-fila-valor">{local.telefono}</span>
              </span>
              <ChevronRight size={18} className="detalle-local-fila-flecha" />
            </a>
            <a
              className="detalle-local-fila detalle-local-fila--link"
              href={urlWhatsApp}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`Escribir por WhatsApp a ${local.localName}`}
            >
              <span className="detalle-local-fila-icono detalle-local-fila-icono--whatsapp">
                <IconoWhatsApp size={19} />
              </span>
              <span className="detalle-local-fila-textos">
                <span className="detalle-local-fila-titulo">WhatsApp</span>
                <span className="detalle-local-fila-valor">{local.whatsapp ?? local.telefono}</span>
              </span>
              <ChevronRight size={18} className="detalle-local-fila-flecha" />
            </a>
          </div>
        </section>

        <section className="detalle-local-seccion">
          <h2 className="detalle-local-seccion-titulo">
            <Images size={18} className="detalle-local-seccion-icono" />
            Fotos
            <span className="detalle-local-pastilla">{local.urls.length}</span>
          </h2>
          <div className='detalle-local-imagenes-container'>
            {local.urls.map((url) => (
              <ImagenLocal key={url} url={url} nombreLugar={local.localName} onClick={() => setImagenActiva(url)}/>
            ))}
          </div>
        </section>

        <button type="button" className="detalle-local-reservar" onClick={handleReservar}>
          Elegir horario y reservar
        </button>
          {imagenActiva && 
          <VisorImagen url={imagenActiva} alt={`Imagen de ${local.localName}`} onClose={() => setImagenActiva(null)} />}
          <div className='detalle-local-opiniones-container'>
            <h2 className='detalle-local-seccion-titulo'>
              Comentarios
              <span className="detalle-local-pastilla">{local.comentarios.length}</span>
            </h2>
            <div className='detalle-local-opiniones-tu-comentario-container'>
              <form className='detalle-local-opiniones-tu-comentario-form' onSubmit={handleTextoComentario}>
                <textarea className={`detalle-local-opiniones-tu-comentario-textarea ${animarLimpiar ? 'limpiando' : ''}`} 
                value={textoComentario}                  onChange={(e) => {
                  setTextoComentario(e.target.value)
                  setErrorComentario('')
                  ajustarAltura()
                }}
                rows={1} 
                placeholder='Escribe tu comentario...' 
                ref={textareaRef}
                onInput={ajustarAltura}
                spellCheck={false}
                autoCorrect="off"
                />
                <button className='detalle-local-opiniones-tu-comentario-boton' type="submit" aria-label='Enviar comentario'><Send size={20} className='detalle-local-opiniones-tu-comentario-boton-icono' style={{animation: animarSubmit ? 'icono-rotar 2s ease-in 1' : 'none',animationFillMode: 'forwards'}} /></button>
              </form>
              <div className='detalle-local-opiniones-dar-estrellas-container'>
                <p className='detalle-local-opiniones-dar-estrellas-titulo'>Puntúa el lugar :</p>
                <div className='detalle-local-opiniones-dar-estrellas-estrellas-container'>
                  <Star size={20} className={`detalle-local-opiniones-dar-estrellas-estrella-icono ${emojiSeleccionado >= 1 ? 'rellena' : ''}`} onClick={() => handleEmoji(1)}/>
                  <Star size={20} className={`detalle-local-opiniones-dar-estrellas-estrella-icono ${emojiSeleccionado >= 2 ? 'rellena' : ''}`} onClick={() => handleEmoji(2)}/>
                  <Star size={20} className={`detalle-local-opiniones-dar-estrellas-estrella-icono ${emojiSeleccionado >= 3 ? 'rellena' : ''}`} onClick={() => handleEmoji(3)}/>
                  <Star size={20} className={`detalle-local-opiniones-dar-estrellas-estrella-icono ${emojiSeleccionado >= 4 ? 'rellena' : ''}`} onClick={() => handleEmoji(4)}/>
                  <Star size={20} className={`detalle-local-opiniones-dar-estrellas-estrella-icono ${emojiSeleccionado >= 5 ? 'rellena' : ''}`} onClick={() => handleEmoji(5)}/>
                  <CaraRating
                    nivel={emojiSeleccionado}
                    size={22}
                    className="detalle-local-opiniones-dar-estrellas-cara"
                  />
              </div>
            </div>
            {errorComentario && <p className="detalle-local-comentario-error">{errorComentario}</p>}
            </div>
            <div className='detalle-local-opiniones-list'>
              {(local.comentarios ?? []).map((comentario) => (
                <Opiniones key={comentario.id} nombre={comentario.nombre} fecha={comentario.fecha} calificacion={comentario.calificacion} comentario={comentario.comentario} imagenPerfil={comentario.imagenPerfil} reciente={comentario.id === comentarioNuevoId} expandido = {comentarioAbierto ===comentario.id} onToggle={() => handleMostrarComentario(comentario.id)}/>
              ))}
            </div>    
          </div>
        </div>

    </section>
  )
}

export default DetalleLocal
