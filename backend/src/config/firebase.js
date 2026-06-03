const admin = require('firebase-admin')

if (!admin.apps.length) {
  const projectId = process.env.FIREBASE_PROJECT_ID

  // Solo inicializa Firebase si las credenciales están configuradas
  if (projectId) {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      }),
      storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
    })
  } else {
    console.warn('⚠️  Firebase no configurado — las notificaciones push están desactivadas')
  }
}

module.exports = admin