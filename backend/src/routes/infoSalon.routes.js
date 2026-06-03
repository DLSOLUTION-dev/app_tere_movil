const router = require('express').Router()
const { obtener, actualizar } = require('../controllers/infoSalon.controller')
const { autenticar, soloAdmin } = require('../middlewares/auth.middleware')

router.get('/', autenticar,            obtener)
router.put('/', autenticar, soloAdmin, actualizar)

module.exports = router
