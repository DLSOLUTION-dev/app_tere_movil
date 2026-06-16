const admin   = require('../config/firebase')
const prisma  = require('../config/database')

/**
 * Envía una notificación push via FCM y la guarda en la BD.
 * @param {string} usuarioId  - UUID del destinatario
 * @param {string} titulo
 * @param {string} mensaje
 * @param {string} tipo       - TipoNotificacion enum
 * @param {string} [pantalla] - ruta de expo-router a la que debe navegar al tocar la notificación
 */
const enviarNotificacion = async (usuarioId, titulo, mensaje, tipo, pantalla = null) => {
  // Guardar siempre en BD (historial)
  await prisma.notificacion.create({
    data: { usuarioId, titulo, mensaje, tipo, pantalla },
  })

  // Obtener token FCM del dispositivo
  const usuario = await prisma.usuario.findUnique({
    where: { id: usuarioId },
    select: { fcmToken: true },
  })

  if (!usuario?.fcmToken) return  // sin token = sin push, pero la notificación queda en BD

  const token = usuario.fcmToken
  const data = pantalla ? { tipo, destino: pantalla } : { tipo }

  try {
    if (token.startsWith('ExponentPushToken[')) {
      // Expo Go / EAS build — usar el servidor de push de Expo
      await fetch('https://exp.host/--/expo-push-endpoint', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          to:    token,
          title: titulo,
          body:  mensaje,
          sound: 'default',
          data,
        }),
      })
    } else {
      // Token FCM nativo (build de producción sin Expo Go)
      await admin.messaging().send({
        token,
        notification: { title: titulo, body: mensaje },
        data,
      })
    }
  } catch (err) {
    console.error('Error push:', err.message)
  }
}

module.exports = { enviarNotificacion }
