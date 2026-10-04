import PDFDocument from 'pdfkit'
import QRCode from 'qrcode'
import { FieldValue } from 'firebase-admin/firestore'
import { db } from '../../config/firebase.js'
import { HttpError, notFound } from '../../shared/httpError.js'
import { effectiveTripStatus, effectiveTicketStatus } from '../../shared/tripStatus.js'
import { ticketsRepository, findByPassenger } from './ticket.repository.js'
import { tripsRepository } from '../trips/trip.repository.js'
import { withRelations } from '../trips/trip.service.js'
import { unitsRepository } from '../units/unit.repository.js'
import { routesRepository } from '../routes/route.repository.js'
import { passengersRepository } from '../passengers/passenger.repository.js'

const pointsFor = (price, quantity) => Math.floor((price * quantity) / 10)

export async function buy(user, { tripId, quantity }) {
  const tripRef = tripsRepository.col.doc(tripId)

  return db.runTransaction(async (tx) => {
    const tripSnap = await tx.get(tripRef)
    if (!tripSnap.exists) throw notFound('Viaje')
    const trip = tripSnap.data()
    if (effectiveTripStatus(trip) !== 'PROXIMO' || new Date(trip.departure) <= new Date()) {
      throw new HttpError(409, 'Este viaje ya no está disponible')
    }

    const unitRef = unitsRepository.col.doc(trip.unitId)
    const routeRef = routesRepository.col.doc(trip.routeId)
    const [unitSnap, routeSnap, takenSnap] = await Promise.all([
      tx.get(unitRef),
      tx.get(routeRef),
      tx.get(ticketsRepository.col.where('tripId', '==', tripId)),
    ])
    const unit = unitSnap.data()
    const route = routeSnap.data()

    if (quantity > unit.availableSeats) {
      throw new HttpError(409, `Solo quedan ${unit.availableSeats} asientos disponibles`)
    }

    // Asientos libres más bajos (ignora los boletos cancelados)
    const taken = new Set(takenSnap.docs.map((d) => d.data()).filter((t) => t.status === 'VALIDO').map((t) => t.seat))
    const seats = []
    for (let s = 1; seats.length < quantity && s <= unit.totalSeats; s++) if (!taken.has(s)) seats.push(s)
    if (seats.length < quantity) throw new HttpError(409, 'No hay asientos suficientes')

    const createdAt = new Date().toISOString()
    const created = seats.map((seat) => {
      const ref = ticketsRepository.col.doc()
      const data = { tripId, passengerId: user.id, seat, platform: trip.platform, status: 'VALIDO', createdAt }
      tx.set(ref, data)
      return { id: ref.id, ...data }
    })

    tx.update(unitRef, { availableSeats: unit.availableSeats - quantity })
    tx.set(
      passengersRepository.col.doc(user.id),
      { points: FieldValue.increment(pointsFor(route.price, quantity)) },
      { merge: true },
    )
    return created
  })
}

export async function myTickets(user) {
  const tickets = await findByPassenger(user.id)
  const cache = new Map()
  const out = []
  for (const tk of tickets) {
    if (!cache.has(tk.tripId)) {
      const trip = await tripsRepository.findById(tk.tripId)
      cache.set(tk.tripId, trip ? await withRelations(trip) : null)
    }
    const trip = cache.get(tk.tripId)
    if (!trip) continue
    out.push({ ...tk, status: effectiveTicketStatus(tk, trip), trip })
  }
  return out.sort((a, b) => new Date(b.trip.departure) - new Date(a.trip.departure))
}

export async function cancel(user, ticketId) {
  const ticketRef = ticketsRepository.col.doc(ticketId)

  await db.runTransaction(async (tx) => {
    const ticketSnap = await tx.get(ticketRef)
    if (!ticketSnap.exists) throw notFound('Boleto')
    const ticket = ticketSnap.data()
    if (ticket.passengerId !== user.id) throw new HttpError(403, 'Este boleto no es tuyo')

    const tripSnap = await tx.get(tripsRepository.col.doc(ticket.tripId))
    const trip = tripSnap.data()
    if (effectiveTicketStatus(ticket, trip) !== 'VALIDO') {
      throw new HttpError(409, 'Este boleto ya no se puede cancelar')
    }

    const unitRef = unitsRepository.col.doc(trip.unitId)
    const [unitSnap, routeSnap] = await Promise.all([tx.get(unitRef), tx.get(routesRepository.col.doc(trip.routeId))])
    const unit = unitSnap.data()

    tx.update(ticketRef, { status: 'CANCELADO', cancelledAt: new Date().toISOString() })
    tx.update(unitRef, { availableSeats: Math.min(unit.totalSeats, unit.availableSeats + 1) })
    tx.set(
      passengersRepository.col.doc(user.id),
      { points: FieldValue.increment(-pointsFor(routeSnap.data().price, 1)) },
      { merge: true },
    )
  })
}

// Construye el boleto en PDF con código QR (el controller lo envía al navegador)
export async function buildPdf(user, ticketId) {
  const ticket = await ticketsRepository.findById(ticketId)
  if (!ticket) throw notFound('Boleto')
  if (ticket.passengerId !== user.id && user.role !== 'ADMIN') throw new HttpError(403, 'Este boleto no es tuyo')

  const trip = await withRelations(await tripsRepository.findById(ticket.tripId))
  const qr = await QRCode.toBuffer(ticket.id, { width: 200 })
  const fmt = (iso) => new Date(iso).toLocaleString('es-MX', { dateStyle: 'medium', timeStyle: 'short' })

  const doc = new PDFDocument({ size: 'A5', margin: 40 })
  doc.fontSize(22).fillColor('#059669').text('Boleto de autobús').moveDown(0.8)
  doc.fontSize(12).fillColor('#111827')
  doc.text(`Folio: ${ticket.id}`)
  doc.text(`Ruta: ${trip.route.origin} → ${trip.route.destination}`)
  doc.text(`Salida: ${fmt(trip.departure)}`)
  doc.text(`Llegada: ${fmt(trip.arrival)}`)
  doc.text(`Asiento: ${ticket.seat}     Andén: ${ticket.platform}`)
  doc.text(`Unidad: ${trip.unit.plate}`)
  doc.text(`Precio: $${trip.route.price.toFixed(2)} MXN`)
  doc.text(`Pasajero: ${user.name}`).moveDown()
  doc.image(qr, { width: 120 })
  doc.moveDown(0.5).fontSize(9).fillColor('#6b7280').text('Presenta este código QR al abordar.')
  return { doc, filename: `boleto-${ticket.id}.pdf` }
}
