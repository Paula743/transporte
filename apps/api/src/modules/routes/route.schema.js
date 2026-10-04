import { z } from 'zod'

export const routeCreateSchema = z.object({
  origin: z.string().trim().min(2),
  destination: z.string().trim().min(2),
  km: z.number().positive(),
  price: z.number().positive(),
})

export const routeUpdateSchema = routeCreateSchema.partial()
