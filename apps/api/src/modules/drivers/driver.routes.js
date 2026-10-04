import { Router } from 'express'
import { authenticate, authorize } from '../../config/auth.js'
import { validate } from '../../shared/validate.js'
import { driverCreateSchema, activeSchema } from './driver.schema.js'
import { me, list, create, setActive } from './driver.controller.js'

const router = Router()
router.use(authenticate)
router.get('/me', authorize('drivers:me'), me)
router.get('/', authorize('drivers:read'), list)
router.post('/', authorize('drivers:write'), validate(driverCreateSchema), create)
router.patch('/:id/active', authorize('drivers:write'), validate(activeSchema), setActive)

export default router
