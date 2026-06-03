-- Los trabajos existentes con base64 no se pueden migrar automáticamente a Storage.
-- Se eliminan para que el admin los vuelva a subir con las imágenes en Storage.
DELETE FROM "trabajos_realizados";

-- Eliminar columnas base64
ALTER TABLE "trabajos_realizados" DROP COLUMN "antes_base64";
ALTER TABLE "trabajos_realizados" DROP COLUMN "despues_base64";

-- Agregar columnas de URL
ALTER TABLE "trabajos_realizados" ADD COLUMN "antes_url" TEXT NOT NULL DEFAULT '';
ALTER TABLE "trabajos_realizados" ADD COLUMN "despues_url" TEXT NOT NULL DEFAULT '';

ALTER TABLE "trabajos_realizados" ALTER COLUMN "antes_url" DROP DEFAULT;
ALTER TABLE "trabajos_realizados" ALTER COLUMN "despues_url" DROP DEFAULT;
