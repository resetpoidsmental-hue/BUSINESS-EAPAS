-- AlterTable
ALTER TABLE "JournalEntree" ADD COLUMN "repasStructure" TEXT;

-- CreateTable
CREATE TABLE "ModeleRation" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nom" TEXT NOT NULL,
    "targetKcal" INTEGER NOT NULL,
    "ration" TEXT NOT NULL,
    "repartition" TEXT NOT NULL,
    "menuType" TEXT NOT NULL,
    "patientId" TEXT,
    "sourceNom" TEXT,
    "partageLe" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ModeleRation_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
