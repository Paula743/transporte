// Datos de ejemplo. Las fechas son relativas al día en que se abre la app por primera vez.
const d = (days, h, m = 0) => {
  const x = new Date()
  x.setDate(x.getDate() + days)
  x.setHours(h, m, 0, 0)
  return x.toISOString()
}

export const cities = ['Irapuato', 'Salamanca', 'León', 'Celaya', 'Querétaro', 'Guanajuato']

export function seed() {
  const users = [
    { id: 'u1', name: 'Administrador', email: 'admin@demo.com', password: 'admin123', role: 'ADMIN' },
    { id: 'u2', name: 'Ana', email: 'pasajero@demo.com', password: '123456', role: 'PASSENGER', points: 120 },
    { id: 'u3', name: 'Carlos', email: 'chofer@demo.com', password: '123456', role: 'DRIVER', active: true },
    { id: 'u4', name: 'Luis', email: 'luis@demo.com', password: '123456', role: 'DRIVER', active: true },
    { id: 'u5', name: 'Marta', email: 'marta@demo.com', password: '123456', role: 'PASSENGER', points: 40 },
  ]

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

  const trips = [
    { id: 'V1', routeId: 'R1', unitId: 'U1', driverId: 'u3', departure: d(1, 9), arrival: d(1, 10, 30), status: 'PROXIMO' },
    { id: 'V2', routeId: 'R1', unitId: 'U2', driverId: 'u3', departure: d(0, 11, 20), arrival: d(0, 12, 30), status: 'PROXIMO' },
    { id: 'V3', routeId: 'R3', unitId: 'U3', driverId: 'u3', departure: d(2, 12), arrival: d(2, 13), status: 'PROXIMO' },
    { id: 'V4', routeId: 'R5', unitId: 'U2', driverId: 'u4', departure: d(3, 7), arrival: d(3, 8, 15), status: 'PROXIMO' },
  ]

  const tickets = [
    { id: 'T1', tripId: 'V1', passengerId: 'u2', seat: 1, platform: 3, status: 'VALIDO', createdAt: d(0, 8) },
    { id: 'T2', tripId: 'V2', passengerId: 'u2', seat: 1, platform: 10, status: 'VALIDO', createdAt: d(0, 8) },
    { id: 'T3', tripId: 'V4', passengerId: 'u2', seat: 1, platform: 4, status: 'VALIDO', createdAt: d(0, 8) },
  ]
  const incidents = []

  // Historial de 24 viajes pasados para que los KPIs tengan información
  for (let i = 1; i <= 24; i++) {
    const r = routes[i % routes.length]
    const id = `VP${i}`
    trips.push({
      id, routeId: r.id, unitId: units[i % units.length].id,
      driverId: i % 2 ? 'u3' : 'u4',
      departure: d(-i * 2, 8 + (i % 10)), arrival: d(-i * 2, 10 + (i % 10)),
      status: 'FINALIZADO',
    })
    if (i % 3 === 0) tickets.push({ id: `TP${i}a`, tripId: id, passengerId: 'u2', seat: 1, platform: 2, status: 'VENCIDO', createdAt: d(-i * 2 - 1, 9) })
    if (i % 2 === 0) tickets.push({ id: `TP${i}b`, tripId: id, passengerId: 'u5', seat: 2, platform: 2, status: 'VENCIDO', createdAt: d(-i * 2 - 1, 9) })
    if (i % 4 === 0) incidents.push({ id: `I${i}`, tripId: id, emitterId: i % 8 ? 'u2' : 'u3', emitterRole: i % 8 ? 'PASSENGER' : 'DRIVER', title: 'Bloqueo en carretera', description: 'Tráfico detenido por obra.', photo: null, createdAt: d(-i * 2, 9) })
  }

  return { users, routes, units, trips, tickets, incidents }
}
