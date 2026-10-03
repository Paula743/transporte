import { z } from 'zod'

export const registerSchema = z.object({
  name: z.string().trim().min(3, 'Escribe tu nombre completo'),
  email: z.string().trim().toLowerCase().email('Correo inválido'),
  password: z.string().min(6, 'Mínimo 6 caracteres'),
  role: z.enum(['PASSENGER', 'DRIVER']),
})

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email('Correo inválido'),
  password: z.string().min(1, 'Escribe tu contraseña'),
})
