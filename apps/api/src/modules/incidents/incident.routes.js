import { Router } from 'express'
import { authenticate, authorize } from '../../config/auth.js'
import { validate } from '../../shared/validate.js'
import { incidentCreateSchema, listQuerySchema } from './incident.schema.js'
import { create, list, get } from './incident.controller.js'

const router = Router()
router.use(authenticate)
router.post('/', authorize('incidents:create'), validate(incidentCreateSchema), create)
router.get('/', authorize('incidents:read'), validate(listQuerySchema, 'query'), list)
router.get('/:id', authorize('incidents:read'), get)

export default router
