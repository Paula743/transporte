import { adminAuth, db } from '../src/config/firebase.js'

const [, , email, password, ...nameParts] = process.argv
const name = nameParts.join(' ') || 'Administrador'

if (!email || !password) {
  console.log('Uso: npm run create-admin -w apps/api -- correo contraseña "Nombre"')
  process.exit(1)
}

let record = await adminAuth.getUserByEmail(email).catch(() => null)
if (record) await adminAuth.updateUser(record.uid, { password, displayName: name })
else record = await adminAuth.createUser({ email, password, displayName: name })

await adminAuth.setCustomUserClaims(record.uid, { role: 'ADMIN' })
await db.collection('users').doc(record.uid).set(
  { name, email, role: 'ADMIN', createdAt: new Date().toISOString() },
  { merge: true },
)
console.log(`Administrador listo: ${email}`)
process.exit(0)
