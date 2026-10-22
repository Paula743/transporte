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

  // Token vencido (dura 1 hora): se cierra la sesión
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

export const register = (data) => request('/auth/register', { method: 'POST', body: data })

// ---------- Pasajero ----------
export const getCities = () => request('/routes/cities')

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

// ---------- Chofer ----------
export const driverTrips = () => request('/trips/mine')
export const finishTrip = (tripId) => request(`/trips/${tripId}/finish`, { method: 'PATCH' })

// ---------- Admin ----------
export const addMonths = (date, n) => {
  const x = new Date(date)
  x.setMonth(x.getMonth() + n)
  return x
}
export const adminIncidents = (startDate) => request(`/reports/incidents?start=${startDate}`)
export const maxStartDate = () => ymd(addMonths(new Date(), -1))
export const adminReport = (startDate) => request(`/reports/monthly?start=${startDate}`)
export const downloadMonthlyXlsx = (startDate) =>
  download(`/reports/monthly/xlsx?start=${startDate}`, `reporte_${startDate}.xlsx`)
