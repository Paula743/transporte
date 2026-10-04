import { reactive } from 'vue'
import * as api from '../services/api'
import { auth } from './auth'

export const points = reactive({ value: null })

export async function refreshPoints() {
  try {
    points.value = await api.getMyPoints(auth.user.id)
  } catch {
    // si falla, se conserva el último valor mostrado
  }
}