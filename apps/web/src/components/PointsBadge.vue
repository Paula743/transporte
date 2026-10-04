<script setup>
import { onMounted } from 'vue'
import { points, refreshPoints } from '../stores/points'

onMounted(refreshPoints)
</script>

<template>
  <span
    class="rounded-full bg-amber-100 px-3 py-1 text-sm font-semibold text-amber-700"
    title="Ganas 1 punto por cada $10 que pagas"
  >
    ⭐ {{ points.value ?? '—' }} puntos
  </span>
</template>