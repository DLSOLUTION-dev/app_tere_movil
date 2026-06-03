const router = require('express').Router()
const { body } = require('express-validator')
const { listar, crear, actualizar } = require('../controllers/servicios.controller')
const { autenticar, soloAdmin } = require('../middlewares/auth.middleware')
const { validar } = require('../middlewares/validar.middleware')

router.get('/', autenticar, listar)
router.post('/', autenticar, soloAdmin, [
  body('nombre').notEmpty().withMessage('Nombre requerido'),
  body('duracionMin').isInt({ min: 1 }).withMessage('Duración debe ser un entero mayor a 0'),
], validar, crear)
router.put('/:id', autenticar, soloAdmin, [
  body('nombre').optional().notEmpty().withMessage('Nombre no puede estar vacío'),
  body('duracionMin').optional().isInt({ min: 1 }).withMessage('Duración debe ser un entero mayor a 0'),
], validar, actualizar)

module.exports = router
