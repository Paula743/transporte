<script setup>
import { ref, onMounted, computed } from 'vue'
import AppHeader from '../components/AppHeader.vue'
import IncidentModal from '../components/IncidentModal.vue'
import { auth } from '../stores/auth'
import * as api from '../services/api'
import { downloadTicket } from '../utils/ticket'
import { fmtDateTime, money } from '../utils/format'
import PointsBadge from '../components/PointsBadge.vue'
import { refreshPoints } from '../stores/points'

const tickets = ref([])
const incidentTrip = ref(null)
const msg = ref('')
const error = ref('')

const load = async () => (tickets.value = await api.myTickets(auth.user.id))
onMounted(load)

const tripFinished = (tk) => tk.trip.status === 'FINALIZADO'
const isActive = (tk) => tk.status === 'VALIDO'

const badge = computed(() => ({
  VALIDO: 'bg-emerald-100 text-emerald-700',
  CANCELADO: 'bg-red-100 text-red-700',
  VENCIDO: 'bg-gray-200 text-gray-600',
}))

async function cancel(tk) {
  if (!confirm('¿Seguro que quieres cancelar este boleto?')) return
  error.value = ''
  try {
    await api.cancelTicket(tk.id)
    refreshPoints()
    msg.value = 'Boleto cancelado.'
    await load()
  } catch (e) {
    error.value = e.message
  }
}
</script>

<template>
  <AppHeader title="Mis viajes">
    <PointsBadge />
    <RouterLink to="/passenger" class="btn-secondary">Buscar viajes</RouterLink>
  </AppHeader>

  <main class="mx-auto max-w-4xl space-y-3 p-4">
    <p v-if="error" class="rounded-lg bg-red-50 p-3 text-sm text-red-700">{{ error }}</p>
    <p v-if="msg" class="rounded-lg bg-emerald-50 p-3 text-sm text-emerald-700">{{ msg }}</p>
    <p v-if="!tickets.length" class="card text-center text-gray-500">Aún no tienes viajes.</p>

    <article v-for="tk in tickets" :key="tk.id" class="card flex flex-wrap items-center justify-between gap-3">
      <div>
        <p class="font-semibold">{{ tk.trip.route.origin }} → {{ tk.trip.route.destination }}</p>
        <p class="text-sm text-gray-500">Salida: {{ fmtDateTime(tk.trip.departure) }}</p>
        <p class="text-sm text-gray-500">Asiento {{ tk.seat }} · Andén {{ tk.platform }} · {{ money(tk.trip.route.price) }}</p>
        <span class="mt-1 inline-block rounded-full px-2 py-0.5 text-xs font-medium" :class="badge[tk.status]">{{ tk.status }}</span>
      </div>

      <div class="flex flex-wrap gap-2">
        <template v-if="isActive(tk)">
          <button class="btn-danger" @click="cancel(tk)">Cancelar viaje</button>
          <button class="btn-secondary" @click="downloadTicket(tk)">Descargar boleto</button>
        </template>
        <button
          class="btn-secondary"
          :disabled="tripFinished(tk) || tk.status === 'CANCELADO'"
          :title="tripFinished(tk) ? 'El viaje ya finalizó' : ''"
          @click="incidentTrip = tk.trip.id"
        >
          Reportar incidencia
        </button>
      </div>
    </article>
  </main>

  <IncidentModal v-if="incidentTrip" :trip-id="incidentTrip" @close="incidentTrip = null" @sent="msg = 'Incidencia enviada. Gracias por reportarla.'" />
</template>

