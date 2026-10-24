import { createRepository } from '../../shared/baseRepository.js'

export const incidentsRepository = createRepository('incidents')

// Cuántas incidencias tiene cada viaje (lee solo el campo tripId, sin traer las fotos)
export async function countByTrip() {
  const snap = await incidentsRepository.col.select('tripId').get()
  const counts = {}
  snap.docs.forEach((d) => {
    const id = d.data().tripId
    counts[id] = (counts[id] || 0) + 1
  })
  return counts
}
