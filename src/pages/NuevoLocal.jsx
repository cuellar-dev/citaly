import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { BadgeCheck, Check, Clock3, Info, Mail, MapPinned, ShieldCheck, Store } from 'lucide-react'
import Asistente from '../components/NuevoLocal/Asistente.jsx'
import TalyPixel from '../components/Ayuda/TalyPixel.jsx'
import { FORMAS_LEGALES, TIPOS, getTipo } from '../data/tiposLocal.js'
import { PROVINCIAS, getMunicipio, getProvincia } from '../data/cuba.js'
import { getAllLocales } from '../services/locales.js'
import { ErrorLimite, crearMiLocal, guardarSeleccion, nombreRepetido } from '../services/misLocales.js'
import { USUARIO_ACTUAL_ID } from '../services/sesion.js'
import { getUsuarioById } from '../services/usuarios.js'
import { getPerfiles } from '../services/storage.js'
import { anotarEnvio, esperaRestante, textoEspera } from '../utils/limiteEnvios.js'
import {
  MAX,
  errorCorreo,
  errorDireccion,
  errorFijo,
  errorMovil,
  errorNombre,
  errorOpcional,
  formatoTelefono,
  limpiar,
} from '../utils/validarLocal.js'

/* Crear un local, primer formulario: solo lo que hace falta para revisarlo.
   El resto (horario, servicios, fotos, el mapa…) se pide cuando ya está
   aprobado, en /negocio/completar/:id. Así esto se hace en dos minutos.

   Lo que se lleva escrito se guarda en el navegador: si se va la conexión o
   se cierra la pestaña, al volver sigue donde estaba. */

const PASOS = ['Tipo', 'Tu local', 'Dónde está', 'Contacto', 'Repaso']
const BORRADOR = 'citaly_borrador_local'
const ENVIOS = 'citaly_locales_envios'

function correoDeLaCuenta() {
  const u = { ...getUsuarioById(USUARIO_ACTUAL_ID), ...getPerfiles()[USUARIO_ACTUAL_ID] }
  return u?.correo ?? ''
}

const VACIO = {
  tipo: '',
  localName: '',
  categoria: '',
  categoriaOtra: '',
  formaLegal: '',
  provincia: '',
  municipio: '',
  calle: '',
  entreCalles: '',
  referencia: '',
  whatsapp: '',
  telefono: '',
  correoContacto: '',
  declaraDueno: false,
  aceptaNormas: false,
}

/* Del borrador solo se recogen las claves conocidas y con su tipo: lo que
   haya en el localStorage puede venir tocado a mano. */
function leerBorrador() {
  try {
    const b = JSON.parse(localStorage.getItem(BORRADOR))
    if (!b || typeof b !== 'object') return null
    const datos = { ...VACIO }
    for (const k of Object.keys(VACIO)) {
      if (typeof b.datos?.[k] === typeof VACIO[k]) datos[k] = b.datos[k]
    }
    if (!getTipo(datos.tipo)) datos.tipo = ''
    if (!getProvincia(datos.provincia)) datos.provincia = datos.municipio = ''
    if (!getMunicipio(datos.provincia, datos.municipio)) datos.municipio = ''
    const paso = Number.isInteger(b.paso) ? Math.min(Math.max(b.paso, 0), PASOS.length - 1) : 0
    return { datos, paso }
  } catch {
    return null
  }
}

function guardarBorrador(datos, paso) {
  try {
    localStorage.setItem(BORRADOR, JSON.stringify({ datos, paso }))
  } catch {
    /* Sin sitio: se pierde el borrador, no el formulario. */
  }
}

function borrarBorrador() {
  try {
    localStorage.removeItem(BORRADOR)
  } catch {
    /* nada */
  }
}

const categoriaFinal = (d) => (d.categoria === 'otra' ? limpiar(d.categoriaOtra, 30) : d.categoria)

/* Qué falla en cada paso, en orden de aparición: [campo, mensaje]. */
function erroresDelPaso(paso, d) {
  const e = []
  const poner = (campo, msg) => msg && e.push([campo, msg])
  if (paso === 0) {
    poner('tipo', !d.tipo && 'Elige uno de los tres. Si dudas, lee los ejemplos de cada uno, que para eso están.')
  }
  if (paso === 1) {
    poner('localName', errorNombre(d.localName))
    poner('categoria', !d.categoria && 'Dime a qué se dedica: elige una categoría (o «Otra»).')
    if (d.categoria === 'otra') {
      const v = limpiar(d.categoriaOtra, 30)
      poner('categoriaOtra', v.length < 3 ? 'Escribe la categoría, como «Óptica» o «Florería».' : errorOpcional(v, 30))
    }
  }
  if (paso === 2) {
    poner('provincia', !d.provincia && '¿En qué provincia? Cuba es larga, no lo adivino.')
    poner('municipio', d.provincia && !d.municipio && 'Ahora el municipio, que la provincia sola es mucho terreno.')
    poner('calle', errorDireccion(d.calle))
    poner('entreCalles', errorOpcional(d.entreCalles, MAX.entreCalles))
    poner('referencia', errorOpcional(d.referencia, MAX.referencia))
  }
  if (paso === 3) {
    poner('whatsapp', errorMovil(d.whatsapp))
    poner('telefono', errorFijo(d.telefono))
    poner('correoContacto', errorCorreo(d.correoContacto))
    poner('declaraDueno', !d.declaraDueno && 'Marca que el local es tuyo o que te dejan llevarlo. Es importante.')
    poner('aceptaNormas', !d.aceptaNormas && 'Falta aceptar las normas. Son cortitas, palabra.')
  }
  return e
}

const CONSEJOS = [
  'Esto decide cómo te reservan y qué panel verás. Lee los ejemplos con calma.',
  'El nombre tal cual lo pone en tu cartel. Así te reconocen los clientes.',
  'Con calle y número basta. El punto exacto en el mapa lo pones luego.',
  'El WhatsApp es por donde te escriben los clientes. Y al correo te avisamos.',
  'Mira que todo esté bien. Si algo falla, toca «Cambiar».',
]

function NuevoLocal() {
  const navigate = useNavigate()
  const [inicial] = useState(leerBorrador)
  const [fase, setFase] = useState(inicial ? 'form' : 'intro')
  const [paso, setPaso] = useState(inicial?.paso ?? 0)
  const [datos, setDatos] = useState(() => ({
    ...(inicial?.datos ?? VACIO),
    correoContacto: inicial?.datos?.correoContacto || correoDeLaCuenta(),
  }))
  const [error, setError] = useState(null) // { campo, texto, vez }
  const [aviso, setAviso] = useState(null) // nube de duda o de bien
  const [enviando, setEnviando] = useState(false)
  const [creado, setCreado] = useState(null)
  const trampaRef = useRef(null)
  const formRef = useRef(null)
  const locales = useMemo(() => getAllLocales(), [])

  useEffect(() => {
    if (fase === 'form') guardarBorrador(datos, paso)
  }, [datos, paso, fase])

  const tipo = getTipo(datos.tipo)
  const provincia = getProvincia(datos.provincia)

  const cambiar = (campo, valor) => {
    setDatos((d) => ({ ...d, [campo]: valor, ...(campo === 'provincia' ? { municipio: '' } : null) }))
    if (error?.campo === campo) setError(null)
    setAviso(null)
  }

  const enfocar = (campo) => {
    const el = formRef.current?.querySelector(`[name="${campo}"]`)
    el?.focus({ preventScroll: true })
    el?.scrollIntoView({ block: 'center', behavior: 'smooth' })
  }

  const fallar = (campo, texto) => {
    setError((prev) => ({ campo, texto, vez: (prev?.vez ?? 0) + 1 }))
    if (campo) window.setTimeout(() => enfocar(campo), 0)
  }

  const seguir = () => {
    const errores = erroresDelPaso(paso, datos)
    if (errores.length) {
      fallar(...errores[0])
      return
    }
    setError(null)

    /* Al pasar del nombre/dirección: ¿ya hay uno igual? */
    if (paso === 2) {
      const repetido = nombreRepetido(datos.localName, datos.provincia, datos.municipio, locales)
      if (repetido === 'propio') {
        fallar('calle', `Ya tienes un «${limpiar(datos.localName)}» en ${getMunicipio(datos.provincia, datos.municipio)?.nombre}. No hace falta crearlo dos veces.`)
        return
      }
      if (repetido === 'otro' && aviso?.clave !== 'repetido') {
        setAviso({
          clave: 'repetido',
          tono: 'duda',
          texto: `Ya hay un «${limpiar(datos.localName)}» en ${getMunicipio(datos.provincia, datos.municipio)?.nombre}. Si es otro local, sigue sin miedo; si es el mismo, escríbenos desde Ayuda.`,
        })
        return
      }
    }

    if (paso < PASOS.length - 1) {
      setAviso(null)
      setPaso(paso + 1)
      return
    }
    enviar()
  }

  const enviar = async () => {
    for (let p = 0; p < PASOS.length - 1; p++) {
      const errores = erroresDelPaso(p, datos)
      if (errores.length) {
        setPaso(p)
        fallar(...errores[0])
        return
      }
    }
    const espera = esperaRestante(ENVIOS)
    if (espera) {
      fallar(null, `Para, para… Has enviado varios seguidos. Respira y vuelve a intentarlo en ${textoEspera(espera)}.`)
      return
    }

    setEnviando(true)
    await new Promise((r) => window.setTimeout(r, 650))
    anotarEnvio(ENVIOS)

    /* Si la trampa trae algo, quien escribe es un robot: se le dice que sí
       y no se guarda nada. */
    if (trampaRef.current?.value) {
      borrarBorrador()
      setCreado({ localName: limpiar(datos.localName), correoContacto: datos.correoContacto })
      setFase('enviado')
      setEnviando(false)
      return
    }

    try {
      const local = crearMiLocal({
        ...datos,
        categoria: categoriaFinal(datos),
        whatsapp: formatoTelefono(datos.whatsapp),
        telefono: datos.telefono ? formatoTelefono(datos.telefono) : '',
      })
      guardarSeleccion({ tipo: 'propio', id: local.id })
      borrarBorrador()
      setCreado(local)
      setFase('enviado')
    } catch (err) {
      fallar(null, err instanceof ErrorLimite ? err.message : err?.message || 'Algo se torció al guardar. Prueba otra vez.')
    } finally {
      setEnviando(false)
    }
  }

  const atras = () => {
    setError(null)
    setAviso(null)
    setPaso((p) => Math.max(0, p - 1))
  }

  const irAPaso = (p) => {
    setError(null)
    setAviso(null)
    setPaso(p)
  }

  const invalido = (campo) => (error?.campo === campo ? 'true' : undefined)
  const describe = (campo) => (error?.campo === campo ? 'asistente-taly' : undefined)

  /* ---------- Bienvenida ---------- */
  if (fase === 'intro') {
    return (
      <Asistente
        titulo="Nuevo local"
        pasos={PASOS}
        paso={-1}
        onCerrar={() => navigate('/negocio')}
        onSeguir={() => setFase('form')}
        textoSeguir="Empezar"
        taly={{ tono: 'consejo', texto: 'Te acompaño en cada paso. Si algo no queda claro, lo digo yo aquí abajo.' }}
      >
        <div className="paso">
          <div className="paso-cabeza">
            <h2 className="paso-titulo" tabIndex={-1}>
              Pon tu local en Citaly
            </h2>
            <p className="paso-texto">
              Para que los clientes te encuentren y reserven desde el móvil. Ahora solo te pedimos <strong>lo básico</strong>;
              el resto, cuando esté aprobado.
            </p>
          </div>
          <ul className="intro-lista">
            <li>
              <Clock3 size={20} strokeWidth={2.2} aria-hidden="true" />
              <p>
                <strong>Unos 2 minutos</strong>
                <span>5 pasos cortos. Lo que escribas se guarda solo: si se va la conexión, sigues luego.</span>
              </p>
            </li>
            <li>
              <ShieldCheck size={20} strokeWidth={2.2} aria-hidden="true" />
              <p>
                <strong>Lo revisa una persona</strong>
                <span>Comprobamos que el local existe antes de que salga en Citaly. Así nadie se hace pasar por ti.</span>
              </p>
            </li>
            <li>
              <Mail size={20} strokeWidth={2.2} aria-hidden="true" />
              <p>
                <strong>Te avisamos al correo</strong>
                <span>Cuando esté aprobado te escribimos y lo verás en Mi Negocio.</span>
              </p>
            </li>
            <li>
              <MapPinned size={20} strokeWidth={2.2} aria-hidden="true" />
              <p>
                <strong>Después: horario, fotos y el mapa</strong>
                <span>Te lo pedimos poco a poco, con explicaciones, una vez aprobado.</span>
              </p>
            </li>
          </ul>
        </div>
      </Asistente>
    )
  }

  /* ---------- Enviado ---------- */
  if (fase === 'enviado') {
    return (
      <Asistente titulo="Nuevo local" pasos={[]} paso={0} onCerrar={() => navigate('/negocio')} sinPie>
        <div className="asistente-final">
          <span className="asistente-final-taly" aria-hidden="true">
            <TalyPixel estado="llave" />
          </span>
          <h2 className="paso-titulo" tabIndex={-1}>
            ¡Recibido! Ahora lo miramos con calma
          </h2>
          <p className="paso-texto">
            <strong>{creado?.localName}</strong> está en revisión. Una persona del equipo comprueba que el local existe y que
            los datos tienen sentido.
          </p>
          <ol className="linea-tiempo">
            <li data-estado="hecho">
              <span className="linea-tiempo-punto">
                <Check size={14} strokeWidth={3.2} aria-hidden="true" />
              </span>
              <p>
                <strong>Enviado</strong>
                <span>Ya tenemos tus datos.</span>
              </p>
            </li>
            <li data-estado="ahora">
              <span className="linea-tiempo-punto" />
              <p>
                <strong>Revisión humana</strong>
                <span>Suele tardar menos de 48 horas. A veces te llamamos al WhatsApp para confirmar.</span>
              </p>
            </li>
            <li>
              <span className="linea-tiempo-punto" />
              <p>
                <strong>Te avisamos</strong>
                <span>
                  Al correo <b>{creado?.correoContacto}</b> y aquí, en Mi Negocio.
                </span>
              </p>
            </li>
            <li>
              <span className="linea-tiempo-punto" />
              <p>
                <strong>Completas tu ficha</strong>
                <span>Horario, lo que ofreces, fotos y el punto en el mapa. Y a recibir clientes.</span>
              </p>
            </li>
          </ol>
          <div className="asistente-final-acciones">
            <Link to="/negocio" className="asistente-seguir">
              Ir a Mi Negocio
            </Link>
          </div>
        </div>
      </Asistente>
    )
  }

  /* ---------- Los pasos ---------- */
  const taly = error
    ? { tono: 'error', texto: error.texto, vez: error.vez }
    : aviso
      ? { tono: aviso.tono, texto: aviso.texto }
      : paso === 0 && tipo
        ? { tono: 'bien', texto: `${tipo.nombre}, apuntado. ${tipo.pista}` }
        : { tono: 'consejo', texto: CONSEJOS[paso] }

  const municipio = getMunicipio(datos.provincia, datos.municipio)

  return (
    <Asistente
      titulo="Nuevo local"
      pasos={PASOS}
      paso={paso}
      onCerrar={() => navigate('/negocio')}
      onAtras={paso > 0 ? atras : undefined}
      onSeguir={seguir}
      textoSeguir={paso === PASOS.length - 1 ? 'Enviar a revisión' : aviso?.clave === 'repetido' ? 'Es otro, seguir' : 'Siguiente'}
      enviando={enviando}
      taly={taly}
    >
      <form
        ref={formRef}
        className="paso"
        key={paso}
        noValidate
        onSubmit={(e) => {
          e.preventDefault()
          seguir()
        }}
      >
        {/* Trampa para robots: un campo que una persona nunca ve ni rellena. */}
        <div className="campo-trampa" aria-hidden="true">
          <label>
            Página web
            <input ref={trampaRef} name="web" tabIndex={-1} autoComplete="off" defaultValue="" />
          </label>
        </div>

        {paso === 0 && (
          <>
            <div className="paso-cabeza">
              <h2 className="paso-titulo" tabIndex={-1}>
                ¿Cómo te reservan los clientes?
              </h2>
              <p className="paso-texto">Hay tres formas. Elige la que más se parece a tu negocio.</p>
            </div>
            <div className="tipos" role="radiogroup" aria-label="Tipo de local" aria-describedby={describe('tipo')}>
              {TIPOS.map((t) => {
                const elegido = datos.tipo === t.id
                return (
                  <button
                    key={t.id}
                    type="button"
                    role="radio"
                    name={t.id === TIPOS[0].id ? 'tipo' : undefined}
                    aria-checked={elegido}
                    className="tipo-opcion"
                    onClick={() => {
                      cambiar('tipo', t.id)
                      if (datos.tipo !== t.id) setDatos((d) => ({ ...d, tipo: t.id, categoria: '' }))
                    }}
                  >
                    <span className="tipo-cabeza">
                      <span className="tipo-icono">
                        <t.Icono size={22} strokeWidth={2.2} aria-hidden="true" />
                      </span>
                      <span>
                        <span className="tipo-nombre">{t.nombre}</span>
                        <span className="tipo-corto">{t.corto}</span>
                      </span>
                    </span>
                    <span className="tipo-marca" aria-hidden="true">
                      {elegido && <Check size={14} strokeWidth={3.2} />}
                    </span>
                    <span className="tipo-para">
                      Ejemplos: <span>{t.paraQuien}</span>
                    </span>
                    {elegido && (
                      <span className="tipo-pasos" role="list" aria-label={`Cómo funciona ${t.nombre}`}>
                        {t.comoFunciona.map((linea) => (
                          <span role="listitem" key={linea}>
                            {linea}
                          </span>
                        ))}
                      </span>
                    )}
                  </button>
                )
              })}
            </div>
            <p className="nota-caja">
              <Info size={18} strokeWidth={2.2} aria-hidden="true" />
              <span>
                El tipo decide tu panel en Mi Negocio, así que <strong>luego no se cambia</strong> desde la app. Si te equivocas,
                nos escribes y lo arreglamos.
              </span>
            </p>
          </>
        )}

        {paso === 1 && (
          <>
            <div className="paso-cabeza">
              <h2 className="paso-titulo" tabIndex={-1}>
                Tu local
              </h2>
              <p className="paso-texto">Cómo se llama y a qué se dedica.</p>
            </div>
            <label className="campo">
              <span className="campo-label">Nombre del local</span>
              <input
                className="campo-input"
                name="localName"
                value={datos.localName}
                maxLength={MAX.nombre}
                autoComplete="organization"
                placeholder="Ej.: Barbería El Tijeras"
                aria-invalid={invalido('localName')}
                aria-describedby={describe('localName')}
                onChange={(e) => cambiar('localName', e.target.value)}
              />
              <span className="campo-cuenta" aria-hidden="true">
                {datos.localName.length}/{MAX.nombre}
              </span>
            </label>
            <fieldset className="campo" style={{ border: 0, margin: 0, padding: 0 }}>
              <legend className="campo-label">Categoría</legend>
              <p className="campo-ayuda">Sale en la ficha y sirve para que te encuentren al buscar.</p>
              <div className="chips" role="radiogroup" aria-label="Categoría" aria-describedby={describe('categoria')}>
                {[...(tipo?.categorias ?? []), 'otra'].map((c, i) => (
                  <button
                    key={c}
                    type="button"
                    role="radio"
                    name={i === 0 ? 'categoria' : undefined}
                    aria-checked={datos.categoria === c}
                    className="chip-opcion"
                    onClick={() => cambiar('categoria', c)}
                  >
                    {c === 'otra' ? 'Otra…' : c}
                  </button>
                ))}
              </div>
            </fieldset>
            {datos.categoria === 'otra' && (
              <label className="campo">
                <span className="campo-label">¿Cuál?</span>
                <input
                  className="campo-input"
                  name="categoriaOtra"
                  value={datos.categoriaOtra}
                  maxLength={30}
                  placeholder="Ej.: Óptica"
                  aria-invalid={invalido('categoriaOtra')}
                  aria-describedby={describe('categoriaOtra')}
                  onChange={(e) => cambiar('categoriaOtra', e.target.value)}
                />
              </label>
            )}
            <label className="campo">
              <span className="campo-label">
                Forma legal <span className="campo-opcional">opcional</span>
              </span>
              <p className="campo-ayuda">Solo la ve quien revisa; ayuda a aprobarlo antes. Los clientes no la ven.</p>
              <select
                className="campo-input"
                name="formaLegal"
                value={datos.formaLegal}
                onChange={(e) => cambiar('formaLegal', e.target.value)}
              >
                <option value="">Prefiero no decirlo</option>
                {FORMAS_LEGALES.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.label}
                  </option>
                ))}
              </select>
            </label>
          </>
        )}

        {paso === 2 && (
          <>
            <div className="paso-cabeza">
              <h2 className="paso-titulo" tabIndex={-1}>
                ¿Dónde está?
              </h2>
              <p className="paso-texto">La dirección que pondrías en un cartel para llegar.</p>
            </div>
            <div className="campo-fila">
              <label className="campo">
                <span className="campo-label">Provincia</span>
                <select
                  className="campo-input"
                  name="provincia"
                  value={datos.provincia}
                  aria-invalid={invalido('provincia')}
                  aria-describedby={describe('provincia')}
                  onChange={(e) => cambiar('provincia', e.target.value)}
                >
                  <option value="">Elige…</option>
                  {PROVINCIAS.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.nombre}
                    </option>
                  ))}
                </select>
              </label>
              <label className="campo">
                <span className="campo-label">Municipio</span>
                <select
                  className="campo-input"
                  name="municipio"
                  value={datos.municipio}
                  disabled={!provincia}
                  aria-invalid={invalido('municipio')}
                  aria-describedby={describe('municipio')}
                  onChange={(e) => cambiar('municipio', e.target.value)}
                >
                  <option value="">{provincia ? 'Elige…' : 'Primero la provincia'}</option>
                  {provincia?.municipios.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.nombre}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <label className="campo">
              <span className="campo-label">Calle y número</span>
              <input
                className="campo-input"
                name="calle"
                value={datos.calle}
                maxLength={MAX.direccion}
                autoComplete="street-address"
                placeholder="Ej.: Calle Martí #24"
                aria-invalid={invalido('calle')}
                aria-describedby={describe('calle')}
                onChange={(e) => cambiar('calle', e.target.value)}
              />
            </label>
            <label className="campo">
              <span className="campo-label">
                Entre calles <span className="campo-opcional">opcional</span>
              </span>
              <input
                className="campo-input"
                name="entreCalles"
                value={datos.entreCalles}
                maxLength={MAX.entreCalles}
                placeholder="Ej.: entre Céspedes y Maceo"
                aria-invalid={invalido('entreCalles')}
                aria-describedby={describe('entreCalles')}
                onChange={(e) => cambiar('entreCalles', e.target.value)}
              />
            </label>
            <label className="campo">
              <span className="campo-label">
                Una referencia <span className="campo-opcional">opcional</span>
              </span>
              <p className="campo-ayuda">Lo que dirías por teléfono: «frente al parque», «al lado de la bodega».</p>
              <input
                className="campo-input"
                name="referencia"
                value={datos.referencia}
                maxLength={MAX.referencia}
                placeholder="Ej.: portal verde frente al parque"
                aria-invalid={invalido('referencia')}
                aria-describedby={describe('referencia')}
                onChange={(e) => cambiar('referencia', e.target.value)}
              />
            </label>
            <p className="nota-caja nota-caja--verde">
              <MapPinned size={18} strokeWidth={2.2} aria-hidden="true" />
              <span>
                Cuando lo aprobemos te pediremos marcar el <strong>punto exacto en el mapa</strong>. Así nadie se pierde.
              </span>
            </p>
          </>
        )}

        {paso === 3 && (
          <>
            <div className="paso-cabeza">
              <h2 className="paso-titulo" tabIndex={-1}>
                ¿Cómo te contactan?
              </h2>
              <p className="paso-texto">Los clientes verán el WhatsApp y el fijo. El correo es solo para nosotros.</p>
            </div>
            <label className="campo">
              <span className="campo-label">WhatsApp del local</span>
              <span className="campo-prefijo">
                <span aria-hidden="true">+53</span>
                <input
                  className="campo-input"
                  name="whatsapp"
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel-national"
                  value={datos.whatsapp}
                  maxLength={16}
                  placeholder="5 123 4567"
                  aria-invalid={invalido('whatsapp')}
                  aria-describedby={describe('whatsapp')}
                  onChange={(e) => cambiar('whatsapp', e.target.value.replace(/[^\d +()-]/g, ''))}
                />
              </span>
            </label>
            <label className="campo">
              <span className="campo-label">
                Teléfono fijo <span className="campo-opcional">opcional</span>
              </span>
              <span className="campo-prefijo">
                <span aria-hidden="true">+53</span>
                <input
                  className="campo-input"
                  name="telefono"
                  type="tel"
                  inputMode="tel"
                  value={datos.telefono}
                  maxLength={16}
                  placeholder="41 654321"
                  aria-invalid={invalido('telefono')}
                  aria-describedby={describe('telefono')}
                  onChange={(e) => cambiar('telefono', e.target.value.replace(/[^\d +()-]/g, ''))}
                />
              </span>
            </label>
            <label className="campo">
              <span className="campo-label">Correo para avisarte</span>
              <p className="campo-ayuda">Ahí te escribimos cuando aprobemos el local. No se enseña a nadie.</p>
              <input
                className="campo-input"
                name="correoContacto"
                type="email"
                inputMode="email"
                autoComplete="email"
                value={datos.correoContacto}
                maxLength={MAX.correo}
                aria-invalid={invalido('correoContacto')}
                aria-describedby={describe('correoContacto')}
                onChange={(e) => cambiar('correoContacto', e.target.value.trim())}
              />
            </label>
            <label className="check" data-invalido={error?.campo === 'declaraDueno' || undefined}>
              <input
                type="checkbox"
                name="declaraDueno"
                checked={datos.declaraDueno}
                aria-describedby={describe('declaraDueno')}
                onChange={(e) => cambiar('declaraDueno', e.target.checked)}
              />
              <span>
                El local es mío o tengo permiso para llevarlo en Citaly.
                <small>Si alguien lo reclama, te pediremos comprobarlo.</small>
              </span>
            </label>
            <label className="check" data-invalido={error?.campo === 'aceptaNormas' || undefined}>
              <input
                type="checkbox"
                name="aceptaNormas"
                checked={datos.aceptaNormas}
                aria-describedby={describe('aceptaNormas')}
                onChange={(e) => cambiar('aceptaNormas', e.target.checked)}
              />
              <span>
                Acepto las normas de Citaly.
                <small>Precios reales, nada de engaños y respetar las reservas que aceptes.</small>
              </span>
            </label>
          </>
        )}

        {paso === 4 && (
          <>
            <div className="paso-cabeza">
              <h2 className="paso-titulo" tabIndex={-1}>
                ¿Está todo bien?
              </h2>
              <p className="paso-texto">Esto es lo que mandamos a revisión.</p>
            </div>
            <dl className="resumen-lista">
              {[
                ['Tipo', tipo?.nombre, 0],
                ['Nombre', limpiar(datos.localName), 1],
                ['Categoría', categoriaFinal(datos), 1],
                [
                  'Dirección',
                  [limpiar(datos.calle), limpiar(datos.entreCalles), municipio?.nombre, provincia?.nombre].filter(Boolean).join(', '),
                  2,
                ],
                ['WhatsApp', formatoTelefono(datos.whatsapp), 3],
                ['Fijo', datos.telefono ? formatoTelefono(datos.telefono) : '—', 3],
                ['Correo', datos.correoContacto, 3],
              ].map(([etiqueta, valor, p]) => (
                <div className="resumen-fila" key={etiqueta}>
                  <dt>{etiqueta}</dt>
                  <dd>{valor}</dd>
                  <button type="button" className="resumen-editar" onClick={() => irAPaso(p)} aria-label={`Cambiar ${etiqueta.toLowerCase()}`}>
                    Cambiar
                  </button>
                </div>
              ))}
            </dl>
            <p className="nota-caja nota-caja--verde">
              <BadgeCheck size={18} strokeWidth={2.2} aria-hidden="true" />
              <span>
                Lo revisa <strong>una persona</strong>, no un robot. Si lo aprobamos, te escribimos a{' '}
                <strong>{datos.correoContacto}</strong> y lo verás en Mi Negocio.
              </span>
            </p>
            <p className="nota-caja">
              <Store size={18} strokeWidth={2.2} aria-hidden="true" />
              <span>Mientras lo revisamos, tu local no sale en Citaly todavía.</span>
            </p>
          </>
        )}
        <button type="submit" hidden aria-hidden="true" tabIndex={-1} />
      </form>
    </Asistente>
  )
}

export default NuevoLocal
