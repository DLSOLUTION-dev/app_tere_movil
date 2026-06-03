const { ok, creado, error } = require('../utils/respuesta')
const prisma = require('../config/database')
const { subirImagen, eliminarImagen } = require('../utils/storage')

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

    const [antesUrl, despuesUrl] = await Promise.all([
      subirImagen(antesBase64),
      subirImagen(despuesBase64),
    ])

    const trabajo = await prisma.trabajoRealizado.create({
      data: { titulo, descripcion, antesUrl, despuesUrl },
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

    const actual = await prisma.trabajoRealizado.findUnique({ where: { id } })
    if (!actual) return error(res, 'Trabajo no encontrado', 404)

    const data = {}
    if (titulo !== undefined)      data.titulo      = titulo
    if (descripcion !== undefined) data.descripcion = descripcion

    // Subir nuevas imágenes en paralelo solo si se enviaron
    const subidas = await Promise.all([
      antesBase64   ? subirImagen(antesBase64)   : null,
      despuesBase64 ? subirImagen(despuesBase64) : null,
    ])

    if (subidas[0]) {
      data.antesUrl = subidas[0]
      eliminarImagen(actual.antesUrl)
    }
    if (subidas[1]) {
      data.despuesUrl = subidas[1]
      eliminarImagen(actual.despuesUrl)
    }

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
    const trabajo = await prisma.trabajoRealizado.findUnique({ where: { id } })
    if (!trabajo) return error(res, 'Trabajo no encontrado', 404)

    await prisma.trabajoRealizado.delete({ where: { id } })

    // Eliminar archivos de Storage (no bloquea la respuesta)
    eliminarImagen(trabajo.antesUrl)
    eliminarImagen(trabajo.despuesUrl)

    return ok(res, { mensaje: 'Trabajo eliminado' })
  } catch (e) {
    console.error('Error al eliminar trabajo:', e)
    return error(res, 'Error al eliminar trabajo')
  }
}

module.exports = { listar, crear, actualizar, eliminar }
