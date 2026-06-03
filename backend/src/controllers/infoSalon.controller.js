const { ok, error } = require('../utils/respuesta')
const prisma = require('../config/database')

const HORARIOS_DEFAULT = {
  diasTrabajo: [2, 3, 4, 5, 6],
  manaInicio:  '09:00',
  manaFin:     '13:00',
  tardeInicio: '15:00',
  tardeFin:    '19:00',
}

const obtener = async (req, res) => {
  try {
    let info = await prisma.infoSalon.findFirst()
    if (!info) {
      info = await prisma.infoSalon.create({ data: { horarios: HORARIOS_DEFAULT } })
    }
    if (!info.horarios) {
      info = await prisma.infoSalon.update({
        where: { id: info.id },
        data: { horarios: HORARIOS_DEFAULT },
      })
    }
    return ok(res, info)
  } catch (e) {
    console.error('Error al obtener info salon:', e)
    return error(res, 'Error al obtener información del salón')
  }
}

const actualizar = async (req, res) => {
  try {
    const { vision, mision, contacto, horarios } = req.body
    const data = { vision, mision, contacto }
    if (horarios !== undefined) data.horarios = horarios

    let info = await prisma.infoSalon.findFirst()
    if (!info) {
      info = await prisma.infoSalon.create({ data })
    } else {
      info = await prisma.infoSalon.update({ where: { id: info.id }, data })
    }
    return ok(res, info)
  } catch (e) {
    console.error('Error al actualizar info salon:', e)
    return error(res, 'Error al actualizar información del salón')
  }
}

module.exports = { obtener, actualizar }
