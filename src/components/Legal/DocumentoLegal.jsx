import { ACTUALIZADO, TERMINOS } from './textoLegal.jsx'
import { DOCS, irASeccion } from './documentos.js'
import './legal.css'

/* Un documento legal para leer de corrido: cabecera, índice numerado y las
   secciones. Lo usan la página (/terminos, /privacidad) y el modal del
   registro; cada uno pone alrededor su barra y sus pestañas.

   Los enlaces internos (#t-negocios, #privacidad…) no cambian la URL: si la
   sección está en este documento se hace scroll hasta ella; si es el otro
   documento, se avisa con onCambiarDoc. */

function DocumentoLegal({ doc = 'terminos', onCambiarDoc, nivel = 1 }) {
  const documento = DOCS[doc] ?? TERMINOS
  const Titulo = `h${nivel}`

  function alPulsar(e) {
    const enlace = e.target.closest('a[href^="#"]')
    if (!enlace) return
    const id = enlace.getAttribute('href').slice(1)
    e.preventDefault()
    if (DOCS[id]) {
      onCambiarDoc?.(id)
      return
    }
    irASeccion(id)
  }

  return (
    <article className="legal-doc" onClick={alPulsar} aria-labelledby={`${documento.id}-titulo`}>
      <header className="legal-cabeza">
        <p className="legal-antetitulo">Citaly · Información legal</p>
        <Titulo id={`${documento.id}-titulo`} className="legal-titulo">
          {documento.titulo}
        </Titulo>
        <p className="legal-fecha">Última actualización: {ACTUALIZADO}</p>
        <div className="legal-intro">{documento.intro}</div>
      </header>

      <nav className="legal-indice" aria-label={`Índice de ${documento.titulo.toLowerCase()}`}>
        <p className="legal-indice-titulo">Contenido</p>
        <ol>
          {documento.secciones.map((s, i) => (
            <li key={s.id}>
              <a href={`#${s.id}`}>
                <span className="legal-indice-num">{i + 1}.</span>
                {s.titulo}
              </a>
            </li>
          ))}
        </ol>
      </nav>

      {documento.secciones.map((s, i) => (
        <section key={s.id} id={s.id} tabIndex={-1} className="legal-seccion" aria-labelledby={`${s.id}-h`}>
          <h2 id={`${s.id}-h`} className="legal-h2">
            <span className="legal-num" aria-hidden="true">
              {String(i + 1).padStart(2, '0')}
            </span>
            <span>{s.titulo}</span>
          </h2>
          <div className="legal-cuerpo">{s.cuerpo}</div>
        </section>
      ))}

      <footer className="legal-fin">
        <p>
          Gracias por leer hasta aquí. Si algo no está claro, pregúntanos: preferimos explicarlo dos veces a que firmes algo
          que no entiendes.
        </p>
      </footer>
    </article>
  )
}

export default DocumentoLegal
