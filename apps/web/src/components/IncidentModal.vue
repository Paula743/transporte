<script setup>
import { ref } from 'vue'
import { auth } from '../stores/auth'
import * as api from '../services/api'

const props = defineProps({ tripId: String })
const emit = defineEmits(['close', 'sent'])

const title = ref('')
const description = ref('')
const photo = ref(null)
const error = ref('')
const loading = ref(false)

function onFile(e) {
  const file = e.target.files[0]
  if (!file) return
  const reader = new FileReader()
  reader.onload = () => (photo.value = reader.result) // base64 de ejemplo; en Fase 2 se sube como archivo
  reader.readAsDataURL(file)
}

async function send() {
  error.value = ''
  loading.value = true
  try {
    await api.reportIncident({
      tripId: props.tripId,
      emitterId: auth.user.id,
      emitterRole: auth.user.role,
      title: title.value,
      description: description.value,
      photo: photo.value,
    })
    emit('sent')
    emit('close')
  } catch (e) {
    error.value = e.message
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
    <form @submit.prevent="send" class="card w-full max-w-md space-y-3">
      <h2 class="text-lg font-bold">Reportar incidencia</h2>
      <div>
        <label class="label">Título</label>
        <input v-model="title" required maxlength="80" class="input" placeholder="Ej. Bloqueo en carretera" />
      </div>
      <div>
        <label class="label">Descripción</label>
        <textarea v-model="description" required rows="4" class="input"></textarea>
      </div>
      <div>
        <label class="label">Foto (opcional)</label>
        <input type="file" accept="image/*" @change="onFile" class="text-sm" />
        <img v-if="photo" :src="photo" class="mt-2 max-h-32 rounded" />
      </div>
      <p v-if="error" class="text-sm text-red-600">{{ error }}</p>
      <div class="flex justify-end gap-2">
        <button type="button" class="btn-secondary" @click="emit('close')">Cancelar</button>
        <button class="btn-primary" :disabled="loading">{{ loading ? 'Enviando...' : 'Enviar reporte' }}</button>
      </div>
    </form>
  </div>
</template>
