function FiltroSelect({ id, label, value, options, onChange }) {
  return (
    <label className="filtro-field" htmlFor={id}>
      <span className="filtro-label">{label}</span>
      <select id={id} value={value} onChange={(event) => onChange(event.target.value)}>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  )
}

export default FiltroSelect
