const router = require('express').Router()
const { body } = require('express-validator')
const { preview, cerrar, historial } = require('../controllers/cierreCaja.controller')
const { autenticar, soloAdmin } = require('../middlewares/auth.middleware')
const { validar } = require('../middlewares/validar.middleware')

router.use(autenticar, soloAdmin)

router.get('/preview', preview)
router.get('/historial', historial)
router.post('/', [
  body('retiro').optional().isFloat({ min: 0 }).withMessage('El retiro debe ser un número positivo'),
], validar, cerrar)

module.exports = router