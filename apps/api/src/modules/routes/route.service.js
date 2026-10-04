import { HttpError, notFound } from '../../shared/httpError.js'
import { routesRepository } from './route.repository.js'

export const listRoutes = () => routesRepository.findAll()

export async function getRoute(id) {
  const route = await routesRepository.findById(id)
  if (!route) throw notFound('Ruta')
  return route
}

// Ciudades disponibles para los selectores de origen y destino
export async function listCities() {
  const routes = await routesRepository.findAll()
  return [...new Set(routes.flatMap((r) => [r.origin, r.destination]))].sort((a, b) => a.localeCompare(b, 'es'))
}

export async function createRoute(data) {
  if (data.origin.toLowerCase() === data.destination.toLowerCase()) {
    throw new HttpError(400, 'El origen y el destino deben ser distintos')
  }
  return routesRepository.create(data)
}

export async function updateRoute(id, data) {
  await getRoute(id)
  return routesRepository.update(id, data)
}

export async function deleteRoute(id) {
  await getRoute(id)
  await routesRepository.remove(id)
}
