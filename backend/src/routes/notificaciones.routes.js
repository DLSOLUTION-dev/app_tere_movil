const router = require('express').Router()
const { autenticar } = require('../middlewares/auth.middleware')
const { listar, marcarLeida, marcarTodasLeidas } = require('../controllers/notificaciones.controller')

router.use(autenticar)

router.get('/mias', listar)
router.put('/leer-todas', marcarTodasLeidas)
router.put('/:id/leer', marcarLeida)

module.exports = router
