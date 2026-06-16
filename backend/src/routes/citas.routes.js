const router = require('express').Router()
const { body } = require('express-validator')
const { solicitarCita, listarCitas, cambiarEstado, cancelarCita, historial, horasOcupadas, reagendarCita } = require('../controllers/citas.controller')
const { autenticar, soloAdmin } = require('../middlewares/auth.middleware')
const { verificarPropietarioCita } = require('../middlewares/rls.middleware')
const { validar } = require('../middlewares/validar.middleware')

router.use(autenticar)

router.get('/', listarCitas)
router.post('/', [
  body('servicioId').notEmpty().withMessage('servicioId requerido'),
  body('fechaHora').isISO8601().toDate().withMessage('Fecha y hora inválida'),
], validar, solicitarCita)
router.get('/horas-ocupadas', horasOcupadas)
router.patch('/:id/estado', soloAdmin, [
  body('estado').isIn(['APROBADA', 'RECHAZADA', 'CANCELADA', 'COMPLETADA']).withMessage('Estado inválido'),
  body('pago.subtotal').if(body('estado').equals('COMPLETADA')).isFloat({ min: 0.01 }).withMessage('Subtotal debe ser mayor a 0'),
  body('pago.metodoPago').if(body('estado').equals('COMPLETADA')).isIn(['EFECTIVO', 'TRANSFERENCIA']).withMessage('Método de pago inválido'),
], validar, cambiarEstado)
router.delete('/:id', verificarPropietarioCita, cancelarCita)
router.post('/:id/reagendar', [
  body('fechaHora').isISO8601().toDate().withMessage('Fecha y hora inválida'),
], validar, reagendarCita)
router.get('/historial', historial)

module.exports = router
