import { z } from 'zod'

const fields = {
  plate: z.string().trim().min(3, 'Placa inválida'),
  totalSeats: z.number().int().min(1).max(60),
  status: z.enum(['DISPONIBLE', 'CON_RUTA', 'EN_MANTENIMIENTO', 'FUERA_DE_SERVICIO']),
  accumulatedKm: z.number().min(0),
}

export const unitCreateSchema = z.object({
  plate: fields.plate,
  totalSeats: fields.totalSeats,
  accumulatedKm: fields.accumulatedKm.optional(),
})

// El estatus no se edita aquí: se cambia con el botón de mantenimiento (PATCH /:id/status)
export const unitUpdateSchema = z.object({
  plate: fields.plate,
  totalSeats: fields.totalSeats,
  accumulatedKm: fields.accumulatedKm,
}).partial()

export const unitStatusSchema = z.object({
  status: z.enum(['EN_MANTENIMIENTO', 'DISPONIBLE']),
})
