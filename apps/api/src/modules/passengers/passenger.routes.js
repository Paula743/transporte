import { Router } from 'express'
import { authenticate, authorize } from '../../config/auth.js'
import { me, list } from './passenger.controller.js'

const router = Router()
router.use(authenticate)
router.get('/me', authorize('passengers:me'), me)
router.get('/', authorize('passengers:read'), list)

export default router
