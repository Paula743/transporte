import { FieldValue } from 'firebase-admin/firestore'
import { db } from '../../config/firebase.js'
import { HttpError, notFound } from '../../shared/httpError.js'
import { effectiveTripStatus } from '../../shared/tripStatus.js'
import { tripsRepository, findByDriver, findByRouteIds } from './trip.repository.js'
import { routesRepository } from '../routes/route.repository.js'
import { unitsRepository } from '../units/unit.repository.js'
import { driversRepository } from '../drivers/driver.repository.js'

// Agrega ruta y unidad al viaje y calcula el estatus vigente
export async function withRelations(trip) {
  const [route, unit] = await Promise.all([
    routesRepository.findById(trip.routeId),
    unitsRepository.findById(trip.unitId),
  ])
  return { ...trip, status: effectiveTripStatus(trip), route, unit }
}

const byDeparture = (a, b) => new Date(a.departure) - new Date(b.departure)

export async function search({ origin, destination, from, to }) {
  const routes = (await routesRepository.findWhere('origin', '==', origin)).filter((r) => r.destination === destination)
  const trips = await findByRouteIds(routes.map((r) => r.id))

  const t0 = new Date(from).getTime()
  const t1 = new Date(to).getTime()
  const now = Date.now()
  const candidates = trips.filter((t) => {
    const dep = new Date(t.departure).getTime()
    return effectiveTripStatus(t) === 'PROXIMO' && dep >= t0 && dep < t1 && dep > now
  })

  const list = await Promise.all(candidates.map(withRelations))
  return list.filter((t) => t.unit && t.unit.availableSeats > 0).sort(byDeparture)
}

export async function listTrips() {
  const trips = await tripsRepository.findAll()
  return (await Promise.all(trips.map(withRelations))).sort(byDeparture)
}

export async function driverTrips(driverId) {
  const trips = await findByDriver(driverId)
  return (await Promise.all(trips.map(withRelations))).sort(byDeparture)
}

export async function createTrip(data) {
  const [route, unit, driver] = await Promise.all([
    routesRepository.findById(data.routeId),
    unitsRepository.findById(data.unitId),
    driversRepository.findById(data.driverId),
  ])
  if (!route) throw notFound('Ruta')
  if (!unit) throw notFound('Unidad')
  if (!driver) throw notFound('Operador')

  const departure = new Date(data.departure)
  const arrival = new Date(data.arrival)
  if (arrival <= departure) throw new HttpError(400, 'La llegada debe ser posterior a la salida')

  return tripsRepository.create({
    routeId: data.routeId,
    unitId: data.unitId,
    driverId: data.driverId,
    departure: departure.toISOString(),
    arrival: arrival.toISOString(),
    platform: data.platform ?? 1 + Math.floor(Math.random() * 8),
    status: 'PROXIMO',
  })
}

// Cierra un viaje: lo marca FINALIZADO, libera los asientos y suma kilometraje a la unidad
async function closeTrip(tripId, { driverId } = {}) {
  const tripRef = tripsRepository.col.doc(tripId)
  await db.runTransaction(async (tx) => {
    const tripSnap = await tx.get(tripRef)
    if (!tripSnap.exists) throw notFound('Viaje')
    const trip = tripSnap.data()
    if (driverId && trip.driverId !== driverId) throw new HttpError(403, 'Este viaje no está asignado a ti')
    if (trip.status !== 'PROXIMO' || (driverId && effectiveTripStatus(trip) === 'FINALIZADO')) {
      throw new HttpError(409, 'El viaje ya está finalizado')
    }

    const unitRef = unitsRepository.col.doc(trip.unitId)
    const routeRef = routesRepository.col.doc(trip.routeId)
    const [unitSnap, routeSnap] = await Promise.all([tx.get(unitRef), tx.get(routeRef)])

    tx.update(tripRef, { status: 'FINALIZADO', finishedAt: new Date().toISOString() })
    if (unitSnap.exists) {
      tx.update(unitRef, {
        availableSeats: unitSnap.data().totalSeats,
        accumulatedKm: FieldValue.increment(routeSnap.exists ? routeSnap.data().km : 0),
      })
    }
  })
}

// El chofer finaliza el viaje (por ejemplo, si llegó antes de la hora)
export const finishTrip = (tripId, driverId) => closeTrip(tripId, { driverId })

// Cierra automáticamente los viajes cuya llegada + 1 hora ya pasó
export async function closeExpiredTrips() {
  const open = await tripsRepository.findWhere('status', '==', 'PROXIMO')
  for (const trip of open.filter((t) => effectiveTripStatus(t) === 'FINALIZADO')) {
    await closeTrip(trip.id).catch((e) => console.error('No se pudo cerrar el viaje', trip.id, e.message))
  }
}
