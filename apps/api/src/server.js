import app from './app.js'
import { env } from './config/env.js'
import { db } from './config/firebase.js'

await db.listCollections() // falla aquí si las credenciales están mal
console.log('Firestore conectado')

app.listen(env.port, () => console.log(`API escuchando en http://localhost:${env.port}`))
