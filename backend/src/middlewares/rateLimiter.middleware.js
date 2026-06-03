const crearLimitador = (maxPeticiones, ventanaMs) => {
  const historial = new Map()

  // Purgar IPs inactivas cada 5 minutos para evitar memory leak
  setInterval(() => {
    const corte = Date.now() - ventanaMs
    for (const [ip, tiempos] of historial) {
      const recientes = tiempos.filter(t => t > corte)
      if (recientes.length === 0) historial.delete(ip)
      else historial.set(ip, recientes)
    }
  }, 5 * 60 * 1000).unref()

  return (req, res, next) => {
    const ip = req.ip || req.socket.remoteAddress
    const ahora = Date.now()
    const ventanaInicio = ahora - ventanaMs

    const tiempos = (historial.get(ip) || []).filter(t => t > ventanaInicio)
    tiempos.push(ahora)
    historial.set(ip, tiempos)

    if (tiempos.length > maxPeticiones) {
      return res.status(429).json({ mensaje: 'Demasiados intentos, espera un momento e intenta de nuevo' })
    }
    next()
  }
}

module.exports = { crearLimitador }
