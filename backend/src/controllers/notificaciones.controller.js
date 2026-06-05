const { ok, error } = require('../utils/respuesta')
const prisma = require('../config/database')

const listar = async (req, res) => {
  try {
    const notificaciones = await prisma.notificacion.findMany({
      where: { usuarioId: req.usuario.id },
      orderBy: { enviadaAt: 'desc' },
      take: 50,
    })
    return ok(res, notificaciones)
  } catch (e) {
    console.error('Error al listar notificaciones:', e)
    return error(res, 'Error al obtener notificaciones')
  }
}

const marcarLeida = async (req, res) => {
  try {
    const { id } = req.params
    const notif = await prisma.notificacion.findUnique({ where: { id } })
    if (!notif || notif.usuarioId !== req.usuario.id) {
      return error(res, 'Notificación no encontrada', 404)
    }
    await prisma.notificacion.update({ where: { id }, data: { leida: true } })
    return ok(res, { mensaje: 'Marcada como leída' })
  } catch (e) {
    console.error('Error al marcar notificación:', e)
    return error(res, 'Error al actualizar notificación')
  }
}

const marcarTodasLeidas = async (req, res) => {
  try {
    await prisma.notificacion.updateMany({
      where: { usuarioId: req.usuario.id, leida: false },
      data: { leida: true },
    })
    return ok(res, { mensaje: 'Todas marcadas como leídas' })
  } catch (e) {
    console.error('Error al marcar todas:', e)
    return error(res, 'Error al actualizar notificaciones')
  }
}

module.exports = { listar, marcarLeida, marcarTodasLeidas }
