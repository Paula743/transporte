import { Router } from 'express'
import { authenticate, authorize } from '../../config/auth.js'
import { validate } from '../../shared/validate.js'
import { buySchema } from './ticket.schema.js'
import { buy, mine, cancel, pdf } from './ticket.controller.js'

const router = Router()
router.use(authenticate)
router.post('/', authorize('tickets:buy'), validate(buySchema), buy)
router.get('/mine', authorize('tickets:own'), mine)
router.patch('/:id/cancel', authorize('tickets:own'), cancel)
router.get('/:id/pdf', authorize('tickets:own', 'tickets:read'), pdf)

export default router
