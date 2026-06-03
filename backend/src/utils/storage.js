const { randomUUID } = require('crypto')
const admin = require('../config/firebase')

const subirImagen = async (base64, carpeta = 'trabajos') => {
  const bucket = admin.storage().bucket()
  const nombre = `${carpeta}/${randomUUID()}.jpg`
  const archivo = bucket.file(nombre)
  const buffer = Buffer.from(base64, 'base64')

  await archivo.save(buffer, { metadata: { contentType: 'image/jpeg' } })
  await archivo.makePublic()

  return `https://storage.googleapis.com/${bucket.name}/${nombre}`
}

const eliminarImagen = async (url) => {
  try {
    const bucket = admin.storage().bucket()
    const nombre = url.split(`${bucket.name}/`)[1]
    if (nombre) await bucket.file(nombre).delete()
  } catch {
    // No es error crítico si el archivo ya no existe
  }
}

module.exports = { subirImagen, eliminarImagen }
