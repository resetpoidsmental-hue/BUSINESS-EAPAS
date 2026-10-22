-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Settings" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT DEFAULT 1,
    "nomEntreprise" TEXT NOT NULL DEFAULT 'Mon activité EAPAS',
    "siret" TEXT,
    "adresse" TEXT,
    "telephone" TEXT,
    "email" TEXT,
    "mentionTVA" TEXT NOT NULL DEFAULT 'TVA non applicable, article 293 B du CGI',
    "tauxUrssaf" REAL NOT NULL DEFAULT 24.6,
    "portalEnabled" BOOLEAN NOT NULL DEFAULT false,
    "visiteGuideeFaite" BOOLEAN NOT NULL DEFAULT false,
    "assuranceRCPro" TEXT,
    "prochainDevis" INTEGER NOT NULL DEFAULT 1,
    "prochainFacture" INTEGER NOT NULL DEFAULT 1,
    "prochainContrat" INTEGER NOT NULL DEFAULT 1,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Settings" ("adresse", "assuranceRCPro", "email", "id", "mentionTVA", "nomEntreprise", "portalEnabled", "prochainContrat", "prochainDevis", "prochainFacture", "siret", "tauxUrssaf", "telephone", "updatedAt") SELECT "adresse", "assuranceRCPro", "email", "id", "mentionTVA", "nomEntreprise", "portalEnabled", "prochainContrat", "prochainDevis", "prochainFacture", "siret", "tauxUrssaf", "telephone", "updatedAt" FROM "Settings";
DROP TABLE "Settings";
ALTER TABLE "new_Settings" RENAME TO "Settings";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
