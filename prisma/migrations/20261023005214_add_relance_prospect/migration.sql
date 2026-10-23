-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Prospect" (
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
    "relancePropositionEnvoyee" BOOLEAN NOT NULL DEFAULT false,
    "relanceEmailBrouillon" TEXT,
    "relanceEmailEnvoyee" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Prospect_prestationId_fkey" FOREIGN KEY ("prestationId") REFERENCES "Prestation" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Prospect_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Prospect" ("createdAt", "creneauPropose", "email", "id", "message", "nom", "notesAppel", "patientId", "prestationId", "source", "statut", "telephone", "updatedAt") SELECT "createdAt", "creneauPropose", "email", "id", "message", "nom", "notesAppel", "patientId", "prestationId", "source", "statut", "telephone", "updatedAt" FROM "Prospect";
DROP TABLE "Prospect";
ALTER TABLE "new_Prospect" RENAME TO "Prospect";
CREATE UNIQUE INDEX "Prospect_patientId_key" ON "Prospect"("patientId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
