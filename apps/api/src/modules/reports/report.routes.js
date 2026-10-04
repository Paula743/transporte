import { Router } from 'express'
import { authenticate, authorize } from '../../config/auth.js'
import { validate } from '../../shared/validate.js'
import { monthlySchema } from './report.schema.js'
import { monthly, monthlyXlsx } from './report.controller.js'

const router = Router()
router.use(authenticate, authorize('reports:read'))
router.get('/monthly', validate(monthlySchema, 'query'), monthly)
router.get('/monthly/xlsx', validate(monthlySchema, 'query'), monthlyXlsx)

export default router
