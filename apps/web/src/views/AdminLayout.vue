<script setup>
import AppHeader from '../components/AppHeader.vue'

const links = [
  { to: '/admin', label: 'Reportes y KPIs', icon: '📊' },
  { to: '/admin/drivers', label: 'Operadores', icon: '🪪' },
  { to: '/admin/routes', label: 'Rutas', icon: '🛣️' },
  { to: '/admin/trips', label: 'Viajes', icon: '🗓️' },
  { to: '/admin/units', label: 'Unidades', icon: '🚌' },
]
</script>

<template>
  <div class="min-h-screen">
    <AppHeader title="Panel del administrador" />

    <div class="mx-auto flex max-w-6xl flex-col gap-4 p-4 md:flex-row md:items-start">
      <!-- Menú lateral (en pantallas pequeñas se convierte en una barra horizontal) -->
      <aside class="md:sticky md:top-4 md:w-56 md:shrink-0">
        <nav class="card flex gap-1 overflow-x-auto p-2 md:flex-col md:overflow-visible">
          <RouterLink
            v-for="l in links"
            :key="l.to"
            :to="l.to"
            class="flex items-center gap-2 whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium text-gray-600 transition hover:bg-gray-100"
            exact-active-class="bg-emerald-50! text-emerald-700!"
          >
            <span>{{ l.icon }}</span>
            <span>{{ l.label }}</span>
          </RouterLink>
        </nav>
      </aside>

      <main class="min-w-0 flex-1">
        <RouterView />
      </main>
    </div>
  </div>
</template>
