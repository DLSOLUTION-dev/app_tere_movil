const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')
const prisma = new PrismaClient()

async function main() {
  // Admin principal — solo se crea si no existe
  const existe = await prisma.usuario.findUnique({ where: { email: 'teresa@teremovil.com' } })
  if (!existe) {
    const adminPassword = process.env.ADMIN_SEED_PASSWORD
    if (!adminPassword) throw new Error('ADMIN_SEED_PASSWORD no definido en .env')
    const hash = await bcrypt.hash(adminPassword, 10)
    const admin = await prisma.usuario.create({
      data: {
        nombre: 'Teresa',
        apellido: 'Tapia',
        email: 'teresa@teremovil.com',
        passwordHash: hash,
        rol: 'ADMIN',
      },
    })
    console.log('✅ Admin creado:', admin.email)
  } else {
    console.log('ℹ️  Admin ya existe:', existe.email)
  }

  // Servicios — solo crea si no existe ninguno
  const totalServicios = await prisma.servicio.count()
  if (totalServicios === 0) {
    await prisma.servicio.createMany({
      data: [
        { nombre: 'Corte de cabello hombre', duracionMin: 30 },
        { nombre: 'Corte de cabello mujer',  duracionMin: 45 },
        { nombre: 'Tinte',                   duracionMin: 90 },
        { nombre: 'Balayage',                duracionMin: 120 },
        { nombre: 'Diseño de mechas',        duracionMin: 120 },
        { nombre: 'Peinado',                 duracionMin: 45 },
        { nombre: 'Permanente',              duracionMin: 120 },
        { nombre: 'Depilacion',              duracionMin: 30 },
        { nombre: 'Tratamiento',             duracionMin: 60 },
        { nombre: 'Manicura',                duracionMin: 45 },
        { nombre: 'Pedicura',                duracionMin: 60 },
      ],
    })
    console.log('✅ Servicios creados')
  } else {
    console.log(`ℹ️  Servicios ya existen (${totalServicios})`)
  }

  await prisma.$disconnect()
}

main().catch(console.error)
