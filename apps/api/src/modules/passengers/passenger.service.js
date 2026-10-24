import { notFound } from '../../shared/httpError.js'
import { passengersRepository } from './passenger.repository.js'
import { ticketsRepository } from '../tickets/ticket.repository.js'

// Consulta para el administrador (solo lectura): datos del pasajero y cuántos boletos ha comprado
export async function listPassengers() {
  const [passengers, tickets] = await Promise.all([passengersRepository.findAll(), ticketsRepository.findAll()])
  const bought = {}
  tickets
    .filter((t) => t.status !== 'CANCELADO')
    .forEach((t) => {
      bought[t.passengerId] = (bought[t.passengerId] || 0) + 1
    })
  return passengers
    .map((p) => ({ ...p, points: p.points ?? 0, ticketsCount: bought[p.id] || 0 }))
    .sort((a, b) => a.name.localeCompare(b.name, 'es'))
}

export async function getMe(id) {
  const passenger = await passengersRepository.findById(id)
  if (!passenger) throw notFound('Pasajero')
  return passenger
}
