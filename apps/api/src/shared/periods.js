import { HttpError } from './httpError.js'

export const ymd = (d) => {
  const x = new Date(d)
  return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, '0')}-${String(x.getDate()).padStart(2, '0')}`
}

export const addMonths = (date, n) => {
  const x = new Date(date)
  x.setMonth(x.getMonth() + n)
  return x
}

export const maxStartDate = () => ymd(addMonths(new Date(), -1))

export function monthPeriod(startStr) {
  const start = new Date(`${startStr}T00:00:00`)
  if (Number.isNaN(start.getTime())) throw new HttpError(400, 'Fecha inválida')
  if (startStr > maxStartDate()) throw new HttpError(400, 'El mes seleccionado aún no se completa')
  return { start, end: addMonths(start, 1) }
}