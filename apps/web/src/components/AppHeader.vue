<script setup>
import { useRouter } from 'vue-router'
import { auth, logout } from '../stores/auth'

defineProps({ title: String })
const router = useRouter()

function salir() {
  logout()
  router.push('/login')
}
</script>

<template>
  <header class="bg-white shadow">
    <div class="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3">
      <h1 class="text-lg font-bold text-emerald-700">{{ title }}</h1>
      <div class="flex items-center gap-3">
        <slot />
        <span class="hidden text-sm text-gray-500 sm:inline">{{ auth.user?.name }}</span>
        <button class="btn-secondary" @click="salir">Cerrar sesión</button>
      </div>
    </div>
  </header>
</template>
