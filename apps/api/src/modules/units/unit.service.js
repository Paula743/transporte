import { HttpError, notFound } from '../../shared/httpError.js'
import { unitsRepository } from './unit.repository.js'

export const listUnits = () => unitsRepository.findAll()

export async function getUnit(id) {
  const unit = await unitsRepository.findById(id)
  if (!unit) throw notFound('Unidad')
  return unit
}

// Al crear una unidad, todos sus asientos están disponibles
export const createUnit = (data) =>
  unitsRepository.create({ status: 'DISPONIBLE', accumulatedKm: 0, ...data, availableSeats: data.totalSeats })

export async function updateUnit(id, data) {
  const unit = await getUnit(id)
  const patch = { ...data }
  if (data.totalSeats !== undefined) {
    const used = unit.totalSeats - unit.availableSeats
    if (data.totalSeats < used) throw new HttpError(409, 'Hay más asientos ocupados que el nuevo total')
    patch.availableSeats = data.totalSeats - used
  }
  return unitsRepository.update(id, patch)
}

export async function deleteUnit(id) {
  await getUnit(id)
  await unitsRepository.remove(id)
}
