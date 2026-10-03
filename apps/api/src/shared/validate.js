import { HttpError } from './httpError.js'

// Valida req.body (o req.query) con un schema de zod y deja el resultado en req.valid
export const validate = (schema, source = 'body') => (req, res, next) => {
  const result = schema.safeParse(req[source])
  if (!result.success) {
    const msg = result.error.issues.map((i) => `${i.path.join('.') || 'dato'}: ${i.message}`).join('; ')
    return next(new HttpError(400, msg))
  }
  req.valid = { ...req.valid, [source]: result.data }
  next()
}
