import { HttpError, notFound } from '../../shared/httpError.js'
import { effectiveTripStatus, hasStarted } from '../../shared/tripStatus.js'
import { monthPeriod } from '../../shared/periods.js'
import { incidentsRepository } from './incident.repository.js'
import { tripsRepository } from '../trips/trip.repository.js'
import { routesRepository } from '../routes/route.repository.js'
import { findByTrip } from '../tickets/ticket.repository.js'



export async function createIncident(user, { tripId, title, description, photo }) {
  const trip = await tripsRepository.findById(tripId)
  if (!trip) throw notFound('Viaje')
  if (!hasStarted(trip)) throw new HttpError(409, 'El viaje aún no inicia; podrás reportar incidencias cuando comience')
  if (effectiveTripStatus(trip) !== 'PROXIMO') throw new HttpError(409, 'El viaje ya finalizó o fue cancelado')

  if (user.role === 'DRIVER' && trip.driverId !== user.id) {
    throw new HttpError(403, 'Este viaje no está asignado a ti')
  }
  if (user.role === 'PASSENGER') {
    const tickets = await findByTrip(tripId)
    const hasTicket = tickets.some((t) => t.passengerId === user.id && t.status !== 'CANCELADO')
    if (!hasTicket) throw new HttpError(403, 'No tienes un boleto vigente en este viaje')
  }

  return incidentsRepository.create({
    tripId,
    emitterId: user.id,
    emitterRole: user.role,
    emitterName: user.name,
    tripDriverId: trip.driverId, // operador del viaje en ese momento (el viaje puede reasignarse después)
    title,
    description,
    photo: photo ?? null,
    createdAt: new Date().toISOString(),
  })
}

// Incidencias para el administrador, de la más reciente a la más antigua (sin la foto, que es pesada):
//  - sin filtros: todas, de cualquier fecha
//  - start: solo las de los viajes que salieron en ese mes
//  - tripId: solo las de ese viaje
export async function listIncidents({ start: startStr, tripId } = {}) {
  const period = startStr ? monthPeriod(startStr) : null
  const [incidents, trips, routes] = await Promise.all([
    incidentsRepository.findAll(),
    tripsRepository.findAll(),
    routesRepository.findAll(),
  ])
  const T = Object.fromEntries(trips.map((t) => [t.id, t]))
  const R = Object.fromEntries(routes.map((r) => [r.id, r]))

  return incidents
    .filter((i) => {
      if (tripId && i.tripId !== tripId) return false
      if (!period) return true
      const trip = T[i.tripId]
      if (!trip) return false
      const dep = new Date(trip.departure)
      return dep >= period.start && dep < period.end
    })
    .map(({ photo, ...i }) => {
      const trip = T[i.tripId]
      const route = trip ? R[trip.routeId] : null
      return {
        ...i,
        hasPhoto: !!photo,
        route: route ? `${route.origin} → ${route.destination}` : trip ? 'Ruta eliminada' : 'Viaje eliminado',
        departure: trip?.departure ?? null,
      }
    })
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
}

// Detalle de una incidencia, con la foto
export async function getIncident(id) {
  const incident = await incidentsRepository.findById(id)
  if (!incident) throw notFound('Incidencia')
  return incident
}
