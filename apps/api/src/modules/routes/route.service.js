import { HttpError, notFound } from '../../shared/httpError.js'
import { routesRepository } from './route.repository.js'
import { tripsRepository } from '../trips/trip.repository.js'

const same = (a, b) => a.trim().toLowerCase() === b.trim().toLowerCase()

export async function listRoutes() {
  const routes = await routesRepository.findAll()
  return routes.sort((a, b) => a.origin.localeCompare(b.origin, 'es') || a.destination.localeCompare(b.destination, 'es'))
}

export async function getRoute(id) {
  const route = await routesRepository.findById(id)
  if (!route) throw notFound('Ruta')
  return route
}

// Ciudades disponibles para los selectores de origen y destino (sin repetir por mayúsculas/minúsculas)
export async function listCities() {
  const routes = await routesRepository.findAll()
  const cities = new Map()
  routes.flatMap((r) => [r.origin, r.destination]).forEach((c) => {
    if (!cities.has(c.toLowerCase())) cities.set(c.toLowerCase(), c)
  })
  return [...cities.values()].sort((a, b) => a.localeCompare(b, 'es'))
}

// Si la ciudad ya existe en otra ruta se reutiliza su escritura, para que la búsqueda no se fragmente
function canonicalCity(name, routes) {
  const known = routes.flatMap((r) => [r.origin, r.destination]).find((c) => same(c, name))
  return known ?? name
}

async function validateRoute({ origin, destination }, ignoreId) {
  if (same(origin, destination)) throw new HttpError(400, 'El origen y el destino deben ser distintos')
  const routes = await routesRepository.findAll()
  const clash = routes.find((r) => r.id !== ignoreId && same(r.origin, origin) && same(r.destination, destination))
  if (clash) throw new HttpError(409, 'Ya existe una ruta con ese origen y destino')
  return routes
}

export async function createRoute(data) {
  const routes = await validateRoute(data)
  return routesRepository.create({
    ...data,
    origin: canonicalCity(data.origin, routes),
    destination: canonicalCity(data.destination, routes),
  })
}

export async function updateRoute(id, data) {
  const current = await getRoute(id)
  const merged = { ...current, ...data }
  const routes = await validateRoute(merged, id)
  const patch = { ...data }
  if (data.origin) patch.origin = canonicalCity(data.origin, routes.filter((r) => r.id !== id))
  if (data.destination) patch.destination = canonicalCity(data.destination, routes.filter((r) => r.id !== id))
  return routesRepository.update(id, patch)
}

export async function deleteRoute(id) {
  await getRoute(id)
  const trips = await tripsRepository.findWhere('routeId', '==', id)
  if (trips.length) {
    throw new HttpError(409, 'La ruta tiene viajes registrados; no se puede eliminar.')
  }
  await routesRepository.remove(id)
}
