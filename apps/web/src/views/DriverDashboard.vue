<script setup>
import { ref, onMounted } from 'vue'
import AppHeader from '../components/AppHeader.vue'
import IncidentModal from '../components/IncidentModal.vue'
import { auth } from '../stores/auth'
import * as api from '../services/api'
import { fmtDateTime } from '../utils/format'

const trips = ref([])
const incidentTrip = ref(null)
const msg = ref('')
const error = ref('')

const load = async () => {
  const list = await api.driverTrips(auth.user.id)
  // Más reciente primero (por fecha y hora de salida)
  trips.value = list.sort((a, b) => new Date(b.departure) - new Date(a.departure))
}
onMounted(load)

const finished = (t) => t.status === 'FINALIZADO'

async function finish(t) {
  if (!confirm('¿Confirmas que la unidad llegó a su destino?')) return
  error.value = ''
  try {
    await api.finishTrip(t.id)
    msg.value = 'Viaje finalizado.'
    await load()
  } catch (e) {
    error.value = e.message
  }
}
</script>

<template>
  <AppHeader title="Panel del operador" />

  <main class="mx-auto max-w-4xl space-y-3 p-4">
    <h2 class="text-xl font-semibold">Mis viajes asignados</h2>
    <p v-if="error" class="rounded-lg bg-red-50 p-3 text-sm text-red-700">{{ error }}</p>
    <p v-if="msg" class="rounded-lg bg-emerald-50 p-3 text-sm text-emerald-700">{{ msg }}</p>
    <p v-if="!trips.length" class="card text-center text-gray-500">No tienes viajes asignados.</p>

    <article v-for="t in trips" :key="t.id" class="card flex flex-wrap items-center justify-between gap-3">
      <div>
        <p class="font-semibold">{{ t.route.origin }} → {{ t.route.destination }}</p>
        <p class="text-sm text-gray-500">Salida: {{ fmtDateTime(t.departure) }}</p>
        <p class="text-sm text-gray-500">Llegada: {{ fmtDateTime(t.arrival) }}</p>
        <p class="text-sm text-gray-500">Unidad {{ t.unit.plate }}</p>
        <span
          class="mt-1 inline-block rounded-full px-2 py-0.5 text-xs font-medium"
          :class="finished(t) ? 'bg-gray-200 text-gray-600' : 'bg-emerald-100 text-emerald-700'"
        >
          {{ t.status }}
        </span>
      </div>
      <div class="flex flex-wrap gap-2">
        <button class="btn-primary" :disabled="finished(t)" @click="finish(t)">Finalizar viaje</button>
        <button class="btn-secondary" :disabled="finished(t)" @click="incidentTrip = t.id">Reportar incidencia</button>
      </div>
    </article>
  </main>

  <IncidentModal v-if="incidentTrip" :trip-id="incidentTrip" @close="incidentTrip = null" @sent="msg = 'Incidencia enviada.'" />
</template>

