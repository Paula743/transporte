<script setup>
defineProps({ title: String, wide: Boolean })
const emit = defineEmits(['close'])
</script>

<template>
  <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" @click.self="emit('close')">
    <div class="card max-h-[90vh] w-full overflow-y-auto" :class="wide ? 'max-w-2xl' : 'max-w-md'">
      <div class="mb-3 flex items-start justify-between gap-3">
        <h2 class="text-lg font-bold">{{ title }}</h2>
        <button type="button" class="text-gray-400 hover:text-gray-700" title="Cerrar" @click="emit('close')">✕</button>
      </div>
      <slot />
    </div>
  </div>
</template>
