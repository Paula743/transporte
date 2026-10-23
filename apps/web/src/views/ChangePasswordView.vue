<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { auth, changePassword, logout, homeFor } from '../stores/auth'

const router = useRouter()
const form = ref({ current: '', next: '', confirm: '' })
const error = ref('')
const loading = ref(false)

async function submit() {
  error.value = ''
  if (form.value.next.length < 8) return (error.value = 'La nueva contraseña debe tener al menos 8 caracteres')
  if (form.value.next === form.value.current) return (error.value = 'La nueva contraseña debe ser distinta a la temporal')
  if (form.value.next !== form.value.confirm) return (error.value = 'Las contraseñas nuevas no coinciden')

  loading.value = true
  try {
    const user = await changePassword(form.value.current, form.value.next)
    router.push(homeFor(user.role))
  } catch (e) {
    error.value = e.message
  } finally {
    loading.value = false
  }
}

function salir() {
  logout()
  router.push('/login')
}
</script>

<template>
  <main class="flex min-h-screen items-center justify-center p-4">
    <form class="card w-full max-w-sm space-y-4" @submit.prevent="submit">
      <div>
        <h1 class="text-2xl font-bold text-emerald-700">Cambia tu contraseña</h1>
        <p class="mt-1 text-sm text-gray-600">
          Hola, {{ auth.user?.name }}. Por seguridad debes reemplazar la contraseña temporal que te dio el
          administrador antes de continuar.
        </p>
      </div>
      <div>
        <label class="label">Contraseña temporal</label>
        <input v-model="form.current" type="password" required autocomplete="current-password" class="input" />
      </div>
      <div>
        <label class="label">Nueva contraseña</label>
        <input v-model="form.next" type="password" required minlength="8" autocomplete="new-password" class="input" />
        <p class="mt-1 text-xs text-gray-500">Mínimo 8 caracteres.</p>
      </div>
      <div>
        <label class="label">Confirmar nueva contraseña</label>
        <input v-model="form.confirm" type="password" required autocomplete="new-password" class="input" />
      </div>
      <p v-if="error" class="text-sm text-red-600">{{ error }}</p>
      <button class="btn-primary w-full" :disabled="loading">{{ loading ? 'Guardando...' : 'Guardar y continuar' }}</button>
      <button type="button" class="w-full text-center text-sm text-gray-500 underline" @click="salir">Cerrar sesión</button>
    </form>
  </main>
</template>
