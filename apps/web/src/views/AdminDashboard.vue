<script setup>
import { ref, computed } from 'vue'
import AppHeader from '../components/AppHeader.vue'
import * as api from '../services/api'
import { downloadReport } from '../utils/report'

const start = ref('')
const report = ref(null)
const error = ref('')
const loading = ref(false)
const max = api.maxStartDate()

const invalid = computed(() => start.value && start.value > max)

async function load() {
  error.value = ''
  report.value = null
  if (!start.value) return (error.value = 'Selecciona una fecha de inicio')
  if (invalid.value) return (error.value = 'El mes seleccionado aún no se completa. Elige una fecha anterior.')
  loading.value = true
  try {
    report.value = await api.adminReport(start.value)
  } catch (e) {
    error.value = e.message
  } finally {
    loading.value = false
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
      </section>
    </template>
  </main>
</template>

