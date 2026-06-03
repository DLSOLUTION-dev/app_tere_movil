const admin   = require('../config/firebase')
const prisma  = require('../config/database')

/**
 * Envía una notificación push via FCM y la guarda en la BD.
 * @param {string} usuarioId  - UUID del destinatario
 * @param {string} titulo
 * @param {string} mensaje
 * @param {string} tipo       - TipoNotificacion enum
 */
const enviarNotificacion = async (usuarioId, titulo, mensaje, tipo) => {
  // Guardar siempre en BD (historial)
  await prisma.notificacion.create({
    data: { usuarioId, titulo, mensaje, tipo },
  })

  // Obtener token FCM del dispositivo
  const usuario = await prisma.usuario.findUnique({
    where: { id: usuarioId },
    select: { fcmToken: true },
  })

  if (!usuario?.fcmToken) return  // sin token = sin push, pero la notificación queda en BD

  try {
    await admin.messaging().send({
      token: usuario.fcmToken,
      notification: { title: titulo, body: mensaje },
    })
  } catch (err) {
    console.error('Error FCM:', err.message)
  }
}

module.exports = { enviarNotificacion }
