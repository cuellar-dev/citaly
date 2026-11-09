import { ArrowRight } from 'lucide-react'

function LocalHorizontal({ local, onClick }) {
  const rating = Number(local.points || 0).toFixed(1)

  return (
    <button type="button" className="local-horizontal" onClick={onClick}>
      <img src={local.url} alt="" />
      <span className="local-horizontal-info">
        <strong>{local.localName}</strong>
        <small>{local.categoria}</small>
        <span className="local-horizontal-meta">
          <span className="local-rating">★ {rating}</span>
          <span>{local.metros} m</span>
        </span>
      </span>
      <ArrowRight size={16} aria-hidden="true" />
    </button>
  )
}

export default LocalHorizontal
