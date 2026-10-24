import { Router } from 'express'
import { authenticate, authorize } from '../../config/auth.js'
import { validate } from '../../shared/validate.js'
import { tripCreateSchema, tripUpdateSchema, tripReassignSchema, searchSchema } from './trip.schema.js'
import { search, mine, list, create, update, cancel, reassign, finish } from './trip.controller.js'

const router = Router()
router.use(authenticate)
router.get('/search', authorize('trips:search'), validate(searchSchema, 'query'), search)
router.get('/mine', authorize('trips:own'), mine)
router.patch('/:id/finish', authorize('trips:own'), finish)
router.patch('/:id/cancel', authorize('trips:write'), cancel)
router.patch('/:id/reassign', authorize('trips:write'), validate(tripReassignSchema), reassign)
router.get('/', authorize('trips:read'), list)
router.post('/', authorize('trips:write'), validate(tripCreateSchema), create)
router.patch('/:id', authorize('trips:write'), validate(tripUpdateSchema), update)

export default router
