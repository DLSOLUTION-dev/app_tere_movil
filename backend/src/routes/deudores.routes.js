const router = require('express').Router()
const { body } = require('express-validator')
const { listar, crear, marcarPagado } = require('../controllers/deudores.controller')
const { autenticar, soloAdmin } = require('../middlewares/auth.middleware')
const { validar } = require('../middlewares/validar.middleware')

router.use(autenticar, soloAdmin)
router.get('/', listar)
router.post('/', [
  body('clienteId').notEmpty().withMessage('clienteId requerido'),
  body('monto').isFloat({ min: 0.01 }).withMessage('Monto debe ser mayor a 0'),
  body('descripcion').notEmpty().withMessage('Descripción requerida'),
], validar, crear)
router.patch('/:id/pagar', marcarPagado)

module.exports = router
