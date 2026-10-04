<script setup>
import { ref, computed } from 'vue'
import AppHeader from '../components/AppHeader.vue'
import * as api from '../services/api'
import { downloadReport } from '../utils/report'
import { fmtDateTime } from '../utils/format'

const start = ref('')
const report = ref(null)
const error = ref('')
const loading = ref(false)
const max = api.maxStartDate()

const invalid = computed(() => start.value && start.value > max)

const incidents = ref([])
const detail = ref(null)

const roleLabel = (r) => (r === 'DRIVER' ? 'Operador' : 'Pasajero')

async function load() {
  error.value = ''
  report.value = null
  incidents.value = []
  if (!start.value) return (error.value = 'Selecciona una fecha de inicio')
  if (invalid.value) return (error.value = 'El mes seleccionado aún no se completa. Elige una fecha anterior.')
  loading.value = true
  try {
    const [r, inc] = await Promise.all([api.adminReport(start.value), api.adminIncidents(start.value)])
    report.value = r
    incidents.value = inc
  } catch (e) {
    error.value = e.message
  } finally {
    loading.value = false
  }
}

async function openDetail(i) {
  try {
    detail.value = await api.getIncident(i.id)
  } catch (e) {
    error.value = e.message
  }
}

const maxMonth = computed(() => Math.max(1, ...(report.value?.months.map((m) => m.total) || [1])))

const lists = computed(() =>
  report.value
    ? [
        { title: 'Rutas más comunes', rows: report.value.routesCommon, key: 'route', unit: 'viajes' },
        { title: 'Rutas con más incidentes (carreteras de riesgo)', rows: report.value.routesIncidents, key: 'route', unit: 'incidentes' },
        { title: 'Unidades más usadas (prioridad de mantenimiento)', rows: report.value.unitsUsed, key: 'unit', unit: 'viajes' },
        { title: 'Clientes más frecuentes', rows: report.value.clients, key: 'client', unit: 'boletos' },
        { title: 'Operadores con menos incidencias', rows: report.value.drivers, key: 'driver', unit: 'incidencias' },
      ]
    : [],
)
</script>

<template>
  <AppHeader title="Panel del administrador" />

  <main class="mx-auto max-w-6xl space-y-4 p-4">
    <section class="card flex flex-wrap items-end gap-3">
      <div>
        <label class="label">Fecha de inicio (el reporte cubre 1 mes)</label>
        <input v-model="start" type="date" :max="max" class="input" />
      </div>
      <button class="btn-primary" :disabled="loading" @click="load">{{ loading ? 'Calculando...' : 'Ver KPIs' }}</button>
      <button class="btn-secondary" :disabled="!report" @click="downloadReport(report)">Descargar reporte</button>
      <p class="w-full text-xs text-gray-500">Solo se pueden consultar meses completos (fecha de inicio hasta {{ max }}).</p>
    </section>

    <p v-if="error" class="rounded-lg bg-red-50 p-3 text-sm text-red-700">{{ error }}</p>

    <template v-if="report">
      <p class="text-sm text-gray-600">Periodo: {{ report.period.from }} a {{ report.period.to }}</p>

      <section class="grid gap-3 sm:grid-cols-2">
        <div class="card">
          <p class="text-sm text-gray-500">Servicios del mes</p>
          <p class="text-3xl font-bold text-emerald-700">{{ report.totals.services }}</p>
        </div>
        <div class="card">
          <p class="text-sm text-gray-500">Incidencias reportadas</p>
          <p class="text-3xl font-bold text-red-600">{{ report.totals.incidents }}</p>
        </div>
      </section>

      <section class="grid gap-3 md:grid-cols-2">
        <div v-for="l in lists" :key="l.title" class="card">
          <h3 class="mb-2 font-semibold">{{ l.title }}</h3>
          <p v-if="!l.rows.length" class="text-sm text-gray-500">Sin datos en este periodo.</p>
          <ol class="space-y-1 text-sm">
            <li v-for="(r, i) in l.rows.slice(0, 5)" :key="r[l.key]" class="flex justify-between">
              <span>{{ i + 1 }}. {{ r[l.key] }}</span>
              <span class="font-medium">{{ r.total }} {{ l.unit }}</span>
            </li>
          </ol>
        </div>

        <div class="card">
          <h3 class="mb-2 font-semibold">Servicios por mes (temporadas altas y bajas)</h3>
          <div v-for="m in report.months" :key="m.month" class="mb-1 flex items-center gap-2 text-sm">
            <span class="w-20 shrink-0">{{ m.month }}</span>
            <div class="h-4 rounded bg-emerald-500" :style="{ width: (m.total / maxMonth) * 100 + '%', minWidth: '2px' }"></div>
            <span>{{ m.total }}</span>
          </div>
        </div>
      </section>
      <section class="card">
        <div class="mb-3 flex items-center justify-between">
          <h3 class="font-semibold">Incidencias del mes <span class="font-normal text-gray-500">({{ incidents.length }})</span></h3>
        </div>
        <p v-if="!incidents.length" class="text-sm text-gray-500">No hay incidencias reportadas en este periodo.</p>
        <div v-else class="overflow-x-auto">
          <table class="w-full text-left text-sm">
            <thead class="border-b text-xs uppercase text-gray-500">
              <tr>
                <th class="py-2 pr-3">Fecha</th>
                <th class="py-2 pr-3">Ruta</th>
                <th class="py-2 pr-3">Reportó</th>
                <th class="py-2 pr-3">Título</th>
                <th class="py-2"></th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="i in incidents" :key="i.id" class="border-b last:border-0">
                <td class="whitespace-nowrap py-2 pr-3">{{ fmtDateTime(i.createdAt) }}</td>
                <td class="whitespace-nowrap py-2 pr-3">{{ i.route }}</td>
                <td class="py-2 pr-3">
                  {{ i.emitterName }}
                  <span
                    class="ml-1 rounded-full px-2 py-0.5 text-xs font-medium"
                    :class="i.emitterRole === 'DRIVER' ? 'bg-blue-100 text-blue-700' : 'bg-emerald-100 text-emerald-700'"
                  >{{ roleLabel(i.emitterRole) }}</span>
                </td>
                <td class="py-2 pr-3">{{ i.title }}<span v-if="i.hasPhoto" class="ml-1 text-gray-400" title="Incluye foto">📷</span></td>
                <td class="py-2 text-right"><button class="btn-secondary" @click="openDetail(i)">Ver detalle</button></td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </template>
    <div v-if="detail" class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" @click.self="detail = null">
      <div class="card w-full max-w-lg space-y-3">
        <h2 class="text-lg font-bold">{{ detail.title }}</h2>
        <p class="text-sm text-gray-500">
          {{ detail.emitterName }} · {{ roleLabel(detail.emitterRole) }} · {{ fmtDateTime(detail.createdAt) }}
        </p>
        <p class="whitespace-pre-line text-sm">{{ detail.description }}</p>
        <img v-if="detail.photo" :src="detail.photo" class="max-h-72 rounded" alt="Foto de la incidencia" />
        <div class="flex justify-end">
          <button class="btn-primary" @click="detail = null">Cerrar</button>
        </div>
      </div>
    </div>
  </main>
</template>
