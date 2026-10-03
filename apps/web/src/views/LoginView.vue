<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { login, homeFor } from '../stores/auth'

const router = useRouter()
const email = ref('')
const password = ref('')
const error = ref('')
const loading = ref(false)

async function submit() {
  error.value = ''
  loading.value = true
  try {
    const user = await login(email.value, password.value)
    router.push(homeFor(user.role))
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
      <h1 class="text-2xl font-bold text-emerald-700">Iniciar sesión</h1>
      <div>
        <label class="label">Correo electrónico</label>
        <input v-model="email" type="email" required class="input" placeholder="correo@ejemplo.com" />
      </div>
      <div>
        <label class="label">Contraseña</label>
        <input v-model="password" type="password" required class="input" />
      </div>
      <p v-if="error" class="text-sm text-red-600">{{ error }}</p>
      <button class="btn-primary w-full" :disabled="loading">{{ loading ? 'Entrando...' : 'Entrar' }}</button>
      <p class="text-center text-sm">
        ¿No tienes cuenta?
        <RouterLink to="/register" class="text-emerald-700 underline">Regístrate</RouterLink>
      </p>
    </form>
  </main>
</template>
