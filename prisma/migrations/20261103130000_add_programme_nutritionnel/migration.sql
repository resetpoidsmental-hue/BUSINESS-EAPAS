-- CreateTable
CREATE TABLE "ProgrammeNutritionnel" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "patientId" TEXT NOT NULL,
    "contenu" TEXT NOT NULL,
    "genereParIA" BOOLEAN NOT NULL DEFAULT false,
    "statut" TEXT NOT NULL DEFAULT 'Brouillon',
    "valideLe" DATETIME,
    "livreLe" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ProgrammeNutritionnel_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "ProgrammeNutritionnel_patientId_key" ON "ProgrammeNutritionnel"("patientId");
