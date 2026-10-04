import { HttpError, notFound } from '../../shared/httpError.js'
import { effectiveTripStatus } from '../../shared/tripStatus.js'
import { incidentsRepository } from './incident.repository.js'
import { tripsRepository } from '../trips/trip.repository.js'
import { findByTrip } from '../tickets/ticket.repository.js'

export async function createIncident(user, { tripId, title, description, photo }) {
  const trip = await tripsRepository.findById(tripId)
  if (!trip) throw notFound('Viaje')
  if (effectiveTripStatus(trip) === 'FINALIZADO') throw new HttpError(409, 'El viaje ya finalizó')

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
    title,
    description,
    photo: photo ?? null,
    createdAt: new Date().toISOString(),
  })
}

export async function listIncidents() {
  const all = await incidentsRepository.findAll()
  return all.sort((a, b) => b.createdAt.localeCompare(a.createdAt))
}
