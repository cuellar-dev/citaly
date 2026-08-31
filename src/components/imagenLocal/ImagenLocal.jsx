import './imagenlocal.css'

function ImagenLocal({ url, nombreLugar, onClick }) {
  const alt = `Imagenes de ${nombreLugar}`
  return (
    <button type="button" className="imagen-local-div" onClick={onClick}>
      <img src={url} alt={alt} loading="lazy" className="imagen-local" />
    </button>
  )
}
export default ImagenLocal;