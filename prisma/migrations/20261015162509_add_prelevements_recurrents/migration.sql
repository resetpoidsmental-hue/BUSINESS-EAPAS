-- CreateTable
CREATE TABLE "Prelevement" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "abonnementId" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "factureId" TEXT,
    "montant" REAL NOT NULL,
    "statut" TEXT NOT NULL DEFAULT 'En attente',
    "motifEchec" TEXT,
    "stripePaymentIntentId" TEXT,
    "date" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Prelevement_abonnementId_fkey" FOREIGN KEY ("abonnementId") REFERENCES "Abonnement" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Prelevement_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Prelevement_factureId_fkey" FOREIGN KEY ("factureId") REFERENCES "Facture" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Abonnement" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "patientId" TEXT NOT NULL,
    "formule" TEXT NOT NULL,
    "montantMensuel" REAL NOT NULL,
    "dateDebut" DATETIME NOT NULL,
    "jourPrelevement" INTEGER,
    "dateDernierPaiement" DATETIME,
    "prochainPaiement" DATETIME,
    "statutPaiement" TEXT NOT NULL DEFAULT 'À jour',
    "prelevementActif" BOOLEAN NOT NULL DEFAULT true,
    "stripeCustomerId" TEXT,
    "stripePaymentMethodId" TEXT,
    "cardBrand" TEXT,
    "cardLast4" TEXT,
    "cardExpMois" INTEGER,
    "cardExpAnnee" INTEGER,
    CONSTRAINT "Abonnement_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Abonnement" ("dateDebut", "dateDernierPaiement", "formule", "id", "jourPrelevement", "montantMensuel", "patientId", "prochainPaiement", "statutPaiement") SELECT "dateDebut", "dateDernierPaiement", "formule", "id", "jourPrelevement", "montantMensuel", "patientId", "prochainPaiement", "statutPaiement" FROM "Abonnement";
DROP TABLE "Abonnement";
ALTER TABLE "new_Abonnement" RENAME TO "Abonnement";
CREATE UNIQUE INDEX "Abonnement_patientId_key" ON "Abonnement"("patientId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "Prelevement_factureId_key" ON "Prelevement"("factureId");
