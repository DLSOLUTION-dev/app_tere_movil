const prisma = require('../config/database')
const { ok, creado, error } = require('../utils/respuesta')
const { enviarNotificacion } = require('../utils/notificaciones')

// POST /api/citas  — cliente solicita una cita
const solicitarCita = async (req, res) => {
  try {
    const { servicioId, fechaHora, notas } = req.body
    const clienteId = req.usuario.id

    const fecha = new Date(fechaHora)

    const servicio = await prisma.servicio.findUnique({
      where: { id: servicioId },
      select: { duracionMin: true, nombre: true }
    })
    if (!servicio) return error(res, 'Servicio no encontrado', 404)

    // Buscar al admin/estilista automáticamente — no depender del frontend
    const admin = await prisma.usuario.findFirst({ where: { rol: 'ADMIN', activo: true } })
    if (!admin) return error(res, 'No hay estilista disponible', 503)
    const estilistaId = admin.id

    const nuevaFin = new Date(fecha.getTime() + servicio.duracionMin * 60000)

    // Límites del día en ECT (UTC-5) para buscar conflictos
    const fechaECT = new Date(fecha.getTime() - 5 * 3600000)
    const dateStr = fechaECT.toISOString().split('T')[0]
    const inicioDia = new Date(`${dateStr}T05:00:00.000Z`)
    const finDia   = new Date(inicioDia.getTime() + 24 * 60 * 60 * 1000 - 1)

    let cita
    try {
      cita = await prisma.$transaction(async (tx) => {
        const citasDelDia = await tx.cita.findMany({
          where: {
            estilistaId,
            estado: { in: ['PENDIENTE', 'APROBADA'] },
            fechaHora: { gte: inicioDia, lte: finDia }
          },
          include: { servicio: { select: { duracionMin: true } } }
        })

        const hayConflicto = citasDelDia.some(c => {
          const existStart = new Date(c.fechaHora).getTime()
          const existEnd   = existStart + c.servicio.duracionMin * 60000
          return fecha.getTime() < existEnd && nuevaFin.getTime() > existStart
        })

        if (hayConflicto) {
          const err = new Error('Ese horario se cruza con una cita existente. Por favor elige otro.')
          err.code = 'SLOT_OCUPADO'
          throw err
        }

        return tx.cita.create({
          data: { clienteId, servicioId, estilistaId, fechaHora: fecha, notas },
          include: { servicio: true },
        })
      }, { isolationLevel: 'Serializable' })
    } catch (txErr) {
      if (txErr.code === 'SLOT_OCUPADO') return error(res, txErr.message, 409)
      throw txErr
    }

    await enviarNotificacion(
      admin.id,
      'Nueva solicitud de cita',
      `${req.usuario.nombre} solicitó una cita para ${cita.servicio.nombre}`,
      'CONFIRMACION'
    )

    return creado(res, cita)
  } catch (e) {
    console.error(e)
    return error(res, 'Error al solicitar cita')
  }
}

// GET /api/citas  — admin ve todas; cliente ve las suyas
const listarCitas = async (req, res) => {
  try {
    const { rol, id } = req.usuario
    const where = rol === 'ADMIN' ? {} : { clienteId: id }

    const citas = await prisma.cita.findMany({
      where,
      include: {
        cliente: { select: { nombre: true, apellido: true, telefono: true } },
        servicio: { select: { nombre: true, duracionMin: true } },
      },
      orderBy: { fechaHora: 'asc' },
    })

    return ok(res, citas)
  } catch (e) {
    console.error(e)
    return error(res, 'Error al obtener citas')
  }
}

// PATCH /api/citas/:id/estado  — admin aprueba, rechaza o completa
const cambiarEstado = async (req, res) => {
  try {
    const { id } = req.params
    const { estado, pago, motivoCancelacion } = req.body

    if (estado === 'APROBADA') {
      let cita
      try {
        cita = await prisma.$transaction(async (tx) => {
          const citaAprobar = await tx.cita.findUnique({
            where: { id },
            include: { servicio: true }
          })
          if (!citaAprobar) {
            const err = new Error('Cita no encontrada')
            err.code = 'NOT_FOUND'
            throw err
          }

          const nuevaStart = new Date(citaAprobar.fechaHora).getTime()
          const nuevaFin   = nuevaStart + citaAprobar.servicio.duracionMin * 60000

          const fechaECT = new Date(nuevaStart - 5 * 3600000)
          const dateStr  = fechaECT.toISOString().split('T')[0]
          const inicioDia = new Date(`${dateStr}T05:00:00.000Z`)
          const finDia    = new Date(inicioDia.getTime() + 24 * 60 * 60 * 1000 - 1)

          const citasDelDia = await tx.cita.findMany({
            where: {
              id: { not: id },
              estilistaId: citaAprobar.estilistaId,
              estado: 'APROBADA',
              fechaHora: { gte: inicioDia, lte: finDia }
            },
            include: { servicio: { select: { duracionMin: true } } }
          })

          const hayConflicto = citasDelDia.some(c => {
            const existStart = new Date(c.fechaHora).getTime()
            const existEnd   = existStart + c.servicio.duracionMin * 60000
            return nuevaStart < existEnd && nuevaFin > existStart
          })

          if (hayConflicto) {
            const err = new Error('El horario de esta cita se cruza con una cita ya aprobada')
            err.code = 'CONFLICTO'
            throw err
          }

          return tx.cita.update({
            where: { id },
            data: { estado: 'APROBADA' },
            include: { cliente: true, servicio: true },
          })
        }, { isolationLevel: 'Serializable' })
      } catch (txErr) {
        if (txErr.code === 'NOT_FOUND') return error(res, txErr.message, 404)
        if (txErr.code === 'CONFLICTO') return error(res, txErr.message, 409)
        throw txErr
      }

      await enviarNotificacion(
        cita.clienteId,
        'Actualización de tu cita',
        `Tu cita de ${cita.servicio.nombre} fue confirmada ✅`,
        'CONFIRMACION'
      )
      return ok(res, cita)
    }

    // Si está completando, generar factura automáticamente
    if (estado === 'COMPLETADA') {
      if (!pago?.subtotal || !pago?.metodoPago) {
        return error(res, 'Para completar una cita debes registrar el pago', 400)
      }

      let resultado
      try {
        resultado = await prisma.$transaction(async (tx) => {
          const cita = await tx.cita.findUnique({
            where: { id },
            include: { servicio: true }
          })
          if (!cita) {
            const err = new Error('Cita no encontrada')
            err.code = 'NOT_FOUND'
            throw err
          }

          const facturaExistente = await tx.factura.findUnique({ where: { citaId: id } })
          if (facturaExistente) {
            const err = new Error('Esta cita ya tiene una factura generada')
            err.code = 'FACTURA_EXISTENTE'
            throw err
          }

          const sub = parseFloat(pago.subtotal)
          const iva = 0
          const total = sub

          const totalFacturas = await tx.factura.count()
          const anio = new Date().getFullYear()
          const numeroFactura = `FAC-${anio}-${String(totalFacturas + 1).padStart(4, '0')}`

          await tx.cita.update({ where: { id }, data: { estado: 'COMPLETADA' } })

          const factura = await tx.factura.create({
            data: {
              citaId: id,
              clienteId: cita.clienteId,
              numeroFactura,
              subtotal: sub,
              iva,
              total,
              metodoPago: pago.metodoPago,
              estadoPago: 'PAGADO',
            }
          })

          await tx.movimientoCaja.create({
            data: {
              tipo: 'INGRESO',
              monto: total,
              descripcion: `Factura ${numeroFactura} - ${cita.servicio.nombre}`,
              facturaId: factura.id,
            }
          })

          return { clienteId: cita.clienteId, servicio: cita.servicio }
        }, { isolationLevel: 'Serializable' })
      } catch (txErr) {
        if (txErr.code === 'NOT_FOUND') return error(res, txErr.message, 404)
        if (txErr.code === 'FACTURA_EXISTENTE') return error(res, txErr.message, 400)
        if (txErr.code === 'P2002') return error(res, 'Error al generar número de factura, intente nuevamente', 409)
        throw txErr
      }

      await enviarNotificacion(
        resultado.clienteId,
        'Cita completada',
        `Tu cita de ${resultado.servicio.nombre} ha sido completada. ¡Gracias por tu visita!`,
        'CONFIRMACION'
      )

      const citaActualizada = await prisma.cita.findUnique({
        where: { id },
        include: { cliente: true, servicio: true, factura: true }
      })
      return ok(res, citaActualizada)
    }

    // Para RECHAZADA y CANCELADA
    const motivo = motivoCancelacion?.trim() || null
    const cita = await prisma.cita.update({
      where: { id },
      data: { estado, motivoCancelacion: motivo },
      include: { cliente: true, servicio: true },
    })

    const mensajes = {
      RECHAZADA: motivo
        ? `Tu cita de ${cita.servicio.nombre} no pudo ser confirmada ❌\nMotivo: ${motivo}`
        : `Tu cita de ${cita.servicio.nombre} no pudo ser confirmada ❌`,
      CANCELADA: motivo
        ? `Tu cita de ${cita.servicio.nombre} fue cancelada\nMotivo: ${motivo}`
        : `Tu cita de ${cita.servicio.nombre} fue cancelada`,
    }

    await enviarNotificacion(
      cita.clienteId,
      'Actualización de tu cita',
      mensajes[estado] || 'Tu cita fue actualizada',
      'CANCELACION'
    )

    return ok(res, cita)
  } catch (e) {
    console.error(e)
    return error(res, 'Error al actualizar estado de cita')
  }
}

// DELETE /api/citas/:id  — cliente cancela su cita (min 24h antes)
// Ownership ya verificada por rls.middleware → req.cita disponible
const cancelarCita = async (req, res) => {
  try {
    const { id } = req.params
    const cita = req.cita  // cargada y verificada por verificarPropietarioCita

    if (!['PENDIENTE', 'APROBADA'].includes(cita.estado)) {
      return error(res, 'Solo puedes cancelar citas pendientes o aprobadas', 400)
    }

    // Verificar límite de 3 horas antes
    const horasRestantes = (new Date(cita.fechaHora) - new Date()) / 36e5
    if (horasRestantes < 3) {
      return error(res, 'Solo puedes cancelar con al menos 3 horas de anticipación', 400)
    }

    await prisma.cita.update({
      where: { id },
      data: { estado: 'CANCELADA' }
    })

    // Notificar al admin
    const admin = await prisma.usuario.findFirst({ where: { rol: 'ADMIN' } })
    if (admin) {
      await enviarNotificacion(
        admin.id,
        'Cita cancelada por cliente',
        `${req.usuario.nombre} canceló su cita de ${cita.servicio.nombre} del ${new Date(cita.fechaHora).toLocaleString('es-EC', { dateStyle: 'medium', timeStyle: 'short' })}`,
        'CANCELACION'
      )
    }

    // Buscar otros clientes con citas rechazadas o pendientes
    // en el mismo día para notificarles que hay un horario libre
    const inicioDia = new Date(cita.fechaHora)
    inicioDia.setHours(0, 0, 0, 0)
    const finDia = new Date(cita.fechaHora)
    finDia.setHours(23, 59, 59, 999)

    const citasInteresadas = await prisma.cita.findMany({
      where: {
        id: { not: id },
        estado: { in: ['PENDIENTE', 'RECHAZADA'] },
        fechaHora: { gte: inicioDia, lte: finDia },
      },
      select: { clienteId: true },
      distinct: ['clienteId']
    })

    const horaLibre = new Date(cita.fechaHora).toLocaleTimeString('es-EC', {
      hour: '2-digit', minute: '2-digit'
    })
    const fechaLibre = new Date(cita.fechaHora).toLocaleDateString('es-EC', {
      dateStyle: 'medium'
    })

    await Promise.all(citasInteresadas.map(c =>
      enviarNotificacion(
        c.clienteId,
        '¡Horario disponible!',
        `Se liberó el horario de las ${horaLibre} del ${fechaLibre}. ¡Puedes agendarlo!`,
        'RECORDATORIO'
      )
    ))

    return ok(res, { mensaje: 'Cita cancelada exitosamente' })
  } catch (e) {
    console.error(e)
    return error(res, 'Error al cancelar cita')
  }
}
// GET /api/citas/historial — citas completadas del cliente autenticado
const historial = async (req, res) => {
  try {
    const citas = await prisma.cita.findMany({
      where: {
        clienteId: req.usuario.id,
        estado: 'COMPLETADA',
      },
      include: {
        servicio: { select: { nombre: true, duracionMin: true } },
        factura: { select: { total: true, metodoPago: true, numeroFactura: true } },
      },
      orderBy: { fechaHora: 'desc' },
    })
    return ok(res, citas)
  } catch (e) {
    console.error(e)
    return error(res, 'Error al obtener historial')
  }
}

// GET /api/citas/horas-ocupadas?fecha=2026-04-17&servicioId=xxx
const horasOcupadas = async (req, res) => {
  try {
    const { fecha, servicioId } = req.query
    if (!fecha) return error(res, 'Fecha requerida', 400)

    const inicioDia = new Date(`${fecha}T05:00:00.000Z`)
    const finDia    = new Date(inicioDia.getTime() + 24 * 60 * 60 * 1000 - 1)

    const citas = await prisma.cita.findMany({
      where: {
        estado: { in: ['PENDIENTE', 'APROBADA'] },
        fechaHora: { gte: inicioDia, lte: finDia }
      },
      include: { servicio: { select: { duracionMin: true } } }
    })

    // Duración del servicio que se quiere agendar (para bloquear correctamente)
    let nuevaDuracionMs = 30 * 60000 // default: slot mínimo 30 min
    if (servicioId) {
      const svc = await prisma.servicio.findUnique({
        where: { id: servicioId },
        select: { duracionMin: true }
      })
      if (svc) nuevaDuracionMs = svc.duracionMin * 60000
    }

    const SLOT_MS = 30 * 60000
    const slotsOcupados = new Set()

    for (const cita of citas) {
      const existStart = new Date(cita.fechaHora).getTime()
      const existEnd   = existStart + cita.servicio.duracionMin * 60000

      // Bloquear todos los slots T (alineados a 30 min) donde T + nuevaDuracion solapa [existStart, existEnd)
      // Condición: T < existEnd  &&  T + nuevaDuracion > existStart
      // → T ∈ (existStart − nuevaDuracion, existEnd)
      const rangeStart = Math.ceil((existStart - nuevaDuracionMs + 1) / SLOT_MS) * SLOT_MS

      for (let t = rangeStart; t < existEnd; t += SLOT_MS) {
        const horaECT = new Date(t - 5 * 3600000)
        const h = String(horaECT.getUTCHours()).padStart(2, '0')
        const m = String(horaECT.getUTCMinutes()).padStart(2, '0')
        slotsOcupados.add(`${h}:${m}`)
      }
    }

    return ok(res, Array.from(slotsOcupados))
  } catch (e) {
    console.error(e)
    return error(res, 'Error al obtener horas ocupadas')
  }
}


module.exports = { solicitarCita, listarCitas, cambiarEstado, cancelarCita, historial, horasOcupadas }
