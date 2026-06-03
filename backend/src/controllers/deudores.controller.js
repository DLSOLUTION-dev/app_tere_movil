const prisma = require('../config/database')
const { ok, creado, error } = require('../utils/respuesta')

const listar = async (req, res) => {
  try {
    const deudas = await prisma.deudor.findMany({
      where: { pagado: false },
      include: { cliente: { select: { nombre: true, apellido: true, telefono: true } } },
      orderBy: { fechaDeuda: 'asc' },
    })
    return ok(res, deudas)
  } catch (e) {
    console.error('Error al obtener deudores:', e)
    return error(res, 'Error al obtener deudores')
  }
}

const crear = async (req, res) => {
  try {
    const { clienteId, monto, descripcion } = req.body
    const deuda = await prisma.deudor.create({
      data: { clienteId, monto: parseFloat(monto), descripcion },
    })
    return creado(res, deuda)
  } catch (e) {
    console.error('Error al registrar deuda:', e)
    return error(res, 'Error al registrar deuda')
  }
}

const marcarPagado = async (req, res) => {
  try {
    const deuda = await prisma.deudor.update({
      where: { id: req.params.id },
      data: { pagado: true, fechaPago: new Date() },
    })
    return ok(res, deuda)
  } catch (e) {
    console.error('Error al marcar deuda como pagada:', e)
    return error(res, 'Error al marcar deuda como pagada')
  }
}

module.exports = { listar, crear, marcarPagado }
