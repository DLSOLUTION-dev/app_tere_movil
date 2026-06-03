const router = require('express').Router()
const { listar, crear, actualizar, eliminar } = require('../controllers/trabajos.controller')
const { autenticar, soloAdmin } = require('../middlewares/auth.middleware')

router.get('/',     autenticar,             listar)
router.post('/',    autenticar, soloAdmin,  crear)
router.put('/:id',  autenticar, soloAdmin,  actualizar)
router.delete('/:id', autenticar, soloAdmin, eliminar)

module.exports = router
