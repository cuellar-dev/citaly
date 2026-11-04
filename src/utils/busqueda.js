export function coincideFiltros(local, filtros) {
  const zona = local.direccion?.split(',').pop()?.trim() || 'Sin zona'
  return (
    (filtros.zona === 'Todas' || zona === filtros.zona) &&
    (filtros.categoria === 'Todas' || local.categoria === filtros.categoria) &&
    (!filtros.abiertos || local.horario) &&
    Number(local.points || 0) >= Number(filtros.rating)
  )
}
