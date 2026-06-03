const router = require('express').Router()
const { listar, detalle, cambiarRol } = require('../controllers/clientes.controller')
const { autenticar, soloAdmin } = require('../middlewares/auth.middleware')

router.use(autenticar, soloAdmin)
router.get('/',           listar)
router.get('/:id',        detalle)
router.patch('/:id/rol',  cambiarRol)

module.exports = router
