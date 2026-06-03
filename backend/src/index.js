require('dotenv').config()
const express = require('express')
const cors = require('cors')
const helmet = require('helmet')
const morgan = require('morgan')

const app = express()
const { limpiarCitasAntiguas } = require('./utils/limpiarCitas')
const { enviarRecordatorios } = require('./utils/recordatorios')

// ── Cabeceras de seguridad HTTP ──
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' }, // Necesario para que la app móvil pueda pedir recursos
}))

// ── CORS ──
// Las apps nativas (React Native / Expo) no envían cabecera Origin → se permiten.
// En desarrollo también se admite localhost para pruebas con navegador o Postman web.
// En producción cualquier origen web que no esté en CORS_ORIGIN es rechazado.
const origenesPermitidos = (process.env.CORS_ORIGIN || '')
  .split(',')
  .map(o => o.trim())
  .filter(Boolean)

app.use(cors({
  origin: (origin, callback) => {
    // Sin Origin → app nativa, Postman desktop, servicio backend → permitir
    if (!origin) return callback(null, true)

    // Orígenes web explícitamente declarados en CORS_ORIGIN → permitir
    if (origenesPermitidos.includes(origin)) return callback(null, true)

    // Desarrollo: localhost siempre permitido
    if (process.env.NODE_ENV !== 'production' && /^http:\/\/localhost(:\d+)?$/.test(origin)) {
      return callback(null, true)
    }

    // Cualquier otro origen web → bloqueado
    callback(new Error(`Origen no permitido: ${origin}`))
  },
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: false,
}))
app.use(express.json({ limit: '5mb' }))
app.use(morgan('dev'))

// ── Rutas ──
app.use('/api/auth', require('./routes/auth.routes'))
app.use('/api/citas', require('./routes/citas.routes'))
app.use('/api/servicios', require('./routes/servicios.routes'))
app.use('/api/clientes', require('./routes/clientes.routes'))
app.use('/api/facturas', require('./routes/facturas.routes'))
app.use('/api/deudores', require('./routes/deudores.routes'))
app.use('/api/fichas', require('./routes/fichas.routes'))
app.use('/api/caja', require('./routes/caja.routes'))
app.use('/api/cierre-caja', require('./routes/cierreCaja.routes'))
app.use('/api/trabajos', require('./routes/trabajos.routes'))
app.use('/api/info-salon', require('./routes/infoSalon.routes'))

// ── Health check ──
app.get('/health', (req, res) => res.json({ status: 'ok', app: 'Tere Móvil API' }))

// ── 404 ──
app.use((req, res) => res.status(404).json({ mensaje: 'Ruta no encontrada' }))

// ── Error global ──
app.use((err, req, res, next) => {
  console.error(err)
  res.status(500).json({ mensaje: 'Error interno del servidor' })
})
limpiarCitasAntiguas()
setInterval(limpiarCitasAntiguas, 24 * 60 * 60 * 1000)

enviarRecordatorios()
setInterval(enviarRecordatorios, 60 * 60 * 1000)
const PORT = process.env.PORT || 3000
app.listen(PORT, () => {
  console.log(`🚀 Tere Móvil API corriendo en http://localhost:${PORT}`)
})
