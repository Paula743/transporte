<script setup>
import { ref, computed, onMounted } from 'vue'
import * as api from '../services/api.js'
import ModalForm from '../components/ModalForm.vue'
import { fmtDateTime, money, toLocalInput } from '../utils/format.js'
import { hasStarted, tripPhase, phaseLabel, phaseClass, useNow } from '../utils/trip.js'

const now = useNow()

const trips = ref([])
const routes = ref([])
const units = ref([])
const drivers = ref([])
const phaseFilter = ref('TODOS')
const loading = ref(true)
const error = ref('')
const msg = ref('')

const modal = ref(null) // null = cerrado; {} = nuevo viaje; { id, ticketsSold } = editar
const form = ref({ routeId: '', unitId: '', driverId: '', departure: '', arrival: '', platform: '' })
const formError = ref('')
const saving = ref(false)

async function load() {
  try {
    const [t, r, u, d] = await Promise.all([api.listTrips(), api.listRoutes(), api.listUnits(), api.listDrivers()])
    trips.value = t
    routes.value = r
    units.value = u
    drivers.value = d
  } catch (e) {
    error.value = e.message
  } finally {
    loading.value = false
  }
}
onMounted(load)

// Solo se ofrecen unidades disponibles para viajar y operadores activos
const usableUnits = computed(() => units.value.filter((u) => !['EN_MANTENIMIENTO', 'FUERA_DE_SERVICIO'].includes(u.status)))
const activeDrivers = computed(() => drivers.value.filter((d) => d.active))

const phaseOptions = [
  ['TODOS', 'Todos'],
  ['PROXIMO', 'Próximos'],
  ['EN_CURSO', 'En curso'],
  ['FINALIZADO', 'Finalizados'],
  ['CANCELADO', 'Cancelados'],
]

// Más reciente primero; el filtro usa la misma fase que se muestra en la etiqueta
const filtered = computed(() => {
  const list = trips.value.filter((t) => phaseFilter.value === 'TODOS' || tripPhase(t, now.value) === phaseFilter.value)
  return [...list].sort((a, b) => new Date(b.departure) - new Date(a.departure))
})

// Solo se editan o cancelan viajes que aún no inician
const canManage = (t) => t.status === 'PROXIMO' && !hasStarted(t, now.value)

function openNew() {
  form.value = { routeId: '', unitId: '', driverId: '', departure: '', arrival: '', platform: '' }
  formError.value = ''
  modal.value = {}
}

function openEdit(t) {
  form.value = {
    routeId: t.routeId,
    unitId: t.unitId,
    driverId: t.driverId,
    departure: toLocalInput(t.departure),
    arrival: toLocalInput(t.arrival),
    platform: t.platform ?? '',
  }
  formError.value = ''
  modal.value = { id: t.id, ticketsSold: t.ticketsSold }
}

async function save() {
  formError.value = ''
  saving.value = true
  const f = form.value
  const body = {
    routeId: f.routeId,
    unitId: f.unitId,
    driverId: f.driverId,
    departure: new Date(f.departure).toISOString(),
    arrival: new Date(f.arrival).toISOString(),
    ...(f.platform ? { platform: Number(f.platform) } : {}),
  }
  try {
    if (modal.value.id) {
      await api.updateTrip(modal.value.id, body)
      msg.value = 'Viaje actualizado.'
    } else {
      await api.createTrip(body)
      msg.value = 'Viaje registrado.'
    }
    error.value = ''
    modal.value = null
    await load()
  } catch (e) {
    formError.value = e.message
  } finally {
    saving.value = false
  }
}

// Cancelar viaje: cambia su estatus a CANCELADO y cancela los boletos vendidos
async function cancelTrip(t) {
  const sold = t.ticketsSold
    ? `Se cancelarán ${t.ticketsSold} boleto(s), se devolverán sus puntos y se liberarán los asientos.`
    : 'No tiene boletos vendidos.'
  if (!confirm(`¿Cancelar el viaje ${t.route?.origin} → ${t.route?.destination} del ${fmtDateTime(t.departure)}?\n\n${sold}`)) return
  error.value = ''
  msg.value = ''
  try {
    await api.cancelTrip(t.id)
    msg.value = 'Viaje cancelado.'
    await load()
  } catch (e) {
    error.value = e.message
  }
}
</script>

<template>
  <div class="space-y-4">
    <div class="flex flex-wrap items-center justify-between gap-3">
      <h2 class="text-xl font-semibold">Viajes</h2>
      <div class="flex flex-wrap gap-2">
        <select v-model="phaseFilter" class="input w-44">
          <option v-for="[value, label] in phaseOptions" :key="value" :value="value">{{ label }}</option>
        </select>
        <button class="btn-primary" @click="openNew">Nuevo viaje</button>
      </div>
    </div>

    <p v-if="error" class="rounded-lg bg-red-50 p-3 text-sm text-red-700">{{ error }}</p>
    <p v-if="msg" class="rounded-lg bg-emerald-50 p-3 text-sm text-emerald-700">{{ msg }}</p>

    <div class="card overflow-x-auto">
      <p v-if="loading" class="text-sm text-gray-500">Cargando...</p>
      <p v-else-if="!filtered.length" class="text-sm text-gray-500">No hay viajes para mostrar.</p>
      <table v-else class="w-full text-left text-sm">
        <thead class="border-b text-xs uppercase text-gray-500">
          <tr>
            <th class="py-2 pr-3">Ruta</th>
            <th class="py-2 pr-3">Salida</th>
            <th class="py-2 pr-3">Llegada</th>
            <th class="py-2 pr-3">Unidad</th>
            <th class="py-2 pr-3">Operador</th>
            <th class="py-2 pr-3">Boletos</th>
            <th class="py-2 pr-3">Estatus</th>
            <th class="py-2"></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="t in filtered" :key="t.id" class="border-b last:border-0" :class="t.status === 'CANCELADO' ? 'text-gray-400' : ''">
            <td class="whitespace-nowrap py-2 pr-3 font-medium">
              {{ t.route ? `${t.route.origin} → ${t.route.destination}` : 'Ruta eliminada' }}
              <span v-if="t.route" class="block text-xs font-normal text-gray-500">{{ money(t.route.price) }}</span>
            </td>
            <td class="whitespace-nowrap py-2 pr-3">{{ fmtDateTime(t.departure) }}</td>
            <td class="whitespace-nowrap py-2 pr-3">{{ fmtDateTime(t.arrival) }}</td>
            <td class="py-2 pr-3">{{ t.unit?.plate ?? '—' }}</td>
            <td class="py-2 pr-3">
              {{ t.driver?.name ?? '—' }}
              <span v-if="t.driver && !t.driver.active" class="ml-1 text-xs text-red-600">(de baja)</span>
            </td>
            <td class="py-2 pr-3">{{ t.ticketsSold }}</td>
            <td class="py-2 pr-3">
              <span class="rounded-full px-2 py-0.5 text-xs font-medium" :class="phaseClass[tripPhase(t, now)]">
                {{ phaseLabel[tripPhase(t, now)] }}
              </span>
            </td>
            <td class="whitespace-nowrap py-2 text-right">
              <button class="btn-secondary btn-sm mr-1" :disabled="!canManage(t)" :title="canManage(t) ? '' : 'Solo se editan viajes que aún no inician'" @click="openEdit(t)">
                Editar
              </button>
              <button class="btn-danger btn-sm" :disabled="!canManage(t)" :title="canManage(t) ? '' : 'Solo se cancelan viajes que aún no inician'" @click="cancelTrip(t)">
                Cancelar viaje
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <ModalForm v-if="modal" :title="modal.id ? 'Editar viaje' : 'Nuevo viaje'" wide @close="modal = null">
      <form class="space-y-3" @submit.prevent="save">
        <p v-if="modal.ticketsSold" class="rounded-lg bg-amber-50 p-3 text-sm text-amber-700">
          Este viaje ya tiene {{ modal.ticketsSold }} boleto(s) vendido(s): no se puede cambiar la ruta ni la unidad.
        </p>
        <div class="grid gap-3 sm:grid-cols-2">
          <div class="sm:col-span-2">
            <label class="label">Ruta</label>
            <select v-model="form.routeId" required class="input" :disabled="!!modal.ticketsSold">
              <option value="" disabled>Selecciona</option>
              <option v-for="r in routes" :key="r.id" :value="r.id">{{ r.origin }} → {{ r.destination }} · {{ money(r.price) }}</option>
            </select>
          </div>
          <div>
            <label class="label">Unidad</label>
            <select v-model="form.unitId" required class="input" :disabled="!!modal.ticketsSold">
              <option value="" disabled>Selecciona</option>
              <option v-for="u in usableUnits" :key="u.id" :value="u.id">{{ u.plate }} · {{ u.totalSeats }} asientos</option>
            </select>
          </div>
          <div>
            <label class="label">Operador</label>
            <select v-model="form.driverId" required class="input">
              <option value="" disabled>Selecciona</option>
              <option v-for="d in activeDrivers" :key="d.id" :value="d.id">{{ d.name }}</option>
            </select>
          </div>
          <div>
            <label class="label">Salida</label>
            <input v-model="form.departure" type="datetime-local" required class="input" />
          </div>
          <div>
            <label class="label">Llegada</label>
            <input v-model="form.arrival" type="datetime-local" required class="input" />
          </div>
          <div>
            <label class="label">Andén (opcional)</label>
            <input v-model="form.platform" type="number" min="1" max="20" class="input" placeholder="Se asigna uno si lo dejas vacío" />
          </div>
        </div>
        <p v-if="formError" class="text-sm text-red-600">{{ formError }}</p>
        <div class="flex justify-end gap-2">
          <button type="button" class="btn-secondary" @click="modal = null">Cancelar</button>
          <button class="btn-primary" :disabled="saving">{{ saving ? 'Guardando...' : 'Guardar' }}</button>
        </div>
      </form>
    </ModalForm>
  </div>
</template>
