import { notFound } from '../../shared/httpError.js'
import { passengersRepository } from './passenger.repository.js'

export const listPassengers = () => passengersRepository.findAll()

export async function getMe(id) {
  const passenger = await passengersRepository.findById(id)
  if (!passenger) throw notFound('Pasajero')
  return passenger
}
