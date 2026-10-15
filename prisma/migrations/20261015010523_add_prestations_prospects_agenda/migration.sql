-- CreateTable
CREATE TABLE "Prestation" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nom" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "tarif" REAL NOT NULL,
    "unite" TEXT NOT NULL,
    "dureeSemaines" INTEGER,
    "inclusions" TEXT,
    "actif" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Prospect" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nom" TEXT NOT NULL,
    "email" TEXT,
    "telephone" TEXT,
    "source" TEXT NOT NULL,
    "prestationId" TEXT,
    "message" TEXT,
    "notesAppel" TEXT,
    "statut" TEXT NOT NULL DEFAULT 'Nouveau',
    "creneauPropose" DATETIME,
    "patientId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Prospect_prestationId_fkey" FOREIGN KEY ("prestationId") REFERENCES "Prestation" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Prospect_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "HoraireTravail" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "jour" INTEGER NOT NULL,
    "actif" BOOLEAN NOT NULL DEFAULT false,
    "debut" TEXT NOT NULL DEFAULT '09:00',
    "fin" TEXT NOT NULL DEFAULT '18:00'
);

-- CreateTable
CREATE TABLE "CreneauExceptionnel" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "date" DATETIME NOT NULL,
    "debut" TEXT NOT NULL,
    "fin" TEXT NOT NULL,
    "note" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE UNIQUE INDEX "Prospect_patientId_key" ON "Prospect"("patientId");

-- CreateIndex
CREATE UNIQUE INDEX "HoraireTravail_jour_key" ON "HoraireTravail"("jour");
