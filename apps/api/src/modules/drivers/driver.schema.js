import { z } from 'zod'

const name = z.string().trim().min(3, 'Escribe el nombre completo')
const email = z.string().trim().toLowerCase().email('Correo inválido')
const temporaryPassword = z.string().min(8, 'La contraseña temporal debe tener al menos 8 caracteres')

export const driverCreateSchema = z.object({ name, email, temporaryPassword })
export const driverUpdateSchema = z.object({ name: name.optional(), email: email.optional() })
export const resetPasswordSchema = z.object({ temporaryPassword })
export const activeSchema = z.object({ active: z.boolean() })
