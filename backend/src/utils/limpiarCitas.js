const prisma = require('../config/database')
const { enviarNotificacion } = require('./notificaciones')

const expirarCitasPendientes = async () => {
  try {
    const ahora = new Date()

    const pendientesVencidas = await prisma.cita.findMany({
      where: {
        estado: 'PENDIENTE',
        fechaHora: { lt: ahora },
      },
      include: {
        servicio: { select: { nombre: true } },
      },
    })

    if (pendientesVencidas.length === 0) return

    const ids = pendientesVencidas.map((c) => c.id)
    await prisma.cita.updateMany({
      where: { id: { in: ids } },
      data: { estado: 'RECHAZADA' },
    })

    for (const cita of pendientesVencidas) {
      await enviarNotificacion(
        cita.clienteId,
        'Cita no confirmada',
        `Tu cita de ${cita.servicio.nombre} no fue confirmada a tiempo y expiró automáticamente.`,
        'CANCELACION'
      )
    }

    console.log(`⏰ ${pendientesVencidas.length} citas pendientes vencidas rechazadas automáticamente`)
  } catch (e) {
    console.error('Error al expirar citas pendientes:', e.message)
  }
}

const limpiarCitasAntiguas = async () => {
  try {
    const hace7Dias = new Date()
    hace7Dias.setDate(hace7Dias.getDate() - 7)

    const citas = await prisma.cita.findMany({
      where: {
        estado: { in: ['COMPLETADA', 'CANCELADA', 'RECHAZADA'] },
        updatedAt: { lte: hace7Dias },
      },
      select: { id: true },
    })

    if (citas.length === 0) return

    const ids = citas.map((c) => c.id)

    await prisma.$transaction(async (tx) => {
      const facturas = await tx.factura.findMany({
        where: { citaId: { in: ids } },
        select: { id: true },
      })
      const facturaIds = facturas.map((f) => f.id)

      if (facturaIds.length > 0) {
        await tx.movimientoCaja.updateMany({
          where: { facturaId: { in: facturaIds } },
          data: { facturaId: null },
        })
      }

      await tx.factura.deleteMany({ where: { citaId: { in: ids } } })
      await tx.cita.deleteMany({ where: { id: { in: ids } } })
    })

    console.log(`🧹 ${citas.length} citas antiguas eliminadas`)
  } catch (e) {
    console.error('Error al limpiar citas antiguas:', e.message)
  }
}

const ejecutarMantenimiento = async () => {
  await expirarCitasPendientes()
  await limpiarCitasAntiguas()
}

module.exports = { limpiarCitasAntiguas: ejecutarMantenimiento }
