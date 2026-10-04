import { createRepository } from '../../shared/baseRepository.js'

export const tripsRepository = createRepository('trips')

export const findByDriver = (driverId) => tripsRepository.findWhere('driverId', '==', driverId)

// Firestore limita "in" a 30 valores
export async function findByRouteIds(ids) {
  if (!ids.length) return []
  const chunks = []
  for (let i = 0; i < ids.length; i += 30) chunks.push(ids.slice(i, i + 30))
  const results = await Promise.all(chunks.map((c) => tripsRepository.findWhere('routeId', 'in', c)))
  return results.flat()
}
