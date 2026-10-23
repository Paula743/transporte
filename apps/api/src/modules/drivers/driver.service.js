import { adminAuth } from '../../config/firebase.js'
import { HttpError, notFound } from '../../shared/httpError.js'
import { effectiveTripStatus } from '../../shared/tripStatus.js'
import { register } from '../auth/auth.service.js'
import { usersRepository } from '../auth/auth.repository.js'
import { findByDriver } from '../trips/trip.repository.js'
import { driversRepository } from './driver.repository.js'

// Los operadores creados antes de existir el campo "active" se consideran activos
export async function listDrivers() {
  const drivers = await driversRepository.findAll()
  return drivers
    .map((d) => ({ ...d, active: d.active !== false }))
    .sort((a, b) => a.name.localeCompare(b.name, 'es'))
}

export async function getDriver(id) {
  const driver = await driversRepository.findById(id)
  if (!driver) throw notFound('Operador')
  return driver
}

// El administrador da de alta al operador con una contraseña temporal que deberá cambiar en su primer inicio de sesión
export async function createDriver({ name, email, temporaryPassword }) {
  const user = await register({ name, email, password: temporaryPassword, role: 'DRIVER', mustChangePassword: true })
  return { ...user, active: true, mustChangePassword: true }
}

export async function updateDriver(id, { name, email }) {
  await getDriver(id)
  if (!name && !email) throw new HttpError(400, 'No hay datos para actualizar')

  const authPatch = {}
  const patch = {}
  if (name) {
    authPatch.displayName = name
    patch.name = name
  }
  if (email) {
    authPatch.email = email
    patch.email = email
  }
  try {
    await adminAuth.updateUser(id, authPatch)
  } catch (e) {
    if (e.code === 'auth/email-already-exists') throw new HttpError(409, 'Ese correo ya está registrado')
    throw e
  }
  await usersRepository.col.doc(id).set(patch, { merge: true })
  return driversRepository.update(id, patch)
}

// Dar de baja (active = false) bloquea el acceso del operador; reactivarlo (active = true) se lo devuelve
export async function setActive(id, active) {
  await getDriver(id)

  if (!active) {
    const trips = await findByDriver(id)
    if (trips.some((t) => effectiveTripStatus(t) === 'PROXIMO')) {
      throw new HttpError(
        409,
        'El operador tiene viajes programados o en curso. Cancélalos o reasígnalos antes de darlo de baja.',
      )
    }
  }

  await adminAuth.updateUser(id, { disabled: !active })
  if (!active) await adminAuth.revokeRefreshTokens(id)
  const now = new Date().toISOString()
  return driversRepository.update(id, active ? { active: true, reactivatedAt: now } : { active: false, deactivatedAt: now })
}

// Asigna una nueva contraseña temporal (por ejemplo, si el operador nunca recibió o perdió la anterior)
export async function resetTemporaryPassword(id, temporaryPassword) {
  await getDriver(id)
  await adminAuth.updateUser(id, { password: temporaryPassword })
  await adminAuth.setCustomUserClaims(id, { role: 'DRIVER', mustChangePassword: true })
  await adminAuth.revokeRefreshTokens(id)

  const patch = { mustChangePassword: true }
  await usersRepository.col.doc(id).set(patch, { merge: true })
  await driversRepository.col.doc(id).set(patch, { merge: true })
}
