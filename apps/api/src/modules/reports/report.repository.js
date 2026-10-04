import { tripsRepository } from '../trips/trip.repository.js'
import { ticketsRepository } from '../tickets/ticket.repository.js'
import { incidentsRepository } from '../incidents/incident.repository.js'
import { routesRepository } from '../routes/route.repository.js'
import { unitsRepository } from '../units/unit.repository.js'
import { driversRepository } from '../drivers/driver.repository.js'
import { passengersRepository } from '../passengers/passenger.repository.js'

// Lectura completa de las colecciones; el cálculo se hace en el service
export async function loadAll() {
  const [trips, tickets, incidents, routes, units, drivers, passengers] = await Promise.all([
    tripsRepository.findAll(),
    ticketsRepository.findAll(),
    incidentsRepository.findAll(),
    routesRepository.findAll(),
    unitsRepository.findAll(),
    driversRepository.findAll(),
    passengersRepository.findAll(),
  ])
  return { trips, tickets, incidents, routes, units, drivers, passengers }
}
