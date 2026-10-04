import { z } from 'zod'

// El pasajero se crea desde /api/auth/register; aquí solo se valida el id de los parámetros
export const idParamSchema = z.object({ id: z.string().min(1) })
