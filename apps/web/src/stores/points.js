import { reactive, watch } from 'vue'
import * as api from '../services/api'
import { auth } from './auth'

export const points = reactive({ value: null })

// Al cambiar de usuario (cerrar sesión o iniciar con otra cuenta) se borra el saldo anterior
watch(
  () => auth.user?.id,
  () => {
    points.value = null
  },
)

export async function refreshPoints() {
  try {
    points.value = await api.getMyPoints(auth.user.id)
  } catch {
    // si falla, se conserva el último valor mostrado
  }
}
