const bcrypt = require('bcryptjs')
const prisma = require('../config/database')
const { generarToken } = require('../config/jwt')
const { ok, creado, error } = require('../utils/respuesta')

// POST /api/auth/registro
const registro = async (req, res) => {
  try {
    const { nombre, apellido, email, password, telefono } = req.body

    const existe = await prisma.usuario.findUnique({ where: { email } })
    if (existe) return error(res, 'El email ya está registrado', 409)

    const passwordHash = await bcrypt.hash(password, 10)

    const usuario = await prisma.usuario.create({
      data: { nombre, apellido, email, passwordHash, telefono },
      select: { id: true, nombre: true, apellido: true, email: true, rol: true },
    })

    const token = generarToken({ id: usuario.id, email: usuario.email, rol: usuario.rol })

    return creado(res, { usuario, token })
  } catch (e) {
    console.error(e)
    return error(res, 'Error al registrar usuario')
  }
}

// POST /api/auth/login
const login = async (req, res) => {
  try {
    const { email, password } = req.body

    const usuario = await prisma.usuario.findUnique({ where: { email } })

    // Siempre ejecutar bcrypt aunque el usuario no exista para evitar timing oracle
    // (un atacante podría enumerar emails midiendo la diferencia de tiempo en la respuesta)
    const hashComparacion = usuario?.passwordHash ?? '$2a$10$invalido.hash.para.evitar.timing.oracle.padding'
    const valido = await bcrypt.compare(password, hashComparacion)

    if (!usuario || !usuario.activo || !valido) return error(res, 'Credenciales inválidas', 401)

    const token = generarToken({ id: usuario.id, email: usuario.email, rol: usuario.rol })

    return ok(res, {
      token,
      usuario: {
        id: usuario.id, nombre: usuario.nombre,
        apellido: usuario.apellido, email: usuario.email, rol: usuario.rol,
      },
    })
  } catch (e) {
    console.error(e)
    return error(res, 'Error al iniciar sesión')
  }
}

// PUT /api/auth/fcm-token  (guarda el token del dispositivo para notificaciones push)
const guardarFcmToken = async (req, res) => {
  try {
    const { fcmToken } = req.body
    await prisma.usuario.update({
      where: { id: req.usuario.id },
      data: { fcmToken },
    })
    return ok(res, { mensaje: 'Token FCM actualizado' })
  } catch (e) {
    console.error(e)
    return error(res, 'Error al guardar token FCM')
  }
}

// GET /api/auth/perfil
const obtenerPerfil = async (req, res) => {
  try {
    const usuario = await prisma.usuario.findUnique({
      where: { id: req.usuario.id },
      select: { id: true, nombre: true, apellido: true, email: true, telefono: true, rol: true, createdAt: true },
    })
    if (!usuario) return error(res, 'Usuario no encontrado', 404)
    return ok(res, usuario)
  } catch (e) {
    console.error(e)
    return error(res, 'Error al obtener perfil')
  }
}

// PUT /api/auth/perfil
const actualizarPerfil = async (req, res) => {
  try {
    const { nombre, apellido, telefono } = req.body
    const usuario = await prisma.usuario.update({
      where: { id: req.usuario.id },
      data: { nombre, apellido, telefono: telefono || null },
      select: { id: true, nombre: true, apellido: true, email: true, telefono: true, rol: true },
    })
    return ok(res, usuario)
  } catch (e) {
    console.error(e)
    return error(res, 'Error al actualizar perfil')
  }
}

// PUT /api/auth/cambiar-password
const cambiarPassword = async (req, res) => {
  try {
    const { passwordActual, passwordNuevo } = req.body
    const usuario = await prisma.usuario.findUnique({ where: { id: req.usuario.id } })
    const valido = await bcrypt.compare(passwordActual, usuario.passwordHash)
    if (!valido) return error(res, 'La contraseña actual es incorrecta', 400)
    const passwordHash = await bcrypt.hash(passwordNuevo, 10)
    await prisma.usuario.update({ where: { id: req.usuario.id }, data: { passwordHash } })
    return ok(res, { mensaje: 'Contraseña actualizada correctamente' })
  } catch (e) {
    console.error(e)
    return error(res, 'Error al cambiar contraseña')
  }
}

module.exports = { registro, login, guardarFcmToken, obtenerPerfil, actualizarPerfil, cambiarPassword }
