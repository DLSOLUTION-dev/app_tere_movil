const prisma = require('../config/database')
const { error } = require('../utils/respuesta')

// RLS – Row Level Security a nivel de aplicación.
// Cada función carga el recurso y verifica que pertenece al usuario autenticado.
// Si la verificación pasa, adjunta el recurso en req para que el controller
// no necesite hacer una segunda consulta a la BD.
// En caso de fallo devuelve 404 (no 403) para no revelar la existencia del recurso.

const verificarPropietarioCita = async (req, res, next) => {
  try {
    const cita = await prisma.cita.findUnique({
      where: { id: req.params.id },
      include: { servicio: true },
    })

    if (!cita || cita.clienteId !== req.usuario.id) {
      return error(res, 'Cita no encontrada', 404)
    }

    req.cita = cita
    next()
  } catch (e) {
    console.error('RLS verificarPropietarioCita:', e)
    return error(res, 'Error interno', 500)
  }
}

module.exports = { verificarPropietarioCita }
