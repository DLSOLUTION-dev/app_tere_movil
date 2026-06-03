const prisma = require('../config/database')
const { ok, error } = require('../utils/respuesta')

// GET /api/clientes  — lista de todos los clientes
const listar = async (req, res) => {
  try {
    const clientes = await prisma.usuario.findMany({
      where: { rol: 'CLIENTE', activo: true },
      select: {
        id: true, nombre: true, apellido: true,
        email: true, telefono: true, createdAt: true,
        _count: { select: { citasComoCliente: true } },
      },
      orderBy: { nombre: 'asc' },
    })
    return ok(res, clientes)
  } catch (e) {
    console.error('Error al obtener clientes:', e)
    return error(res, 'Error al obtener clientes', 500)
  }
}

// GET /api/clientes/:id  — detalle completo: citas, fichas, deudas
const detalle = async (req, res) => {
  try {
    const cliente = await prisma.usuario.findUnique({
      where: { id: req.params.id },
      select: {
        id: true, nombre: true, apellido: true, email: true, telefono: true,
        citasComoCliente: {
          include: { servicio: true },
          orderBy: { fechaHora: 'desc' },
          take: 10,
        },
        fichas: { orderBy: { fecha: 'desc' } },
        deudas: { where: { pagado: false } },
      },
    })
    if (!cliente) return error(res, 'Cliente no encontrado', 404)
    return ok(res, cliente)
  } catch (e) {
    console.error('Error al obtener cliente:', e)
    return error(res, 'Error al obtener cliente', 500)
  }
}

// PATCH /api/clientes/:id/rol — admin cambia el rol de un usuario
const cambiarRol = async (req, res) => {
  try {
    const { rol } = req.body
    if (!['ADMIN', 'CLIENTE'].includes(rol)) {
      return error(res, 'Rol inválido', 400)
    }
    // No permitir que el admin se quite su propio rol
    if (req.params.id === req.usuario.id) {
      return error(res, 'No puedes cambiar tu propio rol', 400)
    }
    const usuario = await prisma.usuario.update({
      where: { id: req.params.id },
      data: { rol },
      select: { id: true, nombre: true, apellido: true, email: true, rol: true },
    })
    return ok(res, usuario)
  } catch (e) {
    console.error('Error al cambiar rol:', e)
    return error(res, 'Error al cambiar rol', 500)
  }
}

module.exports = { listar, detalle, cambiarRol }
