import express from 'express'
import cors from 'cors'
import { env } from './config/env.js'
import authRoutes from './modules/auth/auth.routes.js'
import unitsRoutes from './modules/units/unit.routes.js'
import routesRoutes from './modules/routes/route.routes.js'
import passengersRoutes from './modules/passengers/passenger.routes.js'
import driversRoutes from './modules/drivers/driver.routes.js'
import tripsRoutes from './modules/trips/trip.routes.js'
import ticketsRoutes from './modules/tickets/ticket.routes.js'
import incidentsRoutes from './modules/incidents/incident.routes.js'
import reportsRoutes from './modules/reports/report.routes.js'

const app = express()
app.use(cors({ origin: env.corsOrigin }))
app.use(express.json({ limit: '2mb' }))

app.get('/api/health', (req, res) => res.json({ ok: true, time: new Date().toISOString() }))

// Módulos
app.use('/api/auth', authRoutes)
app.use('/api/units', unitsRoutes)
app.use('/api/routes', routesRoutes)
app.use('/api/passengers', passengersRoutes)
app.use('/api/drivers', driversRoutes)
app.use('/api/trips', tripsRoutes)
app.use('/api/tickets', ticketsRoutes)
app.use('/api/incidents', incidentsRoutes)
app.use('/api/reports', reportsRoutes)

app.use((req, res) => res.status(404).json({ error: 'Ruta no encontrada' }))

// Manejo central de errores (Express 5 reenvía automáticamente los errores de funciones async)
app.use((err, req, res, next) => {
  const status = err.status || 500
  if (status === 500) console.error(err)
  res.status(status).json({ error: status === 500 ? 'Error interno del servidor' : err.message })
})

export default app
