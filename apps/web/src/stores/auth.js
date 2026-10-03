import { reactive } from 'vue'
import * as api from '../services/api'

const KEY = 'session_user'
export const auth = reactive({ user: JSON.parse(localStorage.getItem(KEY) || 'null') })

export const homeFor = (role) => ({ ADMIN: '/admin', PASSENGER: '/passenger', DRIVER: '/driver' })[role] || '/login'

export async function login(email, password) {
  const user = await api.login(email, password)
  auth.user = user
  localStorage.setItem(KEY, JSON.stringify(user))
  return user
}

export const register = (data) => api.register(data)

export function logout() {
  auth.user = null
  localStorage.removeItem(KEY)
}
