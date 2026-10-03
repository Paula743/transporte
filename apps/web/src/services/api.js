import { seed, cities } from './mockData'
import { ymd } from '../utils/format'

const DB_KEY = 'mock_db_v1'
const HOUR = 3600 * 1000
let db = JSON.parse(localStorage.getItem(DB_KEY) || 'null') || seed()

const save = () => localStorage.setItem(DB_KEY, JSON.stringify(db))
const wait = (v) => new Promise((r) => setTimeout(() => r(structuredClone(v)), 250))
const fail = (m) => new Promise((_, rej) => setTimeout(() => rej(new Error(m)), 250))

// El viaje se considera FINALIZADO si el chofer lo finalizó o pasó (llegada + 1 hora)
export function tripStatus(t) {
  if (t.status === 'CANCELADO' || t.status === 'FINALIZADO') return t.status
  return Date.now() > new Date(t.arrival).getTime() + HOUR ? 'FINALIZADO' : 'PROXIMO'
}

const tripView = (t) => ({
  ...t,
  status: tripStatus(t),
  route: db.routes.find((r) => r.id === t.routeId),
  unit: db.units.find((u) => u.id === t.unitId),
})

const ticketStatus = (tk) => {
  if (tk.status === 'CANCELADO') return 'CANCELADO'
  const trip = db.trips.find((t) => t.id === tk.tripId)
  return tripStatus(trip) === 'FINALIZADO' ? 'VENCIDO' : 'VALIDO'
}

const publicUser = ({ password, ...u }) => u

// ---------- Auth ----------
export async function login(email, password) {
  const u = db.users.find((x) => x.email === email.trim().toLowerCase() && x.password === password)
  return u ? wait(publicUser(u)) : fail('Correo o contraseña incorrectos')
}

export async function register({ name, email, password, role }) {
  if (!['PASSENGER', 'DRIVER'].includes(role)) return fail('Rol no permitido')
  if (db.users.some((x) => x.email === email.trim().toLowerCase())) return fail('Ese correo ya está registrado')
  const u = { id: `u${Date.now()}`, name, email: email.trim().toLowerCase(), password, role, ...(role === 'PASSENGER' ? { points: 0 } : { active: true }) }
  db.users.push(u)
  save()
  return wait(publicUser(u))
}

// ---------- Pasajero ----------
export const getCities = () => wait(cities)

export async function searchTrips({ origin, destination, date }) {
  const list = db.trips
    .map(tripView)
    .filter((t) => t.status === 'PROXIMO' && new Date(t.departure) > new Date())
    .filter((t) => t.route.origin === origin && t.route.destination === destination)
    .filter((t) => ymd(t.departure) === date)
    .filter((t) => t.unit.availableSeats > 0)
    .sort((a, b) => new Date(a.departure) - new Date(b.departure))
  return wait(list)
}

export async function buyTickets(userId, tripId, quantity) {
  const trip = db.trips.find((t) => t.id === tripId)
  const unit = db.units.find((u) => u.id === trip.unitId)
  if (!Number.isInteger(quantity) || quantity < 1) return fail('Cantidad inválida')
  if (quantity > unit.availableSeats) return fail(`Solo quedan ${unit.availableSeats} asientos`)
  for (let i = 0; i < quantity; i++) {
    db.tickets.push({
      id: `T${Date.now()}${i}`, tripId, passengerId: userId,
      seat: unit.totalSeats - unit.availableSeats + 1, platform: (trip.id.length % 5) + 1,
      status: 'VALIDO', createdAt: new Date().toISOString(),
    })
    unit.availableSeats -= 1
  }
  save()
  return wait({ ok: true })
}

export async function myTickets(userId) {
  const list = db.tickets
    .filter((tk) => tk.passengerId === userId)
    .map((tk) => ({ ...tk, status: ticketStatus(tk), trip: tripView(db.trips.find((t) => t.id === tk.tripId)) }))
    .sort((a, b) => new Date(b.trip.departure) - new Date(a.trip.departure))
  return wait(list)
}

export async function cancelTicket(ticketId) {
  const tk = db.tickets.find((x) => x.id === ticketId)
  if (!tk || ticketStatus(tk) !== 'VALIDO') return fail('Este boleto ya no se puede cancelar')
  const trip = db.trips.find((t) => t.id === tk.tripId)
  tk.status = 'CANCELADO'
  db.units.find((u) => u.id === trip.unitId).availableSeats += 1
  save()
  return wait({ ok: true })
}

// ---------- Incidencias (pasajero y chofer) ----------
export async function reportIncident({ tripId, emitterId, emitterRole, title, description, photo }) {
  const trip = db.trips.find((t) => t.id === tripId)
  if (!trip || tripStatus(trip) === 'FINALIZADO') return fail('El viaje ya finalizó')
  db.incidents.push({ id: `I${Date.now()}`, tripId, emitterId, emitterRole, title, description, photo, createdAt: new Date().toISOString() })
  save()
  return wait({ ok: true })
}

// ---------- Chofer ----------
export async function driverTrips(userId) {
  const list = db.trips.filter((t) => t.driverId === userId).map(tripView)
    .sort((a, b) => new Date(a.departure) - new Date(b.departure))
  return wait(list)
}

export async function finishTrip(tripId) {
  const trip = db.trips.find((t) => t.id === tripId)
  if (!trip || tripStatus(trip) === 'FINALIZADO') return fail('El viaje ya está finalizado')
  trip.status = 'FINALIZADO'
  db.units.find((u) => u.id === trip.unitId).availableSeats = db.units.find((u) => u.id === trip.unitId).totalSeats
  save()
  return wait({ ok: true })
}

// ---------- Admin ----------
export const addMonths = (date, n) => {
  const x = new Date(date)
  x.setMonth(x.getMonth() + n)
  return x
}

// El periodo es [inicio, inicio + 1 mes). Solo se permite si el mes ya terminó.
export const maxStartDate = () => ymd(addMonths(new Date(), -1))

const countBy = (arr, keyFn) => {
  const m = {}
  arr.forEach((x) => { const k = keyFn(x); m[k] = (m[k] || 0) + 1 })
  return m
}
const toRows = (obj, label = 'name') =>
  Object.entries(obj).map(([k, v]) => ({ [label]: k, total: v })).sort((a, b) => b.total - a.total)

export async function adminReport(startDate) {
  if (!startDate || startDate > maxStartDate()) return fail('El mes seleccionado aún no se completa')
  const start = new Date(`${startDate}T00:00:00`)
  const end = addMonths(start, 1)
  const inRange = (iso) => new Date(iso) >= start && new Date(iso) < end

  const trips = db.trips.filter((t) => inRange(t.departure) && tripStatus(t) !== 'CANCELADO')
  const tripIds = new Set(trips.map((t) => t.id))
  const routeName = (t) => { const r = db.routes.find((x) => x.id === t.routeId); return `${r.origin} → ${r.destination}` }
  const incidents = db.incidents.filter((i) => tripIds.has(i.tripId))
  const tripOf = (id) => db.trips.find((t) => t.id === id)

  const routesCommon = toRows(countBy(trips, routeName), 'route')
  const routesIncidents = toRows(countBy(incidents, (i) => routeName(tripOf(i.tripId))), 'route')
  const unitsUsed = toRows(countBy(trips, (t) => db.units.find((u) => u.id === t.unitId).plate), 'unit')
  const clients = toRows(
    countBy(db.tickets.filter((tk) => tripIds.has(tk.tripId) && tk.status !== 'CANCELADO'),
      (tk) => db.users.find((u) => u.id === tk.passengerId)?.name), 'client')

  const drivers = db.users.filter((u) => u.role === 'DRIVER').map((u) => ({
    driver: u.name,
    total: incidents.filter((i) => tripOf(i.tripId).driverId === u.id).length,
  })).sort((a, b) => a.total - b.total)

  const months = []
  for (let k = 5; k >= 0; k--) {
    const s = addMonths(start, -k), e = addMonths(s, 1)
    months.push({
      month: s.toLocaleDateString('es-MX', { month: 'short', year: 'numeric' }),
      total: db.trips.filter((t) => new Date(t.departure) >= s && new Date(t.departure) < e).length,
    })
  }

  return wait({
    period: { from: ymd(start), to: ymd(end) },
    totals: { services: trips.length, incidents: incidents.length },
    routesCommon, routesIncidents, unitsUsed, clients, drivers, months,
  })
}
