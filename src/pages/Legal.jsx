import { useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import DocumentoLegal from '../components/Legal/DocumentoLegal.jsx'
import { DOCS, irASeccion } from '../components/Legal/documentos.js'

/* /terminos y /privacidad: los dos documentos legales en página propia, con
   pestañas para pasar de uno a otro. Es a donde llevan los enlaces del pie.
   Un #id en la URL (p. ej. /terminos#t-negocios) abre ya en esa sección. */

function Legal() {
  const { pathname, hash } = useLocation()
  const navigate = useNavigate()
  const doc = pathname.includes('privacidad') ? 'privacidad' : 'terminos'

  useEffect(() => {
    document.title = `${DOCS[doc].titulo} · Citaly`
    if (hash) requestAnimationFrame(() => irASeccion(hash.slice(1)))
    else window.scrollTo({ top: 0 })
  }, [doc, hash])

  const volver = () => (window.history.length > 1 ? navigate(-1) : navigate('/'))

  return (
    <div className="legal-pagina">
      <div className="legal-barra">
        <button type="button" className="legal-volver" onClick={volver} aria-label="Volver">
          <ArrowLeft size={20} strokeWidth={2.25} aria-hidden="true" />
        </button>
        <nav className="legal-pestanas" aria-label="Documentos legales">
          {Object.values(DOCS).map((d) => (
            <Link
              key={d.id}
              to={`/${d.id}`}
              replace
              className="legal-pestana"
              aria-current={doc === d.id ? 'page' : undefined}
            >
              {d.corto}
            </Link>
          ))}
        </nav>
      </div>

      <DocumentoLegal doc={doc} onCambiarDoc={(id) => navigate(`/${id}`, { replace: true })} />
    </div>
  )
}

export default Legal
