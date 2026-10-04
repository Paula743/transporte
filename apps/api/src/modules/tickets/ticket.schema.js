import { z } from 'zod'

export const buySchema = z.object({
  tripId: z.string().min(1),
  quantity: z.number().int().min(1).max(20),
})
