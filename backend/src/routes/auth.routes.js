const router = require('express').Router()
const { body } = require('express-validator')
const { registro, login, guardarFcmToken, obtenerPerfil, actualizarPerfil, cambiarPassword } = require('../controllers/auth.controller')
const { autenticar } = require('../middlewares/auth.middleware')
const { validar } = require('../middlewares/validar.middleware')
const { crearLimitador } = require('../middlewares/rateLimiter.middleware')

// Máximo 10 intentos por IP cada 15 minutos en endpoints de autenticación
const authLimiter = crearLimitador(10, 15 * 60 * 1000)

router.post('/registro',
  authLimiter,
  [
    body('nombre').notEmpty().withMessage('Nombre requerido'),
    body('apellido').notEmpty().withMessage('Apellido requerido'),
    body('email').isEmail().normalizeEmail().withMessage('Email inválido'),
    body('password').isLength({ min: 8, max: 72 }).withMessage('La contraseña debe tener entre 8 y 72 caracteres'),
  ],
  validar, registro
)

router.post('/login',
  authLimiter,
  [
    body('email').isEmail().normalizeEmail().withMessage('Email inválido'),
    body('password').isLength({ min: 1, max: 72 }).withMessage('Contraseña requerida'),
  ],
  validar, login
)

router.put('/fcm-token', autenticar, guardarFcmToken)

router.get('/perfil', autenticar, obtenerPerfil)

router.put('/perfil', autenticar, [
  body('nombre').notEmpty().withMessage('Nombre requerido'),
  body('apellido').notEmpty().withMessage('Apellido requerido'),
  body('telefono').optional({ checkFalsy: true }).isMobilePhone().withMessage('Teléfono inválido'),
], validar, actualizarPerfil)

router.put('/cambiar-password', autenticar, [
  body('passwordActual').notEmpty().withMessage('Contraseña actual requerida'),
  body('passwordNuevo').isLength({ min: 8, max: 72 }).withMessage('La nueva contraseña debe tener entre 8 y 72 caracteres'),
], validar, cambiarPassword)

module.exports = router
