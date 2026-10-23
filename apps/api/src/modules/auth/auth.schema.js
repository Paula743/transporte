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

// El registro público no recibe rol: solo crea pasajeros
export const publicRegisterSchema = registerSchema.omit({ role: true })

// Cambio de contraseña (también reemplaza la contraseña temporal de un operador)
export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Escribe tu contraseña actual'),
    newPassword: z.string().min(8, 'La nueva contraseña debe tener al menos 8 caracteres'),
  })
  .refine((d) => d.newPassword !== d.currentPassword, {
    message: 'La nueva contraseña debe ser distinta a la actual',
    path: ['newPassword'],
  })
