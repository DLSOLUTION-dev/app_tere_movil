const { validationResult } = require('express-validator')

// Intercepta errores de express-validator y responde con 400
const validar = (req, res, next) => {
  const errores = validationResult(req)
  if (!errores.isEmpty()) {
    return res.status(400).json({ errores: errores.array() })
  }
  next()
}

module.exports = { validar }
