import { Router } from 'express'
import { authenticate, authorize } from '../../config/auth.js'
import { validate } from '../../shared/validate.js'
import { tripCreateSchema, searchSchema } from './trip.schema.js'
import { search, mine, list, create, finish } from './trip.controller.js'

const router = Router()
router.use(authenticate)
router.get('/search', authorize('trips:search'), validate(searchSchema, 'query'), search)
router.get('/mine', authorize('trips:own'), mine)
router.patch('/:id/finish', authorize('trips:own'), finish)
router.get('/', authorize('trips:read'), list)
router.post('/', authorize('trips:write'), validate(tripCreateSchema), create)

export default router
