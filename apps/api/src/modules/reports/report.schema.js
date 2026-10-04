import { z } from 'zod'

export const monthlySchema = z.object({
  start: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Usa el formato AAAA-MM-DD'),
})
