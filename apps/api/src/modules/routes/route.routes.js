import { Router } from 'express'
import { authenticate, authorize } from '../../config/auth.js'
import { validate } from '../../shared/validate.js'
import { routeCreateSchema, routeUpdateSchema } from './route.schema.js'
import { list, cities, create, update, remove } from './route.controller.js'

const router = Router()
router.use(authenticate)
router.get('/cities', authorize('routes:read'), cities) // antes de /:id
router.get('/', authorize('routes:read'), list)
router.post('/', authorize('routes:write'), validate(routeCreateSchema), create)
router.patch('/:id', authorize('routes:write'), validate(routeUpdateSchema), update)
router.delete('/:id', authorize('routes:write'), remove)

export default router
