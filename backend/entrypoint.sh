#!/bin/sh
set -e

echo "⏳ Aplicando migraciones de base de datos..."
npx prisma migrate deploy

echo "🌱 Ejecutando seed inicial..."
node seed.js || echo "⚠️  Seed con advertencia (puede ser normal)"

echo "🚀 Iniciando Tere Móvil API..."
exec node src/index.js
