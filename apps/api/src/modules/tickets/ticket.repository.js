import { createRepository } from '../../shared/baseRepository.js'

export const ticketsRepository = createRepository('tickets')

export const findByPassenger = (passengerId) => ticketsRepository.findWhere('passengerId', '==', passengerId)
export const findByTrip = (tripId) => ticketsRepository.findWhere('tripId', '==', tripId)
