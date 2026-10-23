import { Router } from 'express'
import { authenticate } from '../../config/auth.js'
import { validate } from '../../shared/validate.js'
import { publicRegisterSchema, loginSchema, changePasswordSchema } from './auth.schema.js'
import { register, login, me, changePassword } from './auth.controller.js'

const router = Router()
router.post('/register', validate(publicRegisterSchema), register)
router.post('/login', validate(loginSchema), login)
router.get('/me', authenticate, me)
router.post('/change-password', authenticate, validate(changePasswordSchema), changePassword)

export default router
