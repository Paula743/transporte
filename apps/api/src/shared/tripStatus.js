const HOUR = 3600 * 1000

// Un viaje PROXIMO pasa a FINALIZADO cuando ya pasó su hora de llegada + 1 hora
export function effectiveTripStatus(trip, now = Date.now()) {
  if (trip.status !== 'PROXIMO') return trip.status
  return now > new Date(trip.arrival).getTime() + HOUR ? 'FINALIZADO' : 'PROXIMO'
}

export function effectiveTicketStatus(ticket, trip) {
  if (ticket.status === 'CANCELADO') return 'CANCELADO'
  return effectiveTripStatus(trip) === 'FINALIZADO' ? 'VENCIDO' : 'VALIDO'
}

export const hasStarted = (trip, now = Date.now()) => now >= new Date(trip.departure).getTime() // API REAL