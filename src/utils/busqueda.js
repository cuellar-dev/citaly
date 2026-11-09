export const filtrosIniciales = {
  zona: 'Todas',
  categoria: 'Todas',
  abiertos: false,
  rating: '0',
}

export function normalizar(texto) {
  return String(texto || '')
    .toLocaleLowerCase('es')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
}

export function coincideFiltros(local, filtros) {
  const zona = local.direccion?.split(',').pop()?.trim() || 'Sin zona'
  return (
    (filtros.zona === 'Todas' || zona === filtros.zona) &&
    (filtros.categoria === 'Todas' || local.categoria === filtros.categoria) &&
    (!filtros.abiertos || local.horario) &&
    Number(local.points || 0) >= Number(filtros.rating)
  )
}
