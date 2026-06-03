const prisma = require('../config/database')
const { ok, creado, error } = require('../utils/respuesta')

// POST /api/facturas  — admin registra el pago de una cita
const crear = async (req, res) => {
  try {
    const { citaId, subtotal, metodoPago } = req.body

    const cita = await prisma.cita.findUnique({
      where: { id: citaId },
      include: { cliente: true },
    })
    if (!cita) return error(res, 'Cita no encontrada', 404)
    if (cita.estado !== 'COMPLETADA') return error(res, 'La cita debe estar completada primero', 400)

    const sub = parseFloat(subtotal)
    const iva = parseFloat((sub * 0.15).toFixed(2))  // IVA 15% Ecuador
    const total = parseFloat((sub + iva).toFixed(2))

    let factura
    try {
      // El número se genera dentro de la transacción serializable para evitar duplicados
      factura = await prisma.$transaction(async (tx) => {
        const totalFacturas = await tx.factura.count()
        const anio = new Date().getFullYear()
        const numeroFactura = `FAC-${anio}-${String(totalFacturas + 1).padStart(4, '0')}`

        const f = await tx.factura.create({
          data: {
            citaId,
            clienteId: cita.clienteId,
            numeroFactura,
            subtotal: sub,
            iva,
            total,
            metodoPago,
          },
        })
        await tx.movimientoCaja.create({
          data: {
            tipo: 'INGRESO',
            monto: total,
            descripcion: `Factura ${numeroFactura}`,
            facturaId: f.id,
          },
        })
        return f
      }, { isolationLevel: 'Serializable' })
    } catch (txErr) {
      if (txErr.code === 'P2002') return error(res, 'Error al generar número de factura, intente nuevamente', 409)
      throw txErr
    }

    return creado(res, factura)
  } catch (e) {
    console.error(e)
    return error(res, 'Error al generar factura')
  }
}

// GET /api/facturas
const listar = async (req, res) => {
  try {
    const facturas = await prisma.factura.findMany({
      include: {
        cliente: { select: { nombre: true, apellido: true } },
        cita: { include: { servicio: true } },
      },
      orderBy: { fechaEmision: 'desc' },
    })
    return ok(res, facturas)
  } catch (e) {
    console.error(e)
    return error(res, 'Error al obtener facturas')
  }
}

module.exports = { crear, listar }
