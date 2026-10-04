import { z } from 'zod'
import { registerSchema } from '../auth/auth.schema.js'

export const driverCreateSchema = registerSchema.omit({ role: true })
export const activeSchema = z.object({ active: z.boolean() })
