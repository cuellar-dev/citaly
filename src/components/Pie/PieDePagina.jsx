import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowUp, ArrowUpRight, Check, Mail, MapPin, Store } from 'lucide-react'
import EscenaFogata from './EscenaFogata.jsx'
import IconoWhatsApp from '../IconoWhatsApp/IconoWhatsApp.jsx'
import { IconoFacebook, IconoInstagram } from './IconosRedes.jsx'
import { CITALY, CONTACTO, EXPLORA, LEGALES, REDES } from './pieDatos.js'
import { filtrosIniciales } from '../../utils/busqueda.js'
import { compartirCitaly } from '../../services/compartir.js'
import Logotipo from '../Logotipo/Logotipo.jsx'
import './pie.css'

const ICONO_RED = { instagram: IconoInstagram, facebook: IconoFacebook }

/* Pie de página de Descubre: sale cuando se acaban los locales.

   Arriba, la escena: Taly descansa junto a una hoguera en mitad del bosque
   (pixel art vivo en canvas, ver escenaFogata.js). Cuando la hoguera
   termina de prender aparece la frase, como cuando en los juegos de almas
   descansas en una hoguera. Abajo, sobre el suelo del bosque que se
   oscurece, va lo de siempre en un pie: la marca, una sola llamada para
   los dueños, los enlaces que no están en la barra de abajo, el contacto
   y lo legal.

   Es siempre de noche (.tema-oscuro-fijo): en el tema claro el degradado
   de arriba pasa del papel crema a la noche del bosque. */
function PieDePagina() {
  const [encendida, setEncendida] = useState(false)
  const [copiado, setCopiado] = useState(false)
  const anio = new Date().getFullYear()

  const compartir = () =>
    compartirCitaly(({ copiado: fueCopiado }) => {
      if (!fueCopiado) return
      setCopiado(true)
      window.setTimeout(() => setCopiado(false), 2200)
    })

  const subir = () => {
    const reducido = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    window.scrollTo({ top: 0, behavior: reducido ? 'auto' : 'smooth' })
  }

  return (
    <footer className="pie tema-oscuro-fijo" aria-labelledby="pie-marca">
      <div className="pie-escena">
        <EscenaFogata onEncendida={() => setEncendida(true)} />
      </div>

      <div className="pie-cuerpo">
        <div className={`pie-hoguera${encendida ? ' pie-hoguera--encendida' : ''}`}>
          <p className="pie-hoguera-frase">Descansa aquí, viajero</p>
          <p className="pie-hoguera-nota">Llegaste al final de Descubre. Taly te cuida el fuego hasta que vuelvas.</p>
        </div>

        <div className="pie-rejilla">
          <section className="pie-marca">
            <h2 id="pie-marca" className="pie-logo">
              <Logotipo variante="blanco" />
            </h2>
            <p className="pie-lema">Descubre los sitios de tu zona y reserva tu cita o tu mesa sin llamar ni esperar.</p>
            <Link to="/negocio" className="pie-cta">
              <Store size={18} strokeWidth={2.25} aria-hidden="true" />
              <span>¿Tienes un local? Súmalo</span>
              <ArrowUpRight size={16} strokeWidth={2.4} aria-hidden="true" />
            </Link>
          </section>

          <nav className="pie-enlaces" aria-label="Pie de página">
            <div className="pie-grupo">
              <h3 className="pie-grupo-titulo">Explora</h3>
              <ul>
                {EXPLORA.map(({ texto, categoria }) => (
                  <li key={categoria}>
                    <Link to="/buscar" state={{ filtros: { ...filtrosIniciales, categoria } }} className="pie-enlace">
                      {texto}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div className="pie-grupo">
              <h3 className="pie-grupo-titulo">Citaly</h3>
              <ul>
                {CITALY.map(({ texto, ruta, accion }) => (
                  <li key={texto}>
                    {accion === 'compartir' ? (
                      <button type="button" className="pie-enlace" onClick={compartir}>
                        {copiado ? (
                          <>
                            <Check size={15} strokeWidth={2.6} aria-hidden="true" /> Enlace copiado
                          </>
                        ) : (
                          texto
                        )}
                      </button>
                    ) : (
                      <Link to={ruta} className="pie-enlace">
                        {texto}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </div>

            <div className="pie-grupo pie-grupo--contacto">
              <h3 className="pie-grupo-titulo">Contacto</h3>
              <ul>
                <li>
                  <a href={CONTACTO.whatsapp} className="pie-enlace pie-enlace--icono" target="_blank" rel="noopener noreferrer">
                    <IconoWhatsApp size={17} />
                    WhatsApp
                  </a>
                </li>
                <li>
                  <a href={CONTACTO.correo} className="pie-enlace pie-enlace--icono">
                    <Mail size={17} strokeWidth={2.25} aria-hidden="true" />
                    Correo
                  </a>
                </li>
                <li className="pie-ciudad">
                  <MapPin size={17} strokeWidth={2.25} aria-hidden="true" />
                  {CONTACTO.ciudad}
                </li>
              </ul>
              <div className="pie-redes">
                {REDES.map(({ id, nombre, url }) => {
                  const Icono = ICONO_RED[id]
                  return (
                    <a key={id} href={url} className="pie-red" target="_blank" rel="noopener noreferrer" aria-label={`Citaly en ${nombre}`}>
                      <Icono size={20} />
                    </a>
                  )
                })}
              </div>
            </div>
          </nav>
        </div>

        <div className="pie-base">
          <p className="pie-copy">
            © {anio} Citaly · Hecho a mano en Cuba
          </p>
          <ul className="pie-legales">
            {LEGALES.map(({ texto, ruta }) => (
              <li key={ruta}>
                <Link to={ruta} className="pie-legal">
                  {texto}
                </Link>
              </li>
            ))}
          </ul>
          <button type="button" className="pie-subir" onClick={subir}>
            <ArrowUp size={17} strokeWidth={2.4} aria-hidden="true" />
            Volver arriba
          </button>
        </div>
      </div>
    </footer>
  )
}

export default PieDePagina
