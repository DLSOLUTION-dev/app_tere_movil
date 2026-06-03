const prisma = require('../config/database')
const { ok, creado, error } = require('../utils/respuesta')

// GET /api/fichas/mias — cliente ve sus propias fichas (sin fórmula)
const listarMisFichas = async (req, res) => {
    try {
        const fichas = await prisma.fichaCliente.findMany({
            where: { clienteId: req.usuario.id },
            orderBy: { fecha: 'desc' },
            select: {
                id: true,
                tipoCabello: true,
                colorActual: true,
                observaciones: true,
                fecha: true,
            },
        })
        return ok(res, fichas)
    } catch (e) {
        console.error('Error al obtener fichas:', e)
        return error(res, 'Error al obtener fichas')
    }
}

// GET /api/fichas/:clienteId — historial de fichas de un cliente
const listarPorCliente = async (req, res) => {
    try {
        const fichas = await prisma.fichaCliente.findMany({
            where: { clienteId: req.params.clienteId },
            orderBy: { fecha: 'desc' },
        })
        return ok(res, fichas)
    } catch (e) {
        console.error('Error al obtener fichas:', e)
        return error(res, 'Error al obtener fichas')
    }
}

// POST /api/fichas — admin crea una ficha nueva
const crear = async (req, res) => {
    try {
        const { clienteId, tipoCabello, colorActual, formulaUsada, observaciones } = req.body

        const ficha = await prisma.fichaCliente.create({
            data: { clienteId, tipoCabello, colorActual, formulaUsada, observaciones },
        })
        return creado(res, ficha)
    } catch (e) {
        console.error('Error al crear ficha:', e)
        return error(res, 'Error al crear ficha')
    }
}

// PUT /api/fichas/:id — admin edita una ficha existente
const actualizar = async (req, res) => {
    try {
        const { tipoCabello, colorActual, formulaUsada, observaciones } = req.body
        const data = {}
        if (tipoCabello !== undefined) data.tipoCabello = tipoCabello
        if (colorActual !== undefined) data.colorActual = colorActual
        if (formulaUsada !== undefined) data.formulaUsada = formulaUsada
        if (observaciones !== undefined) data.observaciones = observaciones

        const ficha = await prisma.fichaCliente.update({
            where: { id: req.params.id },
            data,
        })
        return ok(res, ficha)
    } catch (e) {
        console.error('Error al actualizar ficha:', e)
        return error(res, 'Error al actualizar ficha')
    }
}

// DELETE /api/fichas/:id — admin elimina una ficha
const eliminar = async (req, res) => {
    try {
        await prisma.fichaCliente.delete({ where: { id: req.params.id } })
        return ok(res, { mensaje: 'Ficha eliminada' })
    } catch (e) {
        console.error('Error al eliminar ficha:', e)
        return error(res, 'Error al eliminar ficha')
    }
}

module.exports = { listarMisFichas, listarPorCliente, crear, actualizar, eliminar }