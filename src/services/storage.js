const STORAGE_KEY = 'citaly_citas'

export function getCitas() {
  const data = localStorage.getItem(STORAGE_KEY)
  return data ? JSON.parse(data) : []
}

export function saveCitas(citas) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(citas))
}

export function seedCitasIfEmpty(citasIniciales) {
  if (!localStorage.getItem(STORAGE_KEY)) {
    saveCitas(citasIniciales)
  }
}
