const router = require('express').Router()
const { body } = require('express-validator')
const { crear, listar } = require('../controllers/facturas.controller')
const { autenticar, soloAdmin } = require('../middlewares/auth.middleware')
const { validar } = require('../middlewares/validar.middleware')

router.use(autenticar, soloAdmin)
router.get('/', listar)
router.post('/', [
  body('citaId').notEmpty().withMessage('citaId requerido'),
  body('subtotal').isFloat({ min: 0.01 }).withMessage('Subtotal debe ser mayor a 0'),
  body('metodoPago').isIn(['EFECTIVO', 'TRANSFERENCIA']).withMessage('Método de pago inválido'),
], validar, crear)

module.exports = router
