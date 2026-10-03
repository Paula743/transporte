const required = ['FIREBASE_PROJECT_ID', 'FIREBASE_CLIENT_EMAIL', 'FIREBASE_PRIVATE_KEY', 'FIREBASE_WEB_API_KEY']
const missing = required.filter((k) => !process.env[k])
if (missing.length) throw new Error(`Faltan variables de entorno: ${missing.join(', ')}`)

export const env = {
  port: Number(process.env.PORT) || 3000,
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  firebase: {
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    webApiKey: process.env.FIREBASE_WEB_API_KEY,
  },
}
