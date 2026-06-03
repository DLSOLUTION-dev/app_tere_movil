const prisma = require('../config/database')
const { ok, creado, error } = require('../utils/respuesta')

// GET /api/cierre-caja/preview
// Muestra el resumen del día actual antes de cerrar
const preview = async (req, res) => {
    try {
        const hoy = new Date()
        const inicioDia = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate(), 0, 0, 0)
        const finDia = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate(), 23, 59, 59)

        // Obtener último cierre para saber el saldo inicial de hoy
        const ultimoCierre = await prisma.cierreCaja.findFirst({
            orderBy: { fecha: 'desc' }
        })
        const saldoInicial = ultimoCierre ? Number(ultimoCierre.saldoFinal) : 0

        // Ingresos del día
        const ingresos = await prisma.movimientoCaja.aggregate({
            where: {
                tipo: 'INGRESO',
                fecha: { gte: inicioDia, lte: finDia }
            },
            _sum: { monto: true }
        })

        // Egresos del día
        const egresos = await prisma.movimientoCaja.aggregate({
            where: {
                tipo: 'EGRESO',
                fecha: { gte: inicioDia, lte: finDia }
            },
            _sum: { monto: true }
        })

        const totalIngresos = Number(ingresos._sum.monto || 0)
        const totalEgresos = Number(egresos._sum.monto || 0)
        const totalDisponible = saldoInicial + totalIngresos - totalEgresos

        return ok(res, {
            saldoInicial,
            totalIngresos,
            totalEgresos,
            totalDisponible,
        })
    } catch (e) {
        console.error(e)
        return error(res, 'Error al obtener preview de caja')
    }
}

// POST /api/cierre-caja
// Realiza el cierre del día
const cerrar = async (req, res) => {
    try {
        const { retiro, notas } = req.body
        // retiro = cuánto saca Teresa (puede ser 0)

        const hoy = new Date()
        const inicioDia = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate(), 0, 0, 0)
        const finDia = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate(), 23, 59, 59)

        // Verificar que no se haya cerrado caja hoy ya
        const cierreHoy = await prisma.cierreCaja.findFirst({
            where: { fecha: { gte: inicioDia, lte: finDia } }
        })
        if (cierreHoy) {
            return error(res, 'La caja ya fue cerrada hoy', 400)
        }

        // Obtener saldo inicial
        const ultimoCierre = await prisma.cierreCaja.findFirst({
            orderBy: { fecha: 'desc' }
        })
        const saldoInicial = ultimoCierre ? Number(ultimoCierre.saldoFinal) : 0

        // Calcular totales del día
        const ingresos = await prisma.movimientoCaja.aggregate({
            where: {
                tipo: 'INGRESO',
                fecha: { gte: inicioDia, lte: finDia }
            },
            _sum: { monto: true }
        })

        const egresos = await prisma.movimientoCaja.aggregate({
            where: {
                tipo: 'EGRESO',
                fecha: { gte: inicioDia, lte: finDia }
            },
            _sum: { monto: true }
        })

        const totalIngresos = Number(ingresos._sum.monto || 0)
        const totalEgresos = Number(egresos._sum.monto || 0)
        const totalDisponible = saldoInicial + totalIngresos - totalEgresos
        const montoRetiro = parseFloat(retiro || 0)
        const saldoFinal = totalDisponible - montoRetiro

        if (saldoFinal < 0) {
            return error(res, 'El retiro no puede ser mayor al total disponible', 400)
        }

        // Crear cierre y registrar retiro en una transacción
        const cierre = await prisma.$transaction(async (tx) => {
            const c = await tx.cierreCaja.create({
                data: {
                    saldoInicial,
                    totalIngresos,
                    totalEgresos,
                    totalDisponible,
                    retiroTerasa: montoRetiro,
                    saldoFinal,
                    notas,
                }
            })

            // Si hubo retiro registrarlo como egreso
            if (montoRetiro > 0) {
                await tx.movimientoCaja.create({
                    data: {
                        tipo: 'EGRESO',
                        monto: montoRetiro,
                        descripcion: `Retiro Teresa - Cierre ${new Date().toLocaleDateString('es-EC')}`,
                    }
                })
            }

            return c
        })

        return creado(res, cierre)
    } catch (e) {
        console.error(e)
        return error(res, 'Error al cerrar caja')
    }
}

// GET /api/cierre-caja/historial
// Lista todos los cierres anteriores
const historial = async (req, res) => {
    try {
        const cierres = await prisma.cierreCaja.findMany({
            orderBy: { fecha: 'desc' },
        })
        return ok(res, cierres)
    } catch (e) {
        console.error(e)
        return error(res, 'Error al obtener historial de cierres')
    }
}

module.exports = { preview, cerrar, historial }