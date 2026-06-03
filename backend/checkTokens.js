const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
    const usuarios = await prisma.usuario.findMany({
        select: { nombre: true, email: true, fcmToken: true }
    })
    console.log(JSON.stringify(usuarios, null, 2))
    await prisma.$disconnect()
}

main()