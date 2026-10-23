<script setup>
import { ref, computed, onMounted } from 'vue'
import * as api from '../services/api.js'
import ModalForm from '../components/ModalForm.vue'
import { money } from '../utils/format.js'

const routes = ref([])
const search = ref('')
const loading = ref(true)
const error = ref('')
const msg = ref('')

const modal = ref(null) // null = cerrado; {} = nueva ruta; { id } = editar
const form = ref({ origin: '', destination: '', km: '', price: '' })
const formError = ref('')
const saving = ref(false)

async function load() {
  try {
    routes.value = await api.listRoutes()
  } catch (e) {
    error.value = e.message
  } finally {
    loading.value = false
  }
}
onMounted(load)

const filtered = computed(() => {
  const q = search.value.trim().toLowerCase()
  return q ? routes.value.filter((r) => `${r.origin} ${r.destination}`.toLowerCase().includes(q)) : routes.value
})

function openNew() {
  form.value = { origin: '', destination: '', km: '', price: '' }
  formError.value = ''
  modal.value = {}
}

function openEdit(r) {
  form.value = { origin: r.origin, destination: r.destination, km: r.km, price: r.price }
  formError.value = ''
  modal.value = { id: r.id }
}

async function save() {
  formError.value = ''
  saving.value = true
  const body = {
    origin: form.value.origin,
    destination: form.value.destination,
    km: Number(form.value.km),
    price: Number(form.value.price),
  }
  try {
    if (modal.value.id) {
      await api.updateRoute(modal.value.id, body)
      msg.value = 'Ruta actualizada.'
    } else {
      await api.createRoute(body)
      msg.value = 'Ruta registrada.'
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

async function remove(r) {
  if (!confirm(`¿Eliminar la ruta ${r.origin} → ${r.destination}?`)) return
  error.value = ''
  msg.value = ''
  try {
    await api.deleteRoute(r.id)
    msg.value = 'Ruta eliminada.'
    await load()
  } catch (e) {
    error.value = e.message
  }
}
</script>

<template>
  <div class="space-y-4">
    <div class="flex flex-wrap items-center justify-between gap-3">
      <h2 class="text-xl font-semibold">Rutas</h2>
      <div class="flex flex-wrap gap-2">
        <input v-model="search" class="input w-56" placeholder="Buscar ciudad..." />
        <button class="btn-primary" @click="openNew">Nueva ruta</button>
      </div>
    </div>

    <p v-if="error" class="rounded-lg bg-red-50 p-3 text-sm text-red-700">{{ error }}</p>
    <p v-if="msg" class="rounded-lg bg-emerald-50 p-3 text-sm text-emerald-700">{{ msg }}</p>

    <div class="card overflow-x-auto">
      <p v-if="loading" class="text-sm text-gray-500">Cargando...</p>
      <p v-else-if="!filtered.length" class="text-sm text-gray-500">No hay rutas registradas.</p>
      <table v-else class="w-full text-left text-sm">
        <thead class="border-b text-xs uppercase text-gray-500">
          <tr>
            <th class="py-2 pr-3">Origen</th>
            <th class="py-2 pr-3">Destino</th>
            <th class="py-2 pr-3">Kilómetros</th>
            <th class="py-2 pr-3">Precio</th>
            <th class="py-2"></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="r in filtered" :key="r.id" class="border-b last:border-0">
            <td class="py-2 pr-3 font-medium">{{ r.origin }}</td>
            <td class="py-2 pr-3 font-medium">{{ r.destination }}</td>
            <td class="py-2 pr-3">{{ r.km }} km</td>
            <td class="py-2 pr-3">{{ money(r.price) }}</td>
            <td class="whitespace-nowrap py-2 text-right">
              <button class="btn-secondary btn-sm mr-1" @click="openEdit(r)">Editar</button>
              <button class="btn-danger btn-sm" @click="remove(r)">Eliminar</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <ModalForm v-if="modal" :title="modal.id ? 'Editar ruta' : 'Nueva ruta'" @close="modal = null">
      <form class="space-y-3" @submit.prevent="save">
        <div class="grid gap-3 sm:grid-cols-2">
          <div>
            <label class="label">Ciudad de origen</label>
            <input v-model="form.origin" required minlength="2" class="input" />
          </div>
          <div>
            <label class="label">Ciudad de destino</label>
            <input v-model="form.destination" required minlength="2" class="input" />
          </div>
          <div>
            <label class="label">Kilómetros</label>
            <input v-model="form.km" type="number" min="1" step="any" required class="input" />
          </div>
          <div>
            <label class="label">Precio por persona (MXN)</label>
            <input v-model="form.price" type="number" min="1" step="any" required class="input" />
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
