import { adminAuth } from '../../config/firebase.js'
import { env } from '../../config/env.js'
import { HttpError } from '../../shared/httpError.js'
import { usersRepository } from './auth.repository.js'
import { passengersRepository } from '../passengers/passenger.repository.js'
import { driversRepository } from '../drivers/driver.repository.js'

// mustChangePassword = true se usa cuando el administrador da de alta a un operador con contraseña temporal
export async function register({ name, email, password, role, mustChangePassword = false }) {
  let record
  try {
    record = await adminAuth.createUser({ email, password, displayName: name })
  } catch (e) {
    if (e.code === 'auth/email-already-exists') throw new HttpError(409, 'Ese correo ya está registrado')
    throw e
  }
  await adminAuth.setCustomUserClaims(record.uid, mustChangePassword ? { role, mustChangePassword: true } : { role })

  const createdAt = new Date().toISOString() // timestamp de creación de la cuenta
  await usersRepository.create({ name, email, role, mustChangePassword, createdAt }, record.uid)
  if (role === 'PASSENGER') await passengersRepository.create({ name, email, points: 0, createdAt }, record.uid)
  if (role === 'DRIVER') {
    await driversRepository.create({ name, email, active: true, mustChangePassword, createdAt }, record.uid)
  }

  return { id: record.uid, name, email, role }
}

// Inicia sesión contra Firebase Authentication y devuelve el token y los datos del usuario
async function signIn(email, password) {
  const res = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${env.firebase.webApiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, returnSecureToken: true }),
    },
  )
  const data = await res.json()
  if (!res.ok) {
    if (data?.error?.message === 'USER_DISABLED') {
      throw new HttpError(403, 'Tu cuenta está dada de baja. Contacta al administrador.')
    }
    throw new HttpError(401, 'Correo o contraseña incorrectos')
  }

  const decoded = await adminAuth.verifyIdToken(data.idToken)
  return {
    token: data.idToken,
    user: {
      id: decoded.uid,
      name: decoded.name ?? email,
      email,
      role: decoded.role,
      mustChangePassword: decoded.mustChangePassword === true,
    },
  }
}

export const login = ({ email, password }) => signIn(email, password)

// Cambia la contraseña del usuario autenticado y devuelve una sesión nueva (token sin la marca de contraseña temporal)
export async function changePassword(user, { currentPassword, newPassword }) {
  try {
    await signIn(user.email, currentPassword)
  } catch {
    // 400 (y no 401) para que el Front-End no lo confunda con una sesión vencida
    throw new HttpError(400, 'La contraseña actual es incorrecta')
  }

  await adminAuth.updateUser(user.id, { password: newPassword })
  await adminAuth.setCustomUserClaims(user.id, { role: user.role }) // quita mustChangePassword

  const patch = { mustChangePassword: false, passwordChangedAt: new Date().toISOString() }
  await usersRepository.col.doc(user.id).set(patch, { merge: true })
  if (user.role === 'DRIVER') await driversRepository.col.doc(user.id).set(patch, { merge: true })

  return signIn(user.email, newPassword)
}
