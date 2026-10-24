<script setup>
import { ref, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import * as api from '../services/api.js'
import ModalForm from '../components/ModalForm.vue'
import { fmtDateTime } from '../utils/format.js'

const route = useRoute()
const router = useRouter()

const incidents = ref([])
const search = ref('')
const roleFilter = ref('TODOS')
const loading = ref(true)
const error = ref('')
const detail = ref(null)

// Si se llega desde un viaje (?tripId=...), solo se muestran las incidencias de ese viaje
const tripId = computed(() => (typeof route.query.tripId === 'string' ? route.query.tripId : ''))

const roleLabel = (r) => (r === 'DRIVER' ? 'Operador' : 'Pasajero')

async function load() {
  loading.value = true
  error.value = ''
  try {
    incidents.value = await api.listIncidents({ tripId: tripId.value })
  } catch (e) {
    error.value = e.message
  } finally {
    loading.value = false
  }
}
// Se carga al entrar y cada vez que cambia el filtro de viaje
watch(tripId, load, { immediate: true })

const filtered = computed(() => {
  const q = search.value.trim().toLowerCase()
  return incidents.value.filter((i) => {
    if (roleFilter.value !== 'TODOS' && i.emitterRole !== roleFilter.value) return false
    if (!q) return true
    return `${i.title} ${i.description} ${i.emitterName} ${i.route}`.toLowerCase().includes(q)
  })
})

// Etiqueta del viaje filtrado (todas las incidencias de un viaje comparten ruta y salida)
const tripLabel = computed(() => {
  const i = incidents.value[0]
  return i ? `${i.route}${i.departure ? ` · ${fmtDateTime(i.departure)}` : ''}` : ''
})

function clearTrip() {
  router.replace({ path: '/admin/incidents' })
}

async function openDetail(i) {
  try {
    detail.value = await api.getIncident(i.id)
  } catch (e) {
    error.value = e.message
  }
}
</script>

<template>
  <div class="space-y-4">
    <div class="flex flex-wrap items-center justify-between gap-3">
      <div>
        <h2 class="text-xl font-semibold">Incidencias</h2>
      </div>
      <div class="flex flex-wrap gap-2">
        <select v-model="roleFilter" class="input w-40">
          <option value="TODOS">Todos los emisores</option>
          <option value="PASSENGER">Pasajeros</option>
          <option value="DRIVER">Operadores</option>
        </select>
        <input v-model="search" class="input w-56" placeholder="Buscar..." />
      </div>
    </div>

    <!-- Filtro activo: viene del botón "Ver incidencias" de un viaje -->
    <div v-if="tripId" class="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-emerald-50 p-3 text-sm text-emerald-800">
      <span>
        Mostrando solo las incidencias del viaje
        <b v-if="tripLabel">{{ tripLabel }}</b>
      </span>
      <button class="btn-secondary btn-sm" @click="clearTrip">Ver todas las incidencias</button>
    </div>

    <p v-if="error" class="rounded-lg bg-red-50 p-3 text-sm text-red-700">{{ error }}</p>

    <div class="card overflow-x-auto">
      <p v-if="loading" class="text-sm text-gray-500">Cargando...</p>
      <p v-else-if="!filtered.length" class="text-sm text-gray-500">No hay incidencias para mostrar.</p>
      <table v-else class="w-full text-left text-sm">
        <thead class="border-b text-xs uppercase text-gray-500">
          <tr>
            <th class="py-2 pr-3">Reportada</th>
            <th class="py-2 pr-3">Viaje</th>
            <th class="py-2 pr-3">Reportó</th>
            <th class="py-2 pr-3">Título</th>
            <th class="py-2"></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="i in filtered" :key="i.id" class="border-b last:border-0">
            <td class="whitespace-nowrap py-2 pr-3">{{ fmtDateTime(i.createdAt) }}</td>
            <td class="whitespace-nowrap py-2 pr-3">
              {{ i.route }}
              <span v-if="i.departure" class="block text-xs text-gray-500">{{ fmtDateTime(i.departure) }}</span>
            </td>
            <td class="py-2 pr-3">
              {{ i.emitterName }}
              <span
                class="ml-1 rounded-full px-2 py-0.5 text-xs font-medium"
                :class="i.emitterRole === 'DRIVER' ? 'bg-blue-100 text-blue-700' : 'bg-emerald-100 text-emerald-700'"
              >{{ roleLabel(i.emitterRole) }}</span>
            </td>
            <td class="py-2 pr-3">{{ i.title }}<span v-if="i.hasPhoto" class="ml-1 text-xs text-gray-400" title="Incluye foto">(con foto)</span></td>
            <td class="whitespace-nowrap py-2 text-right">
              <button class="btn-secondary btn-sm" @click="openDetail(i)">Ver detalle</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    <p v-if="!loading && filtered.length" class="text-xs text-gray-500">{{ filtered.length }} incidencia(s)</p>

    <ModalForm v-if="detail" :title="detail.title" @close="detail = null">
      <div class="space-y-3">
        <p class="text-sm text-gray-500">
          {{ detail.emitterName }} · {{ roleLabel(detail.emitterRole) }} · {{ fmtDateTime(detail.createdAt) }}
        </p>
        <p class="whitespace-pre-line text-sm">{{ detail.description }}</p>
        <img v-if="detail.photo" :src="detail.photo" class="max-h-72 rounded" alt="Foto de la incidencia" />
        <div class="flex justify-end">
          <button class="btn-primary" @click="detail = null">Cerrar</button>
        </div>
      </div>
    </ModalForm>
  </div>
</template>
