import { Mail, Pencil, Phone } from 'lucide-react'
import MarcoPerfil from './MarcoPerfil.jsx'
import { NubeBorde } from '../DetalleLocal/Tinta.jsx'
import { digitos, fotoCuadrada, iniciales } from '../../utils/fichaLocal.js'
import './cabeceraPerfil.css'

function handleDe(usuario) {
  const nick = String(usuario || '').trim().replace(/^@/, '')
  return nick ? `@${nick}` : ''
}

/* El aro de la foto, dibujado a pluma. Nada de linear-gradient de 135°, y
   tampoco un círculo perfecto: son tres pasadas abiertas que se pasan de
   largo y no cierran, como cuando rodeas algo a mano y repasas el trazo.
   El temblor es fuerte a propósito (scale 5) para que se note.

   Encima, el copete de Taly en mostaza. En arte.js el copete son dos glifos
   de bloque; aquí va a mano, con curvas, que es como se dibujaría de verdad:
   dos plumas, la izquierda más baja que la derecha. */

/* Pasada principal: de -100° a -130° dando casi toda la vuelta. El hueco
   queda arriba a la izquierda, justo donde se apoya el copete. */
const ARO_PRINCIPAL = 'M50.6 6.8 A54 54 0 1 1 25.3 18.6'
/* Repaso de abajo: la segunda vuelta nunca cae sobre la primera. */
const ARO_REPASO = 'M112.2 79 A55.5 55.5 0 0 1 11.9 87.75'
/* Filo de luz, un toque corto arriba a la derecha. */
const ARO_FILO = 'M88.5 10.6 A57 57 0 0 1 110.3 33.3'

/* El copete: un solo mechón, no dos óvalos sueltos (eso salían orejas). Los
   dos picos comparten la base y el derecho es más alto que el izquierdo,
   igual que en arte.js, donde el copete es medio bloque y bloque entero. */
const COPETE =
  'M46 12 C47 4 50 -2 54 -4 C56 0 57 4 60 8 C61 0 64 -7 69 -10 C72 -4 72 4 72 11 C63 14 53 14.5 46 12 Z'

function AroTinta() {
  return (
    <svg className="cabecera-perfil-aro" viewBox="0 0 120 120" aria-hidden="true" focusable="false">
      <defs>
        <filter id="cabecera-perfil-pulso" x="-25%" y="-25%" width="150%" height="150%">
          <feTurbulence type="fractalNoise" baseFrequency="0.028" numOctaves="3" seed="7" result="r" />
          <feDisplacementMap in="SourceGraphic" in2="r" scale="5" xChannelSelector="R" yChannelSelector="G" />
        </filter>
      </defs>

      <g filter="url(#cabecera-perfil-pulso)">
        <g fill="none" strokeLinecap="round">
          <path d={ARO_PRINCIPAL} stroke="var(--primary-color, #00c2ad)" strokeWidth="3" />
          <path
            d={ARO_REPASO}
            stroke="var(--primary-color, #00c2ad)"
            strokeOpacity="0.5"
            strokeWidth="1.7"
          />
          <path
            d={ARO_FILO}
            stroke="var(--ink-pale, #bdf4e8)"
            strokeOpacity="0.5"
            strokeWidth="1.4"
          />
        </g>
        {/* Ladeado, para que el mechón caiga y no se plante de pie. */}
        <path
          d={COPETE}
          fill="var(--yellow-color, #ffd166)"
          transform="rotate(-8 58 8)"
        />
      </g>
    </svg>
  )
}

function CabeceraPerfil({ nombre, usuario, foto, correo, telefono, ciudad, onEditar, onFoto }) {
  const tel = digitos(telefono)
  const handle = handleDe(usuario)
  const avatar = foto ? fotoCuadrada(foto, 400) : ''
  const fondo = foto ? fotoCuadrada(foto, 900) : ''

  return (
    <header
      className={`cabecera-perfil${foto ? ' cabecera-perfil--con-foto tema-oscuro-fijo' : ''}`}
      style={fondo ? { '--perfil-fondo': `url("${fondo}")` } : undefined}
    >
      <MarcoPerfil />

      <div className="cabecera-perfil-barra">
        <button
          type="button"
          className="cabecera-perfil-editar"
          onClick={onEditar}
          disabled={!onEditar}
        >
          <Pencil size={15} strokeWidth={2.25} aria-hidden="true" />
          Editar
        </button>
      </div>

      <div className="cabecera-perfil-quien">
        {foto ? (
          <button type="button" className="cabecera-perfil-foto" onClick={onFoto} aria-label={`Ver la foto de ${nombre}`}>
            <AroTinta />
            <img src={avatar} alt="" />
          </button>
        ) : (
          <div className="cabecera-perfil-foto">
            <AroTinta />
            <span className="cabecera-perfil-iniciales" aria-hidden="true">
              {iniciales(nombre)}
            </span>
          </div>
        )}

        <div className="cabecera-perfil-identidad">
          <h2 className="cabecera-perfil-nombre">{nombre}</h2>
          {handle && <p className="cabecera-perfil-usuario">{handle}</p>}
          {ciudad && <p className="cabecera-perfil-meta">{ciudad}</p>}
        </div>
      </div>

      <ul className="cabecera-perfil-datos">
        {telefono && (
          <li>
            {tel ? (
              <a href={`tel:+${tel}`}>
                <Phone size={13} strokeWidth={2.25} aria-hidden="true" />
                {telefono}
              </a>
            ) : (
              <span>
                <Phone size={13} strokeWidth={2.25} aria-hidden="true" />
                {telefono}
              </span>
            )}
          </li>
        )}
        {correo && (
          <li>
            <a href={`mailto:${correo}`}>
              <Mail size={13} strokeWidth={2.25} aria-hidden="true" />
              {correo}
            </a>
          </li>
        )}
      </ul>
      {/* Con foto la cabecera es de noche también en claro (texto blanco
          sobre foto); la nube la deshace en el papel de la página. */}
      {foto && <NubeBorde />}
    </header>
  )
}

export default CabeceraPerfil
