import ExcelJS from 'exceljs'
import { HttpError } from '../../shared/httpError.js'
import { loadAll } from './report.repository.js'

const ymd = (d) => {
  const x = new Date(d)
  return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, '0')}-${String(x.getDate()).padStart(2, '0')}`
}
const addMonths = (date, n) => {
  const x = new Date(date)
  x.setMonth(x.getMonth() + n)
  return x
}
const maxStartDate = () => ymd(addMonths(new Date(), -1))

const countBy = (arr, keyFn) =>
  arr.reduce((acc, x) => {
    const k = keyFn(x)
    if (k !== undefined) acc[k] = (acc[k] || 0) + 1
    return acc
  }, {})
const toRows = (obj, label) =>
  Object.entries(obj).map(([k, v]) => ({ [label]: k, total: v })).sort((a, b) => b.total - a.total)
const byId = (arr) => Object.fromEntries(arr.map((x) => [x.id, x]))

export async function monthlyReport(startStr) {
  const start = new Date(`${startStr}T00:00:00`)
  if (Number.isNaN(start.getTime())) throw new HttpError(400, 'Fecha inválida')
  if (startStr > maxStartDate()) throw new HttpError(400, 'El mes seleccionado aún no se completa')
  const end = addMonths(start, 1)

  const data = await loadAll()
  const R = byId(data.routes)
  const U = byId(data.units)
  const P = byId(data.passengers)
  const T = byId(data.trips)

  const inRange = (iso) => new Date(iso) >= start && new Date(iso) < end
  const trips = data.trips.filter((t) => inRange(t.departure) && t.status !== 'CANCELADO')
  const ids = new Set(trips.map((t) => t.id))
  const incidents = data.incidents.filter((i) => ids.has(i.tripId))
  const routeName = (t) => (R[t.routeId] ? `${R[t.routeId].origin} → ${R[t.routeId].destination}` : 'Ruta eliminada')

  const drivers = data.drivers
    .map((d) => ({ driver: d.name, total: incidents.filter((i) => T[i.tripId]?.driverId === d.id).length }))
    .sort((a, b) => a.total - b.total) // menos incidencias primero

  const months = []
  for (let k = 5; k >= 0; k--) {
    const s = addMonths(start, -k)
    const e = addMonths(s, 1)
    months.push({
      month: s.toLocaleDateString('es-MX', { month: 'short', year: 'numeric' }),
      total: data.trips.filter((t) => new Date(t.departure) >= s && new Date(t.departure) < e).length,
    })
  }

  return {
    period: { from: ymd(start), to: ymd(end) },
    totals: { services: trips.length, incidents: incidents.length },
    routesCommon: toRows(countBy(trips, routeName), 'route'),
    routesIncidents: toRows(countBy(incidents, (i) => (T[i.tripId] ? routeName(T[i.tripId]) : undefined)), 'route'),
    unitsUsed: toRows(countBy(trips, (t) => U[t.unitId]?.plate), 'unit'),
    clients: toRows(
      countBy(data.tickets.filter((tk) => ids.has(tk.tripId) && tk.status !== 'CANCELADO'), (tk) => P[tk.passengerId]?.name),
      'client',
    ),
    drivers,
    months,
  }
}

function addSheet(wb, name, columns, rows) {
  const ws = wb.addWorksheet(name)
  ws.columns = columns.map((c) => ({ header: c.header, key: c.key, width: c.width ?? 28 }))
  ws.getRow(1).font = { bold: true }
  ws.addRows(rows)
}

export async function buildWorkbook(report) {
  const wb = new ExcelJS.Workbook()
  addSheet(wb, 'Resumen', [{ header: 'Indicador', key: 'k' }, { header: 'Valor', key: 'v', width: 20 }], [
    { k: 'Periodo (inicio)', v: report.period.from },
    { k: 'Periodo (fin)', v: report.period.to },
    { k: 'Servicios del mes', v: report.totals.services },
    { k: 'Incidencias reportadas', v: report.totals.incidents },
  ])
  addSheet(wb, 'Rutas comunes', [{ header: 'Ruta', key: 'route' }, { header: 'Viajes', key: 'total', width: 12 }], report.routesCommon)
  addSheet(wb, 'Rutas con incidentes', [{ header: 'Ruta', key: 'route' }, { header: 'Incidentes', key: 'total', width: 12 }], report.routesIncidents)
  addSheet(wb, 'Unidades más usadas', [{ header: 'Unidad', key: 'unit' }, { header: 'Viajes', key: 'total', width: 12 }], report.unitsUsed)
  addSheet(wb, 'Clientes frecuentes', [{ header: 'Cliente', key: 'client' }, { header: 'Boletos', key: 'total', width: 12 }], report.clients)
  addSheet(wb, 'Operadores', [{ header: 'Operador', key: 'driver' }, { header: 'Incidencias', key: 'total', width: 12 }], report.drivers)
  addSheet(wb, 'Servicios por mes', [{ header: 'Mes', key: 'month' }, { header: 'Servicios', key: 'total', width: 12 }], report.months)
  return wb
}
