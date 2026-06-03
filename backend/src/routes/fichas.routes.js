const router = require('express').Router()
const { body } = require('express-validator')
const { listarMisFichas, listarPorCliente, crear, actualizar, eliminar } = require('../controllers/fichas.controller')
const { autenticar, soloAdmin } = require('../middlewares/auth.middleware')
const { validar } = require('../middlewares/validar.middleware')

router.use(autenticar)

router.get('/mias', listarMisFichas)
router.get('/:clienteId', soloAdmin, listarPorCliente)
router.post('/', soloAdmin, [
  body('clienteId').notEmpty().withMessage('clienteId requerido'),
  body('tipoCabello').notEmpty().withMessage('Tipo de cabello requerido'),
], validar, crear)
router.put('/:id', soloAdmin, [
  body('tipoCabello').optional().notEmpty().withMessage('Tipo de cabello no puede estar vacío'),
], validar, actualizar)
router.delete('/:id', soloAdmin, eliminar)

module.exports = router