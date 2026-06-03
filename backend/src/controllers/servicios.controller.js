const prisma = require('../config/database')
const { ok, creado, error } = require('../utils/respuesta')

const listar = async (req, res) => {
  try {
    const servicios = await prisma.servicio.findMany({
      where: { activo: true },
      orderBy: { nombre: 'asc' },
    })
    return ok(res, servicios)
  } catch (e) {
    console.error(e)
    return error(res, 'Error al obtener servicios')
  }
}

const crear = async (req, res) => {
  try {
    const { nombre, descripcion, duracionMin } = req.body
    const servicio = await prisma.servicio.create({
      data: { nombre, descripcion, duracionMin: parseInt(duracionMin) },
    })
    return creado(res, servicio)
  } catch (e) {
    console.error(e)
    return error(res, 'Error al crear servicio')
  }
}

const actualizar = async (req, res) => {
  try {
    const { nombre, descripcion, duracionMin, activo } = req.body
    const data = {}
    if (nombre !== undefined) data.nombre = nombre
    if (descripcion !== undefined) data.descripcion = descripcion
    if (duracionMin !== undefined) data.duracionMin = parseInt(duracionMin)
    if (activo !== undefined) data.activo = Boolean(activo)

    const servicio = await prisma.servicio.update({
      where: { id: req.params.id },
      data,
    })
    return ok(res, servicio)
  } catch (e) {
    console.error(e)
    return error(res, 'Error al actualizar servicio')
  }
}

module.exports = { listar, crear, actualizar }
