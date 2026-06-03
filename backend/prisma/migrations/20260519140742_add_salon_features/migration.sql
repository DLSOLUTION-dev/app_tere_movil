-- CreateTable
CREATE TABLE "trabajos_realizados" (
    "id" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "descripcion" TEXT,
    "antes_base64" TEXT NOT NULL,
    "despues_base64" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "trabajos_realizados_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "info_salon" (
    "id" TEXT NOT NULL,
    "vision" TEXT,
    "mision" TEXT,
    "contacto" TEXT,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "info_salon_pkey" PRIMARY KEY ("id")
);
