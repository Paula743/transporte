<script setup>
import { ref, computed, onMounted } from 'vue'
import * as api from '../services/api.js'
import { fmtDate } from '../utils/format.js'

const passengers = ref([])
const search = ref('')
const loading = ref(true)
const error = ref('')

onMounted(async () => {
  try {
    passengers.value = await api.listPassengers()
  } catch (e) {
    error.value = e.message
  } finally {
    loading.value = false
  }
})

const filtered = computed(() => {
  const q = search.value.trim().toLowerCase()
  return q ? passengers.value.filter((p) => `${p.name} ${p.email}`.toLowerCase().includes(q)) : passengers.value
})
</script>

<template>
  <div class="space-y-4">
    <div class="flex flex-wrap items-center justify-between gap-3">
      <div>
        <h2 class="text-xl font-semibold">Pasajeros</h2>
      </div>
      <input v-model="search" class="input w-56" placeholder="Buscar nombre o correo..." />
    </div>

    <p v-if="error" class="rounded-lg bg-red-50 p-3 text-sm text-red-700">{{ error }}</p>

    <div class="card overflow-x-auto">
      <p v-if="loading" class="text-sm text-gray-500">Cargando...</p>
      <p v-else-if="!filtered.length" class="text-sm text-gray-500">No hay pasajeros registrados.</p>
      <table v-else class="w-full text-left text-sm">
        <thead class="border-b text-xs uppercase text-gray-500">
          <tr>
            <th class="py-2 pr-3">Nombre</th>
            <th class="py-2 pr-3">Correo</th>
            <th class="py-2 pr-3">Boletos comprados</th>
            <th class="py-2 pr-3">Puntos</th>
            <th class="py-2">Alta</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="p in filtered" :key="p.id" class="border-b last:border-0">
            <td class="py-2 pr-3 font-medium">{{ p.name }}</td>
            <td class="py-2 pr-3">{{ p.email }}</td>
            <td class="py-2 pr-3">{{ p.ticketsCount }}</td>
            <td class="py-2 pr-3">{{ p.points }}</td>
            <td class="whitespace-nowrap py-2">{{ p.createdAt ? fmtDate(p.createdAt) : '—' }}</td>
          </tr>
        </tbody>
      </table>
    </div>
    <p v-if="!loading && filtered.length" class="text-xs text-gray-500">{{ filtered.length }} pasajero(s)</p>
  </div>
</template>
