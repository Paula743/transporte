import { z } from 'zod'

const fields = {
  plate: z.string().trim().min(3, 'Placa inválida'),
  totalSeats: z.number().int().min(1).max(60),
  status: z.enum(['DISPONIBLE', 'CON_RUTA', 'FUERA_DE_SERVICIO']),
  accumulatedKm: z.number().min(0),
}

export const unitCreateSchema = z.object({
  plate: fields.plate,
  totalSeats: fields.totalSeats,
  status: fields.status.optional(),
  accumulatedKm: fields.accumulatedKm.optional(),
})

export const unitUpdateSchema = z.object(fields).partial()
