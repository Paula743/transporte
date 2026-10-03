<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { register } from '../stores/auth'

const router = useRouter()
const form = ref({ name: '', email: '', password: '', role: 'PASSENGER' })
const error = ref('')
const loading = ref(false)

async function submit() {
  error.value = ''
  if (form.value.password.length < 6) {
    error.value = 'La contraseña debe tener al menos 6 caracteres'
    return
  }
  loading.value = true
  try {
    await register(form.value)
    router.push('/login')
  } catch (e) {
    error.value = e.message
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <main class="flex min-h-screen items-center justify-center p-4">
    <form @submit.prevent="submit" class="card w-full max-w-sm space-y-4">
      <h1 class="text-2xl font-bold text-emerald-700">Crear cuenta</h1>
      <div>
        <label class="label">Nombre completo</label>
        <input v-model="form.name" required class="input" />
      </div>
      <div>
        <label class="label">Correo electrónico</label>
        <input v-model="form.email" type="email" required class="input" />
      </div>
      <div>
        <label class="label">Contraseña</label>
        <input v-model="form.password" type="password" required class="input" />
      </div>
      <div>
        <label class="label">Tipo de cuenta</label>
        <select v-model="form.role" class="input">
          <option value="PASSENGER">Pasajero</option>
          <option value="DRIVER">Operador (chofer)</option>
        </select>
      </div>
      <p v-if="error" class="text-sm text-red-600">{{ error }}</p>
      <button class="btn-primary w-full" :disabled="loading">{{ loading ? 'Creando...' : 'Registrarme' }}</button>
      <p class="text-center text-sm">
        ¿Ya tienes cuenta?
        <RouterLink to="/login" class="text-emerald-700 underline">Inicia sesión</RouterLink>
      </p>
    </form>
  </main>
</template>
