import { adminAuth } from '../../config/firebase.js'
import { env } from '../../config/env.js'
import { HttpError } from '../../shared/httpError.js'
import { usersRepository } from './auth.repository.js'
import { passengersRepository } from '../passengers/passenger.repository.js'
import { driversRepository } from '../drivers/driver.repository.js'

export async function register({ name, email, password, role }) {
  let record
  try {
    record = await adminAuth.createUser({ email, password, displayName: name })
  } catch (e) {
    if (e.code === 'auth/email-already-exists') throw new HttpError(409, 'Ese correo ya está registrado')
    throw e
  }
  await adminAuth.setCustomUserClaims(record.uid, { role })

  const createdAt = new Date().toISOString() // timestamp de creación de la cuenta
  await usersRepository.create({ name, email, role, createdAt }, record.uid)
  if (role === 'PASSENGER') await passengersRepository.create({ name, email, points: 0, createdAt }, record.uid)
  if (role === 'DRIVER') await driversRepository.create({ name, email, active: true, createdAt }, record.uid)

  return { id: record.uid, name, email, role }
}

export async function login({ email, password }) {
  const res = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${env.firebase.webApiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, returnSecureToken: true }),
    },
  )
  const data = await res.json()
  if (!res.ok) throw new HttpError(401, 'Correo o contraseña incorrectos')

  const decoded = await adminAuth.verifyIdToken(data.idToken)
  return {
    token: data.idToken,
    user: { id: decoded.uid, name: decoded.name ?? email, email, role: decoded.role },
  }
}
