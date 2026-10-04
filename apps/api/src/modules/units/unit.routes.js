import { Router } from 'express'
import { authenticate, authorize } from '../../config/auth.js'
import { validate } from '../../shared/validate.js'
import { unitCreateSchema, unitUpdateSchema } from './unit.schema.js'
import { list, get, create, update, remove } from './unit.controller.js'

const router = Router()
router.use(authenticate)
router.get('/', authorize('units:read'), list)
router.get('/:id', authorize('units:read'), get)
router.post('/', authorize('units:write'), validate(unitCreateSchema), create)
router.patch('/:id', authorize('units:write'), validate(unitUpdateSchema), update)
router.delete('/:id', authorize('units:write'), remove)

export default router
