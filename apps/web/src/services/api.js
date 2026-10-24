import { ymd } from '../utils/format'

const BASE = import.meta.env.VITE_API_URL || '/api'
const TOKEN_KEY = 'token'

async function request(path, { method = 'GET', body, raw = false } = {}) {
  const headers = {}
  const token = localStorage.getItem(TOKEN_KEY)
  if (token) headers.Authorization = `Bearer ${token}`
  if (body) headers['Content-Type'] = 'application/json'

  let res
  try {
    res = await fetch(`${BASE}${path}`, { method, headers, body: body ? JSON.stringify(body) : undefined })
  } catch {
    throw new Error('No se pudo conectar con el servidor')
  }

  // Token vencido (dura 1 hora) o cuenta dada de baja: se cierra la sesión
  if (res.status === 401 && token && !path.startsWith('/auth/login')) {
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem('session_user')
    window.location.href = '/login'
    throw new Error('Tu sesión expiró. Inicia sesión de nuevo.')
  }
  if (!res.ok) {
    const data = await res.json().catch(() => ({}))
    throw new Error(data.error || 'Error del servidor')
  }
  if (raw) return res
  return res.status === 204 ? null : res.json()
}

async function download(path, filename) {
  const res = await request(path, { raw: true })
  const blob = await res.blob()
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = filename
  a.click()
  URL.revokeObjectURL(a.href)
}

// ---------- Auth ----------
export async function login(email, password) {
  const { token, user } = await request('/auth/login', { method: 'POST', body: { email, password } })
  localStorage.setItem(TOKEN_KEY, token)
  return user
}

export const register = ({ name, email, password }) =>
  request('/auth/register', { method: 'POST', body: { name, email, password } })

// Cambio de contraseña (también reemplaza la contraseña temporal): devuelve la sesión nueva
export async function changePassword(currentPassword, newPassword) {
  const { token, user } = await request('/auth/change-password', {
    method: 'POST',
    body: { currentPassword, newPassword },
  })
  localStorage.setItem(TOKEN_KEY, token)
  return user
}

// ---------- Pasajero ----------
export const getCities = () => request('/routes/cities')
export const getMyPoints = async () => (await request('/passengers/me')).points ?? 0

export function searchTrips({ origin, destination, date }) {
  const from = new Date(`${date}T00:00:00`)
  const to = new Date(from)
  to.setDate(to.getDate() + 1)
  const qs = new URLSearchParams({ origin, destination, from: from.toISOString(), to: to.toISOString() })
  return request(`/trips/search?${qs}`)
}

export const buyTickets = (userId, tripId, quantity) =>
  request('/tickets', { method: 'POST', body: { tripId, quantity } })

export const myTickets = () => request('/tickets/mine')
export const cancelTicket = (ticketId) => request(`/tickets/${ticketId}/cancel`, { method: 'PATCH' })
export const downloadTicketPdf = (ticketId) => download(`/tickets/${ticketId}/pdf`, `boleto-${ticketId}.pdf`)

// ---------- Incidencias ----------
export const reportIncident = ({ tripId, title, description, photo }) =>
  request('/incidents', { method: 'POST', body: { tripId, title, description, photo } })

export const getIncident = (id) => request(`/incidents/${id}`)
// Todas las incidencias (más reciente primero), o solo las de un viaje
export const listIncidents = ({ tripId } = {}) => request(`/incidents${tripId ? `?tripId=${encodeURIComponent(tripId)}` : ''}`)

// ---------- Chofer ----------
export const driverTrips = () => request('/trips/mine')
export const finishTrip = (tripId) => request(`/trips/${tripId}/finish`, { method: 'PATCH' })

// ---------- Admin: reportes ----------
export const addMonths = (date, n) => {
  const x = new Date(date)
  x.setMonth(x.getMonth() + n)
  return x
}
export const maxStartDate = () => ymd(addMonths(new Date(), -1))
// La ruta correcta es /incidents (antes apuntaba a /reports/incidents, que no existe)
export const adminIncidents = (startDate) => request(`/incidents?start=${startDate}`)
export const adminReport = (startDate) => request(`/reports/monthly?start=${startDate}`)
export const downloadMonthlyXlsx = (startDate) =>
  download(`/reports/monthly/xlsx?start=${startDate}`, `reporte_${startDate}.xlsx`)

// ---------- Admin: rutas ----------
export const listRoutes = () => request('/routes')
export const createRoute = (data) => request('/routes', { method: 'POST', body: data })
export const updateRoute = (id, data) => request(`/routes/${id}`, { method: 'PATCH', body: data })
export const deleteRoute = (id) => request(`/routes/${id}`, { method: 'DELETE' })

// ---------- Admin: unidades ----------
export const listUnits = () => request('/units')
export const createUnit = (data) => request('/units', { method: 'POST', body: data })
export const updateUnit = (id, data) => request(`/units/${id}`, { method: 'PATCH', body: data })
export const deleteUnit = (id) => request(`/units/${id}`, { method: 'DELETE' })
// status: 'EN_MANTENIMIENTO' (enviar a mantenimiento) o 'DISPONIBLE' (regresar a servicio)
export const setUnitStatus = (id, status) => request(`/units/${id}/status`, { method: 'PATCH', body: { status } })

// ---------- Admin: pasajeros (solo consulta) ----------
export const listPassengers = () => request('/passengers')

// ---------- Admin: operadores ----------
export const listDrivers = () => request('/drivers')
export const createDriver = (data) => request('/drivers', { method: 'POST', body: data })
export const updateDriver = (id, data) => request(`/drivers/${id}`, { method: 'PATCH', body: data })
export const setDriverActive = (id, active) => request(`/drivers/${id}/active`, { method: 'PATCH', body: { active } })
export const resetDriverPassword = (id, temporaryPassword) =>
  request(`/drivers/${id}/reset-password`, { method: 'POST', body: { temporaryPassword } })

// ---------- Admin: viajes ----------
export const listTrips = () => request('/trips')
export const createTrip = (data) => request('/trips', { method: 'POST', body: data })
export const updateTrip = (id, data) => request(`/trips/${id}`, { method: 'PATCH', body: data })
export const cancelTrip = (id) => request(`/trips/${id}/cancel`, { method: 'PATCH' })
// Reasigna el operador y/o la unidad (solo se envían los campos elegidos)
export const reassignTrip = (id, { driverId, unitId, reason }) =>
  request(`/trips/${id}/reassign`, {
    method: 'PATCH',
    body: { ...(driverId ? { driverId } : {}), ...(unitId ? { unitId } : {}), ...(reason ? { reason } : {}) },
  })
