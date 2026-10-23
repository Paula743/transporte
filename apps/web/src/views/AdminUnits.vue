<script setup>
import { ref, computed, onMounted } from 'vue'
import * as api from '../services/api.js'
import ModalForm from '../components/ModalForm.vue'

const units = ref([])
const search = ref('')
const loading = ref(true)
const error = ref('')
const msg = ref('')

const modal = ref(null) // null = cerrado; {} = nueva unidad; { id } = editar
const form = ref({ plate: '', totalSeats: '', accumulatedKm: '' })
const formError = ref('')
const saving = ref(false)

const statusInfo = {
  DISPONIBLE: ['Disponible', 'bg-emerald-100 text-emerald-700'],
  CON_RUTA: ['Con ruta asignada', 'bg-blue-100 text-blue-700'],
  EN_MANTENIMIENTO: ['En mantenimiento', 'bg-amber-100 text-amber-700'],
  FUERA_DE_SERVICIO: ['Fuera de servicio', 'bg-gray-200 text-gray-600'],
}

async function load() {
  try {
    units.value = await api.listUnits()
  } catch (e) {
    error.value = e.message
  } finally {
    loading.value = false
  }
}
onMounted(load)

const filtered = computed(() => {
  const q = search.value.trim().toLowerCase()
  return q ? units.value.filter((u) => u.plate.toLowerCase().includes(q)) : units.value
})

function openNew() {
  form.value = { plate: '', totalSeats: '', accumulatedKm: 0 }
  formError.value = ''
  modal.value = {}
}

function openEdit(u) {
  form.value = { plate: u.plate, totalSeats: u.totalSeats, accumulatedKm: u.accumulatedKm }
  formError.value = ''
  modal.value = { id: u.id }
}

async function save() {
  formError.value = ''
  saving.value = true
  const body = {
    plate: form.value.plate,
    totalSeats: Number(form.value.totalSeats),
    accumulatedKm: Number(form.value.accumulatedKm || 0),
  }
  try {
    if (modal.value.id) {
      await api.updateUnit(modal.value.id, body)
      msg.value = 'Unidad actualizada.'
    } else {
      await api.createUnit(body)
      msg.value = 'Unidad registrada.'
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

// Enviar a mantenimiento / regresar a servicio (cambia el estatus de la unidad)
async function toggleMaintenance(u) {
  const toMaintenance = u.status !== 'EN_MANTENIMIENTO'
  const text = toMaintenance
    ? `¿Enviar la unidad ${u.plate} a mantenimiento? No podrá asignarse a viajes hasta que regrese a servicio.`
    : `¿Regresar la unidad ${u.plate} a servicio?`
  if (!confirm(text)) return
  error.value = ''
  msg.value = ''
  try {
    await api.setUnitStatus(u.id, toMaintenance ? 'EN_MANTENIMIENTO' : 'DISPONIBLE')
    msg.value = toMaintenance ? `La unidad ${u.plate} está en mantenimiento.` : `La unidad ${u.plate} regresó a servicio.`
    await load()
  } catch (e) {
    error.value = e.message
  }
}

async function remove(u) {
  if (!confirm(`¿Eliminar la unidad ${u.plate}?`)) return
  error.value = ''
  msg.value = ''
  try {
    await api.deleteUnit(u.id)
    msg.value = 'Unidad eliminada.'
    await load()
  } catch (e) {
    error.value = e.message
  }
}
</script>

<template>
  <div class="space-y-4">
    <div class="flex flex-wrap items-center justify-between gap-3">
      <h2 class="text-xl font-semibold">Unidades</h2>
      <div class="flex flex-wrap gap-2">
        <input v-model="search" class="input w-56" placeholder="Buscar por placa..." />
        <button class="btn-primary" @click="openNew">Nueva unidad</button>
      </div>
    </div>

    <p v-if="error" class="rounded-lg bg-red-50 p-3 text-sm text-red-700">{{ error }}</p>
    <p v-if="msg" class="rounded-lg bg-emerald-50 p-3 text-sm text-emerald-700">{{ msg }}</p>

    <div class="card overflow-x-auto">
      <p v-if="loading" class="text-sm text-gray-500">Cargando...</p>
      <p v-else-if="!filtered.length" class="text-sm text-gray-500">No hay unidades registradas.</p>
      <table v-else class="w-full text-left text-sm">
        <thead class="border-b text-xs uppercase text-gray-500">
          <tr>
            <th class="py-2 pr-3">Placa</th>
            <th class="py-2 pr-3">Asientos</th>
            <th class="py-2 pr-3">Km acumulados</th>
            <th class="py-2 pr-3">Estatus</th>
            <th class="py-2"></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="u in filtered" :key="u.id" class="border-b last:border-0" :class="u.status === 'EN_MANTENIMIENTO' ? 'bg-amber-50' : ''">
            <td class="py-2 pr-3 font-medium">{{ u.plate }}</td>
            <td class="py-2 pr-3">{{ u.totalSeats }}</td>
            <td class="py-2 pr-3">{{ Number(u.accumulatedKm).toLocaleString('es-MX') }} km</td>
            <td class="py-2 pr-3">
              <span class="rounded-full px-2 py-0.5 text-xs font-medium" :class="(statusInfo[u.status] || [])[1]">
                {{ (statusInfo[u.status] || [u.status])[0] }}
              </span>
            </td>
            <td class="whitespace-nowrap py-2 text-right">
              <button class="btn-secondary btn-sm mr-1" @click="openEdit(u)">Editar</button>
              <button
                class="btn-sm mr-1"
                :class="u.status === 'EN_MANTENIMIENTO' ? 'btn-primary' : 'btn-warning'"
                @click="toggleMaintenance(u)"
              >
                {{ u.status === 'EN_MANTENIMIENTO' ? 'Regresar a servicio' : 'Enviar a mantenimiento' }}
              </button>
              <button class="btn-danger btn-sm" @click="remove(u)">Eliminar</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <ModalForm v-if="modal" :title="modal.id ? 'Editar unidad' : 'Nueva unidad'" @close="modal = null">
      <form class="space-y-3" @submit.prevent="save">
        <div>
          <label class="label">Placa</label>
          <input v-model="form.plate" required minlength="3" class="input uppercase" placeholder="GTO-101" />
        </div>
        <div class="grid gap-3 sm:grid-cols-2">
          <div>
            <label class="label">Asientos totales</label>
            <input v-model="form.totalSeats" type="number" min="1" max="60" required class="input" />
          </div>
          <div>
            <label class="label">Km acumulados</label>
            <input v-model="form.accumulatedKm" type="number" min="0" step="any" class="input" />
          </div>
        </div>
        <p v-if="modal.id" class="text-xs text-gray-500">
          Cada viaje copia los asientos de la unidad al registrarse: este cambio solo aplica a los viajes nuevos. El estatus se cambia con el botón de mantenimiento.
        </p>
        <p v-if="formError" class="text-sm text-red-600">{{ formError }}</p>
        <div class="flex justify-end gap-2">
          <button type="button" class="btn-secondary" @click="modal = null">Cancelar</button>
          <button class="btn-primary" :disabled="saving">{{ saving ? 'Guardando...' : 'Guardar' }}</button>
        </div>
      </form>
    </ModalForm>
  </div>
</template>
