import { z } from 'zod'

const iso = z.string().datetime({ offset: true })

export const tripCreateSchema = z.object({
  routeId: z.string().min(1),
  unitId: z.string().min(1),
  driverId: z.string().min(1),
  departure: iso,
  arrival: iso,
  platform: z.number().int().min(1).max(20).optional(),
})

export const searchSchema = z.object({
  origin: z.string().min(2),
  destination: z.string().min(2),
  from: iso, // inicio del día buscado
  to: iso,   // fin del día buscado
})
