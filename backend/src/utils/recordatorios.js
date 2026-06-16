const prisma = require('../config/database')
const { enviarNotificacion } = require('./notificaciones')

const enviarRecordatorios = async () => {
  try {
    const ahora = new Date()

    // Ventana: citas entre 23h y 25h desde ahora (para correr cada hora sin duplicar)
    const en23h = new Date(ahora.getTime() + 23 * 3600000)
    const en25h = new Date(ahora.getTime() + 25 * 3600000)

    const citasProximas = await prisma.cita.findMany({
      where: {
        estado: 'APROBADA',
        fechaHora: { gte: en23h, lte: en25h },
      },
      include: {
        servicio: { select: { nombre: true } },
      },
    })

    for (const cita of citasProximas) {
      const hora = new Date(cita.fechaHora).toLocaleTimeString('es-EC', {
        hour: '2-digit',
        minute: '2-digit',
      })
      const fecha = new Date(cita.fechaHora).toLocaleDateString('es-EC', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
      })

      await enviarNotificacion(
        cita.clienteId,
        '⏰ Recordatorio de cita',
        `Mañana tienes tu cita de ${cita.servicio.nombre} a las ${hora} (${fecha}). ¡Te esperamos!`,
        'RECORDATORIO',
        '/(client)/inicio'
      )
    }

    if (citasProximas.length > 0) {
      console.log(`🔔 ${citasProximas.length} recordatorios enviados`)
    }
  } catch (e) {
    console.error('Error al enviar recordatorios:', e.message)
  }
}

module.exports = { enviarRecordatorios }
