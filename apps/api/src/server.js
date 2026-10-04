import app from './app.js'
import { env } from './config/env.js'
import { db } from './config/firebase.js'
import { closeExpiredTrips } from './modules/trips/trip.service.js'

await db.listCollections()
console.log('Firestore conectado')

const sweep = () => closeExpiredTrips().catch((e) => console.error('Error al cerrar viajes vencidos', e))
sweep()
setInterval(sweep, 10 * 60 * 1000) // cada 10 minutos

app.listen(env.port, () => console.log(`API escuchando en http://localhost:${env.port}`))
