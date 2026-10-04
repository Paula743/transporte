import { ref, onMounted, onUnmounted } from 'vue'

// ¿Ya llegó la hora de salida?
export const hasStarted = (trip, now = Date.now()) => now >= new Date(trip.departure).getTime()

// Las incidencias solo se reportan con el viaje en curso: ya salió y aún no finaliza
export const canReportIncident = (trip, now = Date.now()) => hasStarted(trip, now) && trip.status !== 'FINALIZADO'

export const incidentHint = (trip, now = Date.now()) => {
  if (!hasStarted(trip, now)) return 'Podrás reportar incidencias cuando el viaje inicie'
  if (trip.status === 'FINALIZADO') return 'El viaje ya finalizó'
  return ''
}

// Hora actual que se refresca sola cada 30 s, para que los botones cambien sin recargar
export function useNow(ms = 30000) {
  const now = ref(Date.now())
  let timer
  onMounted(() => (timer = setInterval(() => (now.value = Date.now()), ms)))
  onUnmounted(() => clearInterval(timer))
  return now
}

// El operador solo puede finalizar un viaje en curso: ya salió y aún no finaliza
export const canFinishTrip = (trip, now = Date.now()) => hasStarted(trip, now) && trip.status !== 'FINALIZADO'

export const finishHint = (trip, now = Date.now()) => {
  if (!hasStarted(trip, now)) return 'Podrás finalizar el viaje cuando inicie'
  if (trip.status === 'FINALIZADO') return 'El viaje ya finalizó'
  return ''
}