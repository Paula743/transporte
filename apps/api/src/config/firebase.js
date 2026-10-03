import { initializeApp, cert, getApps } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'
import { getAuth } from 'firebase-admin/auth'
import { env } from './env.js'

const app =
  getApps()[0] ??
  initializeApp({
    credential: cert({
      projectId: env.firebase.projectId,
      clientEmail: env.firebase.clientEmail,
      privateKey: env.firebase.privateKey,
    }),
  })

export const db = getFirestore(app)
db.settings({ ignoreUndefinedProperties: true })
export const adminAuth = getAuth(app)
