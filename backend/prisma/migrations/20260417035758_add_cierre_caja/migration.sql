-- CreateTable
CREATE TABLE "cierres_caja" (
    "id" TEXT NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "saldo_inicial" DECIMAL(10,2) NOT NULL,
    "total_ingresos" DECIMAL(10,2) NOT NULL,
    "total_egresos" DECIMAL(10,2) NOT NULL,
    "total_disponible" DECIMAL(10,2) NOT NULL,
    "retiro_teresa" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "saldo_final" DECIMAL(10,2) NOT NULL,
    "notas" TEXT,
    "creado_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "cierres_caja_pkey" PRIMARY KEY ("id")
);
