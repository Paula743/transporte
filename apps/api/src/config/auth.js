import { adminAuth } from './firebase.js'
import { can } from './permissions.js'
import { HttpError } from '../shared/httpError.js'

// Verifica el token y deja el usuario en req.user
export async function authenticate(req, res, next) {
  const header = req.headers.authorization || ''
  const token = header.startsWith('Bearer ') ? header.slice(7) : null
  if (!token) return next(new HttpError(401, 'Falta el token de autenticación'))
  try {
    const decoded = await adminAuth.verifyIdToken(token)
    if (!decoded.role) return next(new HttpError(403, 'Tu cuenta no tiene un rol asignado'))
    req.user = { id: decoded.uid, email: decoded.email, name: decoded.name ?? decoded.email, role: decoded.role }
    next()
  } catch {
    next(new HttpError(401, 'Token inválido o expirado'))
  }
}

// Permite el paso si el rol del usuario tiene AL MENOS uno de los permisos indicados
export const authorize = (...permissions) => (req, res, next) => {
  if (!req.user) return next(new HttpError(401, 'No autenticado'))
  if (!permissions.some((p) => can(req.user.role, p))) {
    return next(new HttpError(403, 'No tienes permiso para esta acción'))
  }
  next()
}
