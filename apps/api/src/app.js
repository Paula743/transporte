import express from 'express'
import cors from 'cors'
import { env } from './config/env.js'

const app = express()
app.use(cors({ origin: env.corsOrigin }))
app.use(express.json({ limit: '2mb' }))

app.get('/api/health', (req, res) => res.json({ ok: true, time: new Date().toISOString() }))

// ---- Módulos (se agregan en las siguientes subfases) ----

app.use((req, res) => res.status(404).json({ error: 'Ruta no encontrada' }))

// Manejo central de errores (Express 5 reenvía automáticamente los errores de funciones async)
app.use((err, req, res, next) => {
  const status = err.status || 500
  if (status === 500) console.error(err)
  res.status(status).json({ error: status === 500 ? 'Error interno del servidor' : err.message })
})

export default app
