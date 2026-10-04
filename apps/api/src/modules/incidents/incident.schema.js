import { z } from 'zod'

export const incidentCreateSchema = z.object({
  tripId: z.string().min(1),
  title: z.string().trim().min(3).max(80),
  description: z.string().trim().min(3).max(1000),
  photo: z.string().startsWith('data:image/').max(900_000, 'La foto es demasiado grande').nullable().optional(),
})
