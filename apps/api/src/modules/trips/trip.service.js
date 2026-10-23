import { FieldValue } from 'firebase-admin/firestore'
import { db } from '../../config/firebase.js'
import { HttpError, notFound } from '../../shared/httpError.js'
import { effectiveTripStatus, hasStarted } from '../../shared/tripStatus.js'
import { tripsRepository, findByDriver, findByRouteIds } from './trip.repository.js'
import { routesRepository } from '../routes/route.repository.js'
import { unitsRepository } from '../units/unit.repository.js'
import { driversRepository } from '../drivers/driver.repository.js'
import { passengersRepository } from '../passengers/passenger.repository.js'
import { ticketsRepository, findByTrip } from '../tickets/ticket.repository.js'

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

// Listado para el administrador: viajes con ruta, unidad, operador y boletos vendidos (más reciente primero)
export async function listTrips() {
  const [trips, routes, units, drivers, tickets] = await Promise.all([
    tripsRepository.findAll(),
    routesRepository.findAll(),
    unitsRepository.findAll(),
    driversRepository.findAll(),
    ticketsRepository.findAll(),
  ])
  const R = Object.fromEntries(routes.map((r) => [r.id, r]))
  const U = Object.fromEntries(units.map((u) => [u.id, u]))
  const D = Object.fromEntries(drivers.map((d) => [d.id, d]))
  const sold = {}
  tickets.filter((t) => t.status === 'VALIDO').forEach((t) => {
    sold[t.tripId] = (sold[t.tripId] || 0) + 1
  })

  return trips
    .map((t) => ({
      ...t,
      status: effectiveTripStatus(t),
      route: R[t.routeId] ?? null,
      unit: U[t.unitId] ?? null,
      driver: D[t.driverId] ? { id: t.driverId, name: D[t.driverId].name, active: D[t.driverId].active !== false } : null,
      ticketsSold: sold[t.id] || 0,
    }))
    .sort((a, b) => byDeparture(b, a))
}

export async function driverTrips(driverId) {
  const trips = await findByDriver(driverId)
  return (await Promise.all(trips.map(withRelations))).sort(byDeparture)
}

// Valida ruta, unidad, operador, fechas y empalmes de horario (ignoreId = viaje que se está editando)
async function validateTripData({ routeId, unitId, driverId, departure, arrival }, ignoreId) {
  const [route, unit, driver] = await Promise.all([
    routesRepository.findById(routeId),
    unitsRepository.findById(unitId),
    driversRepository.findById(driverId),
  ])
  if (!route) throw notFound('Ruta')
  if (!unit) throw notFound('Unidad')
  if (!driver) throw notFound('Operador')
  if (['EN_MANTENIMIENTO', 'FUERA_DE_SERVICIO'].includes(unit.status)) {
    throw new HttpError(409, 'La unidad no está disponible (mantenimiento o fuera de servicio)')
  }
  if (driver.active === false) throw new HttpError(409, 'El operador está dado de baja')

  const dep = new Date(departure)
  const arr = new Date(arrival)
  if (arr <= dep) throw new HttpError(400, 'La llegada debe ser posterior a la salida')
  if (dep <= new Date()) throw new HttpError(400, 'La salida debe ser posterior a la fecha y hora actuales')

  const [unitTrips, operatorTrips] = await Promise.all([
    tripsRepository.findWhere('unitId', '==', unitId),
    findByDriver(driverId),
  ])
  const clash = (t) =>
    t.id !== ignoreId &&
    effectiveTripStatus(t) === 'PROXIMO' &&
    new Date(t.departure) < arr &&
    new Date(t.arrival) > dep
  if (unitTrips.some(clash)) throw new HttpError(409, 'La unidad ya tiene un viaje que se empalma con ese horario')
  if (operatorTrips.some(clash)) throw new HttpError(409, 'El operador ya tiene un viaje que se empalma con ese horario')

  return { dep, arr }
}

export async function createTrip(data) {
  const { dep, arr } = await validateTripData(data)
  return tripsRepository.create({
    routeId: data.routeId,
    unitId: data.unitId,
    driverId: data.driverId,
    departure: dep.toISOString(),
    arrival: arr.toISOString(),
    platform: data.platform ?? 1 + Math.floor(Math.random() * 8),
    status: 'PROXIMO',
  })
}

// Solo se editan viajes que aún no inician; con boletos vendidos no se cambia la ruta ni la unidad
export async function updateTrip(id, data) {
  const trip = await tripsRepository.findById(id)
  if (!trip) throw notFound('Viaje')
  if (trip.status !== 'PROXIMO' || hasStarted(trip)) {
    throw new HttpError(409, 'Solo se pueden editar viajes que aún no inician')
  }

  const merged = {
    routeId: data.routeId ?? trip.routeId,
    unitId: data.unitId ?? trip.unitId,
    driverId: data.driverId ?? trip.driverId,
    departure: data.departure ?? trip.departure,
    arrival: data.arrival ?? trip.arrival,
  }
  const sold = (await findByTrip(id)).filter((t) => t.status !== 'CANCELADO').length
  if (sold > 0 && (merged.routeId !== trip.routeId || merged.unitId !== trip.unitId)) {
    throw new HttpError(409, 'El viaje ya tiene boletos vendidos; no se puede cambiar la ruta ni la unidad')
  }

  const { dep, arr } = await validateTripData(merged, id)
  const patch = {
    routeId: merged.routeId,
    unitId: merged.unitId,
    driverId: merged.driverId,
    departure: dep.toISOString(),
    arrival: arr.toISOString(),
  }
  if (data.platform !== undefined) patch.platform = data.platform
  return tripsRepository.update(id, patch)
}

// El administrador cancela un viaje que aún no inicia: cancela sus boletos, devuelve los puntos y libera los asientos
export async function cancelTrip(tripId) {
  const tripRef = tripsRepository.col.doc(tripId)
  await db.runTransaction(async (tx) => {
    const tripSnap = await tx.get(tripRef)
    if (!tripSnap.exists) throw notFound('Viaje')
    const trip = tripSnap.data()
    if (trip.status === 'CANCELADO') throw new HttpError(409, 'El viaje ya está cancelado')
    if (trip.status !== 'PROXIMO' || hasStarted(trip)) {
      throw new HttpError(409, 'Solo se pueden cancelar viajes que aún no inician')
    }

    const unitRef = unitsRepository.col.doc(trip.unitId)
    const routeRef = routesRepository.col.doc(trip.routeId)
    const [unitSnap, routeSnap, ticketsSnap] = await Promise.all([
      tx.get(unitRef),
      tx.get(routeRef),
      tx.get(ticketsRepository.col.where('tripId', '==', tripId)),
    ])
    const valid = ticketsSnap.docs.filter((d) => d.data().status === 'VALIDO')
    const price = routeSnap.exists ? routeSnap.data().price : 0
    const now = new Date().toISOString()

    tx.update(tripRef, { status: 'CANCELADO', cancelledAt: now })

    const perPassenger = {}
    valid.forEach((d) => {
      tx.update(d.ref, { status: 'CANCELADO', cancelledAt: now, cancelReason: 'VIAJE_CANCELADO' })
      const pid = d.data().passengerId
      perPassenger[pid] = (perPassenger[pid] || 0) + 1
    })
    // Mismos puntos que se otorgaron al comprar: 1 punto por cada $10
    Object.entries(perPassenger).forEach(([pid, n]) => {
      tx.set(
        passengersRepository.col.doc(pid),
        { points: FieldValue.increment(-Math.floor((price * n) / 10)) },
        { merge: true },
      )
    })
    if (unitSnap.exists) {
      const unit = unitSnap.data()
      tx.update(unitRef, { availableSeats: Math.min(unit.totalSeats, unit.availableSeats + valid.length) })
    }
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
    if (trip.status === 'CANCELADO') throw new HttpError(409, 'El viaje fue cancelado')
    if (trip.status !== 'PROXIMO' || (driverId && effectiveTripStatus(trip) === 'FINALIZADO')) {
      throw new HttpError(409, 'El viaje ya está finalizado')
    }
    if (driverId && !hasStarted(trip)) {
      throw new HttpError(409, 'El viaje aún no inicia; podrás finalizarlo cuando comience')
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
