<script setup>
import { ref, onMounted } from 'vue'
import AppHeader from '../components/AppHeader.vue'
import { auth } from '../stores/auth.js'
import * as api from '../services/api.js'
import { ymd, fmtTime, money } from '../utils/format.js'
import PointsBadge from '../components/PointsBadge.vue'
import { points, refreshPoints } from '../stores/points.js'

const cities = ref([])
const form = ref({ origin: '', destination: '', date: ymd(new Date()) })
const today = ymd(new Date())
const results = ref(null)
const qty = ref({})
const msg = ref('')
const error = ref('')

onMounted(async () => (cities.value = await api.getCities()))

async function runSearch() {
  results.value = await api.searchTrips(form.value)
  qty.value = Object.fromEntries(results.value.map((t) => [t.id, 1]))
}

async function search() {
  msg.value = ''
  error.value = ''
  const { origin, destination, date } = form.value
  if (!origin || !destination || !date) return (error.value = 'Completa origen, destino y fecha')
  if (origin === destination) return (error.value = 'El origen y el destino deben ser distintos')
  await runSearch()
}

async function buy(t) {
  msg.value = ''
  error.value = ''
  try {
    const n = qty.value[t.id]
    await api.buyTickets(auth.user.id, t.id, n)
    refreshPoints()
    msg.value = `Compra exitosa: ${n} boleto(s) de ${t.route.origin} a ${t.route.destination}.`
    await runSearch()
  } catch (e) {
    error.value = e.message
  }
}
</script>

<template>
  <AppHeader title="Mi viaje">
    <PointsBadge />
    <RouterLink to="/passenger/trips" class="btn-secondary">Mis viajes</RouterLink>
  </AppHeader>

  <main class="mx-auto max-w-6xl space-y-4 p-4">
    <p class="text-sm text-gray-600">
      Ganas <b>1 punto por cada $10</b> que pagas en tus boletos. Tus puntos actuales:
      <b class="text-amber-700">{{ points.value ?? '—' }}</b>
    </p>
    <section class="card grid gap-3 sm:grid-cols-4">
      <div>
        <label class="label">Ciudad de origen</label>
        <select v-model="form.origin" class="input">
          <option value="" disabled>Selecciona</option>
          <option v-for="c in cities" :key="c">{{ c }}</option>
        </select>
      </div>
      <div>
        <label class="label">Ciudad de destino</label>
        <select v-model="form.destination" class="input">
          <option value="" disabled>Selecciona</option>
          <option v-for="c in cities" :key="c">{{ c }}</option>
        </select>
      </div>
      <div>
        <label class="label">Fecha del viaje</label>
        <input v-model="form.date" type="date" :min="today" class="input" />
      </div>
      <div class="flex items-end">
        <button class="btn-primary w-full" @click="search">Buscar viajes</button>
      </div>
    </section>

    <p v-if="error" class="rounded-lg bg-red-50 p-3 text-sm text-red-700">{{ error }}</p>
    <p v-if="msg" class="rounded-lg bg-emerald-50 p-3 text-sm text-emerald-700">{{ msg }}</p>

    <section v-if="results" class="space-y-3">
      <p v-if="!results.length" class="card text-center text-gray-500">No hay viajes disponibles para esa búsqueda.</p>

      <article v-for="t in results" :key="t.id" class="card flex flex-wrap items-center justify-between gap-4">
        <div>
          <!-- <p class="text-lg font-semibold">{{ fmtTime(t.departure) }} → {{ fmtTime(t.arrival) }}</p> -->
          <p class="text-lg font-semibold">{{ fmtTime(t.departure) }}</p>
          <p class="text-sm text-gray-500">{{ t.route.origin }} → {{ t.route.destination }} · {{ t.route.km }} km</p>
          <p class="text-sm text-gray-500">{{ t.unit.availableSeats }} asientos disponibles</p>
        </div>
        <div class="text-right">
          <p class="text-xl font-bold text-emerald-700">{{ money(t.route.price) }}</p>
          <p class="text-xs text-gray-500">por persona</p>
        </div>
        <div class="flex items-end gap-3">
          <div>
            <label class="label">Boletos</label>
            <input v-model.number="qty[t.id]" type="number" min="1" :max="t.unit.availableSeats" class="input w-20" />
          </div>
          <div class="text-sm">
            <p class="text-gray-500">Total</p>
            <p class="font-semibold">{{ money((qty[t.id] || 1) * t.route.price) }}</p>
          </div>
          <button class="btn-primary" @click="buy(t)">Comprar</button>
        </div>
      </article>
    </section>
  </main>
</template>

