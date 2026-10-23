import { reactive } from 'vue'
import * as api from '../services/api.js'

const KEY = 'session_user'
export const auth = reactive({ user: JSON.parse(localStorage.getItem(KEY) || 'null') })

export const homeFor = (role) => ({ ADMIN: '/admin', PASSENGER: '/passenger', DRIVER: '/driver' })[role] || '/login'

function saveSession(user) {
  auth.user = user
  localStorage.setItem(KEY, JSON.stringify(user))
}

export async function login(email, password) {
  const user = await api.login(email, password)
  saveSession(user)
  return user
}

export const register = (data) => api.register(data)

// Reemplaza la contraseña temporal (o cambia la actual) y guarda la sesión nueva
export async function changePassword(currentPassword, newPassword) {
  const user = await api.changePassword(currentPassword, newPassword)
  saveSession(user)
  return user
}

export function logout() {
  auth.user = null
  localStorage.removeItem(KEY)
  localStorage.removeItem('token')
}
