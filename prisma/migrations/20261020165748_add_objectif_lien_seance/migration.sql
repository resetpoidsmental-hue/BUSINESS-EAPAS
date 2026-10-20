-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Seance" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "patientId" TEXT NOT NULL,
    "objectifSMARTId" TEXT,
    "date" DATETIME NOT NULL,
    "type" TEXT,
    "format" TEXT,
    "statut" TEXT NOT NULL DEFAULT 'Planifiée',
    "contenu" TEXT,
    "genereParIA" BOOLEAN NOT NULL DEFAULT false,
    "materielNecessaire" TEXT,
    "materielVu" BOOLEAN NOT NULL DEFAULT false,
    "borgRessenti" INTEGER,
    "notes" TEXT,
    CONSTRAINT "Seance_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Seance_objectifSMARTId_fkey" FOREIGN KEY ("objectifSMARTId") REFERENCES "ObjectifSMART" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Seance" ("borgRessenti", "contenu", "date", "format", "genereParIA", "id", "materielNecessaire", "materielVu", "notes", "patientId", "statut", "type") SELECT "borgRessenti", "contenu", "date", "format", "genereParIA", "id", "materielNecessaire", "materielVu", "notes", "patientId", "statut", "type" FROM "Seance";
DROP TABLE "Seance";
ALTER TABLE "new_Seance" RENAME TO "Seance";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
