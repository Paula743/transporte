import { Router } from 'express'
import { authenticate, authorize } from '../../config/auth.js'
import { validate } from '../../shared/validate.js'
import { incidentCreateSchema } from './incident.schema.js'
import { create, list } from './incident.controller.js'

const router = Router()
router.use(authenticate)
router.post('/', authorize('incidents:create'), validate(incidentCreateSchema), create)
router.get('/', authorize('incidents:read'), list)

export default router
