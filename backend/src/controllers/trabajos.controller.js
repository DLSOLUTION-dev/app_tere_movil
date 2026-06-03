const { ok, creado, error } = require('../utils/respuesta')
const prisma = require('../config/database')

const listar = async (req, res) => {
  try {
    const trabajos = await prisma.trabajoRealizado.findMany({
      orderBy: { createdAt: 'desc' },
    })
    return ok(res, trabajos)
  } catch (e) {
    console.error('Error al listar trabajos:', e)
    return error(res, 'Error al obtener trabajos')
  }
}

const crear = async (req, res) => {
  try {
    const { titulo, descripcion, antesBase64, despuesBase64 } = req.body
    if (!titulo || !antesBase64 || !despuesBase64) {
      return error(res, 'Título e imágenes son requeridos', 400)
    }
    const trabajo = await prisma.trabajoRealizado.create({
      data: { titulo, descripcion, antesBase64, despuesBase64 },
    })
    return creado(res, trabajo)
  } catch (e) {
    console.error('Error al crear trabajo:', e)
    return error(res, 'Error al crear trabajo')
  }
}

const actualizar = async (req, res) => {
  try {
    const { id } = req.params
    const { titulo, descripcion, antesBase64, despuesBase64 } = req.body
    const data = {}
    if (titulo !== undefined)       data.titulo       = titulo
    if (descripcion !== undefined)  data.descripcion  = descripcion
    if (antesBase64)                data.antesBase64  = antesBase64
    if (despuesBase64)              data.despuesBase64 = despuesBase64

    const trabajo = await prisma.trabajoRealizado.update({ where: { id }, data })
    return ok(res, trabajo)
  } catch (e) {
    console.error('Error al actualizar trabajo:', e)
    return error(res, 'Error al actualizar trabajo')
  }
}

const eliminar = async (req, res) => {
  try {
    const { id } = req.params
    await prisma.trabajoRealizado.delete({ where: { id } })
    return ok(res, { mensaje: 'Trabajo eliminado' })
  } catch (e) {
    console.error('Error al eliminar trabajo:', e)
    return error(res, 'Error al eliminar trabajo')
  }
}

module.exports = { listar, crear, actualizar, eliminar }
