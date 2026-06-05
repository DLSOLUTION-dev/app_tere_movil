const { v2: cloudinary } = require('cloudinary')

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

const subirImagen = async (base64, carpeta = 'trabajos') => {
  const result = await cloudinary.uploader.upload(
    `data:image/jpeg;base64,${base64}`,
    { folder: carpeta }
  )
  return result.secure_url
}

const eliminarImagen = async (url) => {
  try {
    // Extrae el public_id desde la URL de Cloudinary (carpeta/nombre_sin_extension)
    const match = url.match(/\/([^/]+\/[^/]+)\.\w+$/)
    if (match) await cloudinary.uploader.destroy(match[1])
  } catch {}
}

module.exports = { subirImagen, eliminarImagen }
