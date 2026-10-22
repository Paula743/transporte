import { adminAuth, db } from '../src/config/firebase.js'

const reset = process.argv.includes('--reset')
const iso = (days, h, m = 0) => {
  const x = new Date()
  x.setDate(x.getDate() + days)
  x.setHours(h, m, 0, 0)
  return x.toISOString()
}

async function clear(name) {
  const snap = await db.collection(name).get()
  const batch = db.batch()
  snap.docs.forEach((d) => batch.delete(d.ref))
  await batch.commit()
}

async function ensureUser({ name, email, password, role }) {
  let record = await adminAuth.getUserByEmail(email).catch(() => null)
  if (record) await adminAuth.updateUser(record.uid, { password, displayName: name })
  else record = await adminAuth.createUser({ email, password, displayName: name })

  await adminAuth.setCustomUserClaims(record.uid, { role })
  const createdAt = new Date().toISOString()
  const uid = record.uid
  await db.collection('users').doc(uid).set({ name, email, role, createdAt }, { merge: true })
  if (role === 'PASSENGER') await db.collection('passengers').doc(uid).set({ name, email, points: 0, createdAt }, { merge: true })
  if (role === 'DRIVER') await db.collection('drivers').doc(uid).set({ name, email, active: true, createdAt }, { merge: true })
  return uid
}

if (reset) {
  for (const c of ['passengers', 'drivers', 'users', 'routes', 'units', 'trips', 'tickets', 'incidents']) await clear(c)
  console.log('Colecciones limpiadas')
}

// ---------- Usuarios ----------
const admin = await ensureUser({ name: 'Administrador', email: 'admin@demo.com', password: 'admin123', role: 'ADMIN' })
const ana = await ensureUser({ name: 'Ana', email: 'pasajero@demo.com', password: '123456', role: 'PASSENGER' })
const marta = await ensureUser({ name: 'Marta', email: 'marta@demo.com', password: '123456', role: 'PASSENGER' })
const carlos = await ensureUser({ name: 'Carlos', email: 'chofer@demo.com', password: '123456', role: 'DRIVER' })
const luis = await ensureUser({ name: 'Luis', email: 'luis@demo.com', password: '123456', role: 'DRIVER' })

// ---------- Catálogo ----------
const routes = [
  { id: 'R1', origin: 'Irapuato', destination: 'León', km: 75, price: 180 },
  { id: 'R2', origin: 'León', destination: 'Irapuato', km: 75, price: 180 },
  { id: 'R3', origin: 'Irapuato', destination: 'Salamanca', km: 40, price: 90 },
  { id: 'R4', origin: 'Salamanca', destination: 'Querétaro', km: 110, price: 250 },
  { id: 'R5', origin: 'Irapuato', destination: 'Celaya', km: 60, price: 130 },
]
const units = [
  { id: 'U1', plate: 'GTO-101', totalSeats: 40, availableSeats: 39, status: 'CON_RUTA', accumulatedKm: 52000 },
  { id: 'U2', plate: 'GTO-202', totalSeats: 40, availableSeats: 40, status: 'DISPONIBLE', accumulatedKm: 87000 },
  { id: 'U3', plate: 'GTO-303', totalSeats: 30, availableSeats: 30, status: 'DISPONIBLE', accumulatedKm: 31000 },
]

// ---------- Viajes ----------
const trips = [
  { id: 'V1', routeId: 'R1', unitId: 'U1', driverId: carlos, departure: iso(1, 9), arrival: iso(1, 10, 30), platform: 3, status: 'PROXIMO' },
  { id: 'V2', routeId: 'R1', unitId: 'U2', driverId: carlos, departure: iso(1, 18), arrival: iso(1, 19, 30), platform: 4, status: 'PROXIMO' },
  { id: 'V3', routeId: 'R3', unitId: 'U3', driverId: carlos, departure: iso(2, 12), arrival: iso(2, 13), platform: 2, status: 'PROXIMO' },
  { id: 'V4', routeId: 'R5', unitId: 'U2', driverId: luis, departure: iso(3, 7), arrival: iso(3, 8, 15), platform: 1, status: 'PROXIMO' },
]
const tickets = [
  { id: 'T1', tripId: 'V1', passengerId: ana, seat: 1, platform: 3, status: 'VALIDO', createdAt: iso(0, 8) },
]
const incidents = []

for (let i = 1; i <= 24; i++) {
  const id = `VP${i}`
  trips.push({
    id,
    routeId: routes[i % routes.length].id,
    unitId: units[i % units.length].id,
    driverId: i % 2 ? carlos : luis,
    departure: iso(-i * 2, 8 + (i % 10)),
    arrival: iso(-i * 2, 10 + (i % 10)),
    platform: 1 + (i % 8),
    status: 'FINALIZADO',
    finishedAt: iso(-i * 2, 10 + (i % 10)),
  })
  if (i % 3 === 0) tickets.push({ id: `TP${i}a`, tripId: id, passengerId: ana, seat: 1, platform: 2, status: 'VALIDO', createdAt: iso(-i * 2 - 1, 9) })
  if (i % 2 === 0) tickets.push({ id: `TP${i}b`, tripId: id, passengerId: marta, seat: 2, platform: 2, status: 'VALIDO', createdAt: iso(-i * 2 - 1, 9) })
  if (i % 4 === 0) {
    const byPassenger = i % 8 !== 0
    incidents.push({
      id: `I${i}`, tripId: id,
      emitterId: byPassenger ? ana : carlos,
      emitterRole: byPassenger ? 'PASSENGER' : 'DRIVER',
      emitterName: byPassenger ? 'Ana Pasajera' : 'Carlos Chofer',
      title: 'Bloqueo en carretera', description: 'Tráfico detenido por obra.', photo: null,
      createdAt: iso(-i * 2, 9),
    })
  }
}

// ---------- Escritura ----------
const batch = db.batch()
const put = (col, { id, ...data }) => batch.set(db.collection(col).doc(id), data)
routes.forEach((r) => put('routes', r))
units.forEach((u) => put('units', u))
trips.forEach((t) => put('trips', t))
tickets.forEach((t) => put('tickets', t))
incidents.forEach((i) => put('incidents', i))
await batch.commit()

console.log('Seed completo')
console.log(`  usuarios: admin, 2 pasajeros, 2 operadores (admin ${admin.slice(0, 6)}...)`)
console.log(`  rutas: ${routes.length}, unidades: ${units.length}, viajes: ${trips.length}, boletos: ${tickets.length}, incidencias: ${incidents.length}`)
process.exit(0)
