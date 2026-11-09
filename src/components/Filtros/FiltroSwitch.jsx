function FiltroSwitch({ id, label, checked, onChange }) {
  return (
    <div className="filtro-row">
      <label className="switch-label" htmlFor={id}>
        <span>{label}</span>
        <input id={id} type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} />
      </label>
    </div>
  )
}

export default FiltroSwitch
