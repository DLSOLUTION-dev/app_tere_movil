const prisma = require('../config/database')
const { ok, creado, error } = require('../utils/respuesta')

// GET /api/caja — lista todos los movimientos
const listar = async (req, res) => {
    try {
        const movimientos = await prisma.movimientoCaja.findMany({
            include: {
                factura: {
                    select: {
                        numeroFactura: true,
                        cliente: { select: { nombre: true, apellido: true } },
                    },
                },
            },
            orderBy: { fecha: 'desc' },
        })
        return ok(res, movimientos)
    } catch (e) {
        console.error(e)
        return error(res, 'Error al obtener movimientos')
    }
}

// GET /api/caja/resumen — total ingresos, egresos y balance
const resumen = async (req, res) => {
    try {
        const ingresos = await prisma.movimientoCaja.aggregate({
            where: { tipo: 'INGRESO' },
            _sum: { monto: true },
        })

        const egresos = await prisma.movimientoCaja.aggregate({
            where: { tipo: 'EGRESO' },
            _sum: { monto: true },
        })

        const totalIngresos = Number(ingresos._sum.monto || 0)
        const totalEgresos = Number(egresos._sum.monto || 0)

        return ok(res, {
            totalIngresos,
            totalEgresos,
            balance: totalIngresos - totalEgresos,
        })
    } catch (e) {
        console.error(e)
        return error(res, 'Error al obtener resumen')
    }
}

// POST /api/caja — admin registra un egreso manual (compra de productos, etc.)
const registrarEgreso = async (req, res) => {
    try {
        const { monto, descripcion } = req.body

        if (!monto || !descripcion) {
            return error(res, 'Monto y descripción son requeridos', 400)
        }

        const movimiento = await prisma.movimientoCaja.create({
            data: {
                tipo: 'EGRESO',
                monto: parseFloat(monto),
                descripcion,
            },
        })
        return creado(res, movimiento)
    } catch (e) {
        console.error(e)
        return error(res, 'Error al registrar egreso')
    }
}
// PUT /api/caja/:id — editar un movimiento manual
const editar = async (req, res) => {
    try {
        const { monto, descripcion } = req.body

        const movimiento = await prisma.movimientoCaja.findUnique({
            where: { id: req.params.id }
        })

        if (!movimiento) return error(res, 'Movimiento no encontrado', 404)

        // Solo se pueden editar movimientos manuales (sin factura)
        if (movimiento.facturaId) {
            return error(res, 'No se puede editar un movimiento generado por una factura', 400)
        }

        const actualizado = await prisma.movimientoCaja.update({
            where: { id: req.params.id },
            data: {
                monto: parseFloat(monto),
                descripcion,
            }
        })
        return ok(res, actualizado)
    } catch (e) {
        console.error(e)
        return error(res, 'Error al editar movimiento')
    }
}

// DELETE /api/caja/:id — eliminar un egreso manual
const eliminar = async (req, res) => {
    try {
        const movimiento = await prisma.movimientoCaja.findUnique({
            where: { id: req.params.id }
        })

        if (!movimiento) return error(res, 'Movimiento no encontrado', 404)

        if (movimiento.facturaId) {
            return error(res, 'No se puede eliminar un movimiento generado por una factura', 400)
        }

        await prisma.movimientoCaja.delete({ where: { id: req.params.id } })
        return ok(res, { mensaje: 'Movimiento eliminado' })
    } catch (e) {
        console.error(e)
        return error(res, 'Error al eliminar movimiento')
    }
}
// GET /api/caja/resumen-semana
const resumenSemana = async (req, res) => {
    try {
        const hoy = new Date()
        const diaSem = hoy.getDay() === 0 ? 6 : hoy.getDay() - 1
        const lunes = new Date(hoy)
        lunes.setDate(hoy.getDate() - diaSem)
        lunes.setHours(0, 0, 0, 0)
        const domingo = new Date(lunes)
        domingo.setDate(lunes.getDate() + 6)
        domingo.setHours(23, 59, 59, 999)

        // Total ingresos de la semana
        const ingresos = await prisma.movimientoCaja.aggregate({
            where: {
                tipo: 'INGRESO',
                fecha: { gte: lunes, lte: domingo }
            },
            _sum: { monto: true },
            _count: { id: true }
        })

        // Desglose por día
        const DIAS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo']
        const porDia = []

        for (let i = 0; i < 7; i++) {
            const inicioDia = new Date(lunes)
            inicioDia.setDate(lunes.getDate() + i)
            inicioDia.setHours(0, 0, 0, 0)
            const finDia = new Date(inicioDia)
            finDia.setHours(23, 59, 59, 999)

            const totalDia = await prisma.movimientoCaja.aggregate({
                where: {
                    tipo: 'INGRESO',
                    fecha: { gte: inicioDia, lte: finDia }
                },
                _sum: { monto: true }
            })

            porDia.push({
                nombre: DIAS[i],
                fecha: inicioDia.toLocaleDateString('es-EC', { day: 'numeric', month: 'short' }),
                total: Number(totalDia._sum.monto || 0)
            })
        }

        return ok(res, {
            totalIngresos: Number(ingresos._sum.monto || 0),
            totalCitas: ingresos._count.id,
            porDia,
        })
    } catch (e) {
        console.error(e)
        return error(res, 'Error al obtener resumen semanal')
    }
}

module.exports = { listar, resumen, registrarEgreso, editar, eliminar, resumenSemana }