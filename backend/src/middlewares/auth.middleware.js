const { verificarToken } = require('../config/jwt')

// Verifica que el request tenga un JWT válido
const autenticar = (req, res, next) => {
  const authHeader = req.headers.authorization

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ mensaje: 'Token requerido' })
  }

  const token = authHeader.split(' ')[1]

  try {
    const payload = verificarToken(token)
    req.usuario = payload   // { id, email, rol }
    next()
  } catch {
    return res.status(401).json({ mensaje: 'Token inválido o expirado' })
  }
}

// Solo permite acceso al administrador
const soloAdmin = (req, res, next) => {
  if (req.usuario?.rol !== 'ADMIN') {
    return res.status(403).json({ mensaje: 'Acceso restringido al administrador' })
  }
  next()
}

module.exports = { autenticar, soloAdmin }
