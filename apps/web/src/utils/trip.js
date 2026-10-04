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

// Fase que se muestra al usuario: un viaje próximo cuya hora de salida ya pasó está EN CURSO
export const tripPhase = (trip, now = Date.now()) =>
  trip.status === 'PROXIMO' && hasStarted(trip, now) ? 'EN_CURSO' : trip.status

export const phaseLabel = {
  PROXIMO: 'PRÓXIMO',
  EN_CURSO: 'EN CURSO',
  FINALIZADO: 'FINALIZADO',
  CANCELADO: 'CANCELADO',
}

export const phaseClass = {
  PROXIMO: 'bg-emerald-100 text-emerald-700',
  EN_CURSO: 'bg-blue-100 text-blue-700',
  FINALIZADO: 'bg-gray-200 text-gray-600',
  CANCELADO: 'bg-red-100 text-red-700',
}