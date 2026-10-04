import { Router } from 'express'
import { authenticate } from '../../config/auth.js'
import { validate } from '../../shared/validate.js'
import { publicRegisterSchema, loginSchema } from './schema.js'
import { register, login, me } from './auth.controller.js'

const router = Router()
router.post('/register', validate(publicRegisterSchema), register)
router.post('/login', validate(loginSchema), login)
router.get('/me', authenticate, me)

export default router
