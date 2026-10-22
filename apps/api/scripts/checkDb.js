import { db, adminAuth } from '../src/config/firebase.js'

const collections = ['users', 'passengers', 'drivers', 'routes', 'units', 'trips', 'tickets', 'incidents']

for (const name of collections) {
  const snap = await db.collection(name).count().get()
  console.log(`${name.padEnd(12)} ${snap.data().count} documentos`)
}
const users = await adminAuth.listUsers(1000)
console.log(`${'auth'.padEnd(12)} ${users.users.length} usuarios`)
process.exit(0)
