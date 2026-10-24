<script setup>
import { useRouter } from 'vue-router'
import { auth, logout } from '../stores/auth'

const router = useRouter()

const links = [
  { to: '/admin', label: 'Reportes y KPIs' },
  { to: '/admin/passengers', label: 'Pasajeros' },
  { to: '/admin/drivers', label: 'Operadores' },
  { to: '/admin/routes', label: 'Rutas' },
  { to: '/admin/trips', label: 'Viajes' },
  { to: '/admin/incidents', label: 'Incidencias' },
  { to: '/admin/units', label: 'Unidades' },
]

function salir() {
  logout()
  router.push('/login')
}
</script>

<template>
  <div class="flex min-h-screen flex-col md:flex-row">
    <!-- Menú lateral: ocupa toda la altura de la pantalla (en celular pasa a ser una barra superior) -->
    <aside class="flex flex-col bg-emerald-900 text-emerald-50 shadow-xl md:sticky md:top-0 md:h-screen md:w-64 md:shrink-0">
      <div class="flex items-center justify-between px-5 py-4 md:block md:py-6">
        <div>
          <p class="text-xs font-semibold uppercase tracking-widest text-emerald-300">Panel del</p>
          <h1 class="text-xl font-bold text-white">Administrador</h1>
        </div>
        <button
          class="rounded-lg bg-white/10 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-white/20 md:hidden"
          @click="salir"
        >
          Cerrar sesión
        </button>
      </div>

      <nav class="flex gap-1 overflow-x-auto px-3 pb-3 md:flex-1 md:flex-col md:gap-0.5 md:overflow-y-auto md:pb-0">
        <RouterLink
          v-for="l in links"
          :key="l.to"
          :to="l.to"
          class="whitespace-nowrap rounded-lg border-l-4 border-transparent px-4 py-2.5 text-sm font-medium text-emerald-100 transition-all duration-150 hover:bg-white/10 hover:pl-5 hover:text-white active:scale-[0.98]"
          exact-active-class="border-emerald-300! bg-white/15! pl-5! font-semibold! text-white!"
        >
          {{ l.label }}
        </RouterLink>
      </nav>

      <div class="hidden border-t border-white/10 p-4 md:block">
        <p class="truncate text-sm font-semibold text-white">{{ auth.user?.name }}</p>
        <p class="truncate text-xs text-emerald-300">{{ auth.user?.email }}</p>
        <button
          class="mt-3 w-full rounded-lg bg-white/10 px-3 py-2 text-sm font-medium text-white transition hover:bg-white/20"
          @click="salir"
        >
          Cerrar sesión
        </button>
      </div>
    </aside>

    <main class="min-w-0 flex-1 p-4 md:p-8">
      <div class="mx-auto max-w-6xl">
        <RouterView />
      </div>
    </main>
  </div>
</template>
