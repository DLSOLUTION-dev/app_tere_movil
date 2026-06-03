const jwt = require('jsonwebtoken')

const SECRET  = process.env.JWT_SECRET
const EXPIRES = process.env.JWT_EXPIRES_IN || '7d'

const generarToken = (payload) => jwt.sign(payload, SECRET, { expiresIn: EXPIRES })

const verificarToken = (token) => jwt.verify(token, SECRET)

module.exports = { generarToken, verificarToken }
