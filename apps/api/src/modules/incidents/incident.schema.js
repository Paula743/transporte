import { z } from 'zod'

export const incidentCreateSchema = z.object({
  tripId: z.string().min(1),
  title: z.string().trim().min(3).max(80),
  description: z.string().trim().min(3).max(1000),
  photo: z.string().startsWith('data:image/').max(900_000, 'La foto es demasiado grande').nullable().optional(),
})

// start: solo las de los viajes de ese mes (panel de KPIs); tripId: solo las de ese viaje; sin nada: todas
export const listQuerySchema = z.object({
  start: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Usa el formato AAAA-MM-DD').optional(),
  tripId: z.string().min(1).optional(),
})
