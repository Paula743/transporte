export class HttpError extends Error {
  constructor(status, message) {
    super(message)
    this.status = status
  }
}

export const notFound = (what = 'Recurso') => new HttpError(404, `${what} no encontrado`)
