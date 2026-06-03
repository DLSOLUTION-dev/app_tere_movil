const router = require('express').Router()
const { body } = require('express-validator')
const { listar, resumen, registrarEgreso, editar, eliminar, resumenSemana } = require('../controllers/caja.controller')
const { autenticar, soloAdmin } = require('../middlewares/auth.middleware')
const { validar } = require('../middlewares/validar.middleware')

const validacionMovimiento = [
  body('monto').isFloat({ min: 0.01 }).withMessage('Monto debe ser mayor a 0'),
  body('descripcion').notEmpty().withMessage('Descripción requerida'),
]

router.use(autenticar, soloAdmin)

router.get('/', listar)
router.get('/resumen', resumen)
router.get('/resumen-semana', resumenSemana)
router.post('/egreso', validacionMovimiento, validar, registrarEgreso)
router.put('/:id', validacionMovimiento, validar, editar)
router.delete('/:id', eliminar)

module.exports = router