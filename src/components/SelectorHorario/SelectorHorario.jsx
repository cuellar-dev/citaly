import './selectorHorario.css'

function SelectorHorario({ horarios, horarioSeleccionado, onSeleccionar }) {

if(horarios.length === 0){
  return (
    <p className="selector-horario-aviso">No hay horarios disponibles para el dia escogido</p>
  )
}

 return (
  <div className="selector-horario-container">
    {horarios.map((horario)=>{
      const seleccionado = horario === horarioSeleccionado
      return(
        <button
        key={horario}
        type="button"
        className={`selector-horario-item ${seleccionado ? 'selector-horario-item--activo' : ''}`}
        onClick={()=> onSeleccionar(horario)}
        >
          {horario}
        </button>
      )
    })}

  </div>
  
)}
export default SelectorHorario