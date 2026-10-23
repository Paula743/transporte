<script setup>
import { ref, computed, onMounted } from 'vue'
import * as api from '../services/api.js'
import ModalForm from '../components/ModalForm.vue'
import { genPassword } from '../utils/password.js'
import { fmtDate } from '../utils/format.js'

const drivers = ref([])
const search = ref('')
const loading = ref(true)
const error = ref('')
const msg = ref('')

const modal = ref(null) // null = cerrado; {} = nuevo operador; { id } = editar
const form = ref({ name: '', email: '', temporaryPassword: '' })
const formError = ref('')
const saving = ref(false)

// Datos que el administrador debe entregar al operador (se muestran una sola vez)
const credentials = ref(null)
const copied = ref(false)

// Restablecer contraseña temporal
const resetting = ref(null) // operador
const resetPassword = ref('')
const resetError = ref('')

async function load() {
  try {
    drivers.value = await api.listDrivers()
  } catch (e) {
    error.value = e.message
  } finally {
    loading.value = false
  }
}
onMounted(load)

const filtered = computed(() => {
  const q = search.value.trim().toLowerCase()
  return q ? drivers.value.filter((d) => `${d.name} ${d.email}`.toLowerCase().includes(q)) : drivers.value
})

function openNew() {
  form.value = { name: '', email: '', temporaryPassword: genPassword() }
  formError.value = ''
  modal.value = {}
}

function openEdit(d) {
  form.value = { name: d.name, email: d.email, temporaryPassword: '' }
  formError.value = ''
  modal.value = { id: d.id }
}

async function save() {
  formError.value = ''
  saving.value = true
  try {
    if (modal.value.id) {
      await api.updateDriver(modal.value.id, { name: form.value.name, email: form.value.email })
      msg.value = 'Operador actualizado.'
    } else {
      const { name, email, temporaryPassword } = form.value
      await api.createDriver({ name, email, temporaryPassword })
      credentials.value = { title: 'Operador registrado', name, email, password: temporaryPassword }
      copied.value = false
      msg.value = 'Operador registrado.'
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

// Baja = active false (el operador ya no puede iniciar sesión); reactivar = active true
async function toggleActive(d) {
  const text = d.active
    ? `¿Dar de baja a ${d.name}? Ya no podrá iniciar sesión ni recibir viajes.`
    : `¿Reactivar a ${d.name}?`
  if (!confirm(text)) return
  error.value = ''
  msg.value = ''
  try {
    await api.setDriverActive(d.id, !d.active)
    msg.value = d.active ? `${d.name} fue dado de baja.` : `${d.name} fue reactivado.`
    await load()
  } catch (e) {
    error.value = e.message
  }
}

function openReset(d) {
  resetting.value = d
  resetPassword.value = genPassword()
  resetError.value = ''
}

async function saveReset() {
  resetError.value = ''
  try {
    await api.resetDriverPassword(resetting.value.id, resetPassword.value)
    credentials.value = {
      title: 'Nueva contraseña temporal',
      name: resetting.value.name,
      email: resetting.value.email,
      password: resetPassword.value,
    }
    copied.value = false
    resetting.value = null
    await load()
  } catch (e) {
    resetError.value = e.message
  }
}

async function copyCredentials() {
  const c = credentials.value
  try {
    await navigator.clipboard.writeText(`Correo: ${c.email}\nContraseña temporal: ${c.password}`)
    copied.value = true
  } catch {
    copied.value = false
  }
}
</script>

<template>
  <div class="space-y-4">
    <div class="flex flex-wrap items-center justify-between gap-3">
      <h2 class="text-xl font-semibold">Operadores</h2>
      <div class="flex flex-wrap gap-2">
        <input v-model="search" class="input w-56" placeholder="Buscar nombre o correo..." />
        <button class="btn-primary" @click="openNew">Nuevo operador</button>
      </div>
    </div>

    <p v-if="error" class="rounded-lg bg-red-50 p-3 text-sm text-red-700">{{ error }}</p>
    <p v-if="msg" class="rounded-lg bg-emerald-50 p-3 text-sm text-emerald-700">{{ msg }}</p>

    <div class="card overflow-x-auto">
      <p v-if="loading" class="text-sm text-gray-500">Cargando...</p>
      <p v-else-if="!filtered.length" class="text-sm text-gray-500">No hay operadores registrados.</p>
      <table v-else class="w-full text-left text-sm">
        <thead class="border-b text-xs uppercase text-gray-500">
          <tr>
            <th class="py-2 pr-3">Nombre</th>
            <th class="py-2 pr-3">Correo</th>
            <th class="py-2 pr-3">Alta</th>
            <th class="py-2 pr-3">Estatus</th>
            <th class="py-2"></th>
          </tr>
        </thead>
        <tbody>
          <!-- Los operadores dados de baja se muestran en rojo -->
          <tr
            v-for="d in filtered"
            :key="d.id"
            class="border-b last:border-0"
            :class="d.active ? '' : 'bg-red-50 text-red-700'"
          >
            <td class="py-2 pr-3 font-medium">{{ d.name }}</td>
            <td class="py-2 pr-3">{{ d.email }}</td>
            <td class="whitespace-nowrap py-2 pr-3">{{ d.createdAt ? fmtDate(d.createdAt) : '—' }}</td>
            <td class="py-2 pr-3">
              <span
                class="rounded-full px-2 py-0.5 text-xs font-medium"
                :class="d.active ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'"
              >
                {{ d.active ? 'Activo' : 'De baja' }}
              </span>
              <span
                v-if="d.active && d.mustChangePassword"
                class="ml-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700"
                title="Aún no ha cambiado su contraseña temporal"
              >
                Contraseña temporal
              </span>
            </td>
            <td class="whitespace-nowrap py-2 text-right">
              <button class="btn-secondary btn-sm mr-1" @click="openEdit(d)">Editar</button>
              <button v-if="d.active" class="btn-secondary btn-sm mr-1" @click="openReset(d)">Restablecer contraseña</button>
              <button v-if="d.active" class="btn-danger btn-sm" @click="toggleActive(d)">Dar de baja</button>
              <button v-else class="btn-primary btn-sm" @click="toggleActive(d)">Reactivar</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Alta / edición -->
    <ModalForm v-if="modal" :title="modal.id ? 'Editar operador' : 'Nuevo operador'" @close="modal = null">
      <form class="space-y-3" @submit.prevent="save">
        <div>
          <label class="label">Nombre completo</label>
          <input v-model="form.name" required minlength="3" class="input" />
        </div>
        <div>
          <label class="label">Correo electrónico</label>
          <input v-model="form.email" type="email" required class="input" />
        </div>
        <div v-if="!modal.id">
          <label class="label">Contraseña temporal</label>
          <div class="flex gap-2">
            <input v-model="form.temporaryPassword" required minlength="8" class="input font-mono" />
            <button type="button" class="btn-secondary shrink-0" @click="form.temporaryPassword = genPassword()">Generar</button>
          </div>
          <p class="mt-1 text-xs text-gray-500">
            El operador deberá cambiarla en su primer inicio de sesión. Al guardar, podrás copiar los datos para enviárselos.
          </p>
        </div>
        <p v-if="formError" class="text-sm text-red-600">{{ formError }}</p>
        <div class="flex justify-end gap-2">
          <button type="button" class="btn-secondary" @click="modal = null">Cancelar</button>
          <button class="btn-primary" :disabled="saving">{{ saving ? 'Guardando...' : 'Guardar' }}</button>
        </div>
      </form>
    </ModalForm>

    <!-- Restablecer contraseña temporal -->
    <ModalForm v-if="resetting" title="Restablecer contraseña" @close="resetting = null">
      <form class="space-y-3" @submit.prevent="saveReset">
        <p class="text-sm text-gray-600">
          Se asignará una contraseña temporal nueva a <b>{{ resetting.name }}</b>. Sus sesiones abiertas se cerrarán y deberá cambiarla al entrar.
        </p>
        <div class="flex gap-2">
          <input v-model="resetPassword" required minlength="8" class="input font-mono" />
          <button type="button" class="btn-secondary shrink-0" @click="resetPassword = genPassword()">Generar</button>
        </div>
        <p v-if="resetError" class="text-sm text-red-600">{{ resetError }}</p>
        <div class="flex justify-end gap-2">
          <button type="button" class="btn-secondary" @click="resetting = null">Cancelar</button>
          <button class="btn-primary">Restablecer</button>
        </div>
      </form>
    </ModalForm>

    <!-- Credenciales para entregar al operador -->
    <ModalForm v-if="credentials" :title="credentials.title" @close="credentials = null">
      <div class="space-y-3">
        <p class="text-sm text-gray-600">
          Envía estos datos a <b>{{ credentials.name }}</b>. La contraseña temporal solo se muestra ahora; si se pierde, puedes restablecerla.
        </p>
        <div class="rounded-lg bg-gray-50 p-3 font-mono text-sm">
          <p>Correo: {{ credentials.email }}</p>
          <p>Contraseña temporal: {{ credentials.password }}</p>
        </div>
        <p class="text-xs text-gray-500">En su primer inicio de sesión se le pedirá que la reemplace por una contraseña propia.</p>
        <div class="flex justify-end gap-2">
          <button class="btn-secondary" @click="copyCredentials">{{ copied ? '¡Copiado!' : 'Copiar datos' }}</button>
          <button class="btn-primary" @click="credentials = null">Listo</button>
        </div>
      </div>
    </ModalForm>
  </div>
</template>
