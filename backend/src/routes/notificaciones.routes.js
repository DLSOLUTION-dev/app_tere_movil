const router = require('express').Router()
const { verificarToken } = require('../middlewares/auth.middleware')
const { listar, marcarLeida, marcarTodasLeidas } = require('../controllers/notificaciones.controller')

router.use(verificarToken)

router.get('/mias', listar)
router.put('/leer-todas', marcarTodasLeidas)
router.put('/:id/leer', marcarLeida)

module.exports = router
