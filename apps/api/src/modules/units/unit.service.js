import { HttpError, notFound } from '../../shared/httpError.js'
import { effectiveTripStatus } from '../../shared/tripStatus.js'
import { unitsRepository } from './unit.repository.js'
import { tripsRepository } from '../trips/trip.repository.js'

const plateKey = (p) => p.trim().toUpperCase()

// Los asientos disponibles ya no viven en la unidad sino en cada viaje (se ignora el campo antiguo)
export async function listUnits() {
  const units = await unitsRepository.findAll()
  return units
    .map(({ availableSeats, ...unit }) => unit)
    .sort((a, b) => a.plate.localeCompare(b.plate, 'es'))
}

export async function getUnit(id) {
  const unit = await unitsRepository.findById(id)
  if (!unit) throw notFound('Unidad')
  return unit
}

async function assertPlateFree(plate, ignoreId) {
  const units = await unitsRepository.findAll()
  if (units.some((u) => u.id !== ignoreId && plateKey(u.plate) === plate)) {
    throw new HttpError(409, 'Ya existe una unidad con esa placa')
  }
}

// La unidad solo guarda su capacidad (totalSeats); cada viaje copia esa capacidad y lleva su propia cuenta de asientos
export async function createUnit(data) {
  const plate = plateKey(data.plate)
  await assertPlateFree(plate)
  return unitsRepository.create({
    status: 'DISPONIBLE',
    accumulatedKm: 0,
    ...data,
    plate,
  })
}

export async function updateUnit(id, data) {
  await getUnit(id)
  const patch = { ...data }
  if (data.plate) {
    patch.plate = plateKey(data.plate)
    await assertPlateFree(patch.plate, id)
  }
  // Cambiar totalSeats solo afecta a los viajes que se registren después: los ya programados conservan su capacidad
  return unitsRepository.update(id, patch)
}

// Enviar a mantenimiento / regresar a servicio
export async function setStatus(id, status) {
  const unit = await getUnit(id)
  if (unit.status === status) return unit

  if (status === 'EN_MANTENIMIENTO') {
    const trips = await tripsRepository.findWhere('unitId', '==', id)
    if (trips.some((t) => effectiveTripStatus(t) === 'PROXIMO')) {
      throw new HttpError(
        409,
        'La unidad tiene viajes programados o en curso. Cancélalos o reasígnalos antes de enviarla a mantenimiento.',
      )
    }
  }

  const now = new Date().toISOString()
  if (status === 'EN_MANTENIMIENTO') return unitsRepository.update(id, { status, maintenanceSince: now })
  return unitsRepository.update(id, unit.status === 'EN_MANTENIMIENTO' ? { status, lastMaintenanceAt: now } : { status })
}

export async function deleteUnit(id) {
  await getUnit(id)
  const trips = await tripsRepository.findWhere('unitId', '==', id)
  if (trips.length) throw new HttpError(409, 'La unidad tiene viajes registrados; no se puede eliminar.')
  await unitsRepository.remove(id)
}
