import { adminAuth } from '../../config/firebase.js'
import { notFound } from '../../shared/httpError.js'
import { register } from '../auth/auth.service.js'
import { driversRepository } from './driver.repository.js'

export const listDrivers = () => driversRepository.findAll()

export async function getDriver(id) {
  const driver = await driversRepository.findById(id)
  if (!driver) throw notFound('Operador')
  return driver
}

// El administrador da de alta operadores
export const createDriver = (data) => register({ ...data, role: 'DRIVER' })

// Activo / inactivo (un operador inactivo no puede iniciar sesión)
export async function setActive(id, active) {
  await getDriver(id)
  await adminAuth.updateUser(id, { disabled: !active })
  return driversRepository.update(id, { active })
}
