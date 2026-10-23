import { Router } from 'express'
import { authenticate, authorize } from '../../config/auth.js'
import { validate } from '../../shared/validate.js'
import { driverCreateSchema, driverUpdateSchema, activeSchema, resetPasswordSchema } from './driver.schema.js'
import { me, list, create, update, setActive, resetPassword } from './driver.controller.js'

const router = Router()
router.use(authenticate)
router.get('/me', authorize('drivers:me'), me)
router.get('/', authorize('drivers:read'), list)
router.post('/', authorize('drivers:write'), validate(driverCreateSchema), create)
router.patch('/:id/active', authorize('drivers:write'), validate(activeSchema), setActive)
router.post('/:id/reset-password', authorize('drivers:write'), validate(resetPasswordSchema), resetPassword)
router.patch('/:id', authorize('drivers:write'), validate(driverUpdateSchema), update)

export default router
