-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Settings" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT DEFAULT 1,
    "nomEntreprise" TEXT NOT NULL DEFAULT 'Mon activité EAPAS',
    "siret" TEXT,
    "adresse" TEXT,
    "telephone" TEXT,
    "email" TEXT,
    "mentionTVA" TEXT NOT NULL DEFAULT 'TVA non applicable, article 293 B du CGI',
    "tauxUrssaf" REAL NOT NULL DEFAULT 24.6,
    "portalEnabled" BOOLEAN NOT NULL DEFAULT false,
    "assuranceRCPro" TEXT,
    "prochainDevis" INTEGER NOT NULL DEFAULT 1,
    "prochainFacture" INTEGER NOT NULL DEFAULT 1,
    "prochainContrat" INTEGER NOT NULL DEFAULT 1,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Patient" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "numDossier" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "prenom" TEXT NOT NULL,
    "dateNaissance" DATETIME,
    "genre" TEXT,
    "telephone" TEXT,
    "email" TEXT,
    "adresse" TEXT,
    "metier" TEXT NOT NULL DEFAULT 'EAPAS',
    "pathologieALD" TEXT,
    "medecinPrescripteur" TEXT,
    "numPrescription" TEXT,
    "datePrescription" DATETIME,
    "dateBilanInitial" DATETIME,
    "objectifPrincipal" TEXT,
    "limitations" TEXT,
    "statutSuivi" TEXT NOT NULL DEFAULT 'Bilan initial à faire',
    "consentementRGPD" BOOLEAN NOT NULL DEFAULT false,
    "dateConsentement" DATETIME,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "EntretienInitial" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "patientId" TEXT NOT NULL,
    "date" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ressentiDemarrage" TEXT,
    "experienceAnterieure" TEXT,
    "quotidien" TEXT,
    "depuisQuand" TEXT,
    "prescritConseillePar" TEXT,
    "declencheur" TEXT,
    "representationAP" TEXT,
    "souvenirPositif" TEXT,
    "objectifPatientMots" TEXT,
    "gesteAPreserver" TEXT,
    "limitationsMedecin" TEXT,
    "douleursApprehensions" TEXT,
    "attentesCoach" TEXT,
    "freinsPotentiels" TEXT,
    "modaliteCommunication" TEXT,
    "tempsAssisParJour" INTEGER,
    "activitesActuelles" TEXT,
    "evaDouleur" INTEGER,
    "chutes12Mois" BOOLEAN,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "EntretienInitial_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "BilanClinique" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "patientId" TEXT NOT NULL,
    "phase" TEXT NOT NULL,
    "date" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "tm6Distance" REAL,
    "tm6Borg" INTEGER,
    "tm6FCMax" INTEGER,
    "tm6SpO2" REAL,
    "tugTemps" REAL,
    "equilibreYO" REAL,
    "equilibreYF" REAL,
    "leversChaise" INTEGER,
    "handgrip" REAL,
    "pompesMur" INTEGER,
    "flexionTronc" REAL,
    "observations" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "BilanClinique_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ObjectifSMART" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "patientId" TEXT NOT NULL,
    "texteOriginal" TEXT NOT NULL,
    "texteSMART" TEXT NOT NULL,
    "dateCible" DATETIME,
    "atteint" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ObjectifSMART_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "IPAQEvaluation" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "patientId" TEXT NOT NULL,
    "date" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "marcheJours" INTEGER NOT NULL DEFAULT 0,
    "marcheMinutes" INTEGER NOT NULL DEFAULT 0,
    "modJours" INTEGER NOT NULL DEFAULT 0,
    "modMinutes" INTEGER NOT NULL DEFAULT 0,
    "vigJours" INTEGER NOT NULL DEFAULT 0,
    "vigMinutes" INTEGER NOT NULL DEFAULT 0,
    "tempsAssisMinutes" INTEGER,
    "scoreTotal" REAL NOT NULL,
    "classification" TEXT NOT NULL,
    CONSTRAINT "IPAQEvaluation_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "BilanNutritionnel" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "patientId" TEXT NOT NULL,
    "date" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "taille" REAL NOT NULL,
    "poids" REAL NOT NULL,
    "tourDeTaille" REAL,
    "age" INTEGER NOT NULL,
    "sexe" TEXT NOT NULL,
    "nap" REAL NOT NULL,
    "objectifPonderal" TEXT NOT NULL,
    "imc" REAL NOT NULL,
    "classificationIMC" TEXT NOT NULL,
    "metabolismeBase" REAL NOT NULL,
    "depenseTotale" REAL NOT NULL,
    "apportCalorique" REAL NOT NULL,
    "apportProteines" REAL NOT NULL,
    "apportLipides" REAL NOT NULL,
    "apportGlucides" REAL NOT NULL,
    "hydratation" REAL NOT NULL,
    CONSTRAINT "BilanNutritionnel_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Seance" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "patientId" TEXT NOT NULL,
    "date" DATETIME NOT NULL,
    "type" TEXT,
    "format" TEXT,
    "statut" TEXT NOT NULL DEFAULT 'Planifiée',
    "contenu" TEXT,
    "borgRessenti" INTEGER,
    "notes" TEXT,
    CONSTRAINT "Seance_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Abonnement" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "patientId" TEXT NOT NULL,
    "formule" TEXT NOT NULL,
    "montantMensuel" REAL NOT NULL,
    "dateDebut" DATETIME NOT NULL,
    "jourPrelevement" INTEGER,
    "dateDernierPaiement" DATETIME,
    "prochainPaiement" DATETIME,
    "statutPaiement" TEXT NOT NULL DEFAULT 'À jour',
    CONSTRAINT "Abonnement_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Devis" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "numero" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "date" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "validiteJours" INTEGER NOT NULL DEFAULT 30,
    "lignes" TEXT NOT NULL,
    "total" REAL NOT NULL,
    "statut" TEXT NOT NULL DEFAULT 'Envoyé',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Devis_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Contrat" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "numero" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "dateDebut" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "formule" TEXT,
    "inclusions" TEXT,
    "dureeMois" INTEGER,
    "frequenceSeances" TEXT,
    "tarif" REAL,
    "modalitePaiement" TEXT,
    "conditionsAnnulation" TEXT,
    "statut" TEXT NOT NULL DEFAULT 'Actif',
    "signeLe" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Contrat_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Facture" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "numero" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "date" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lignes" TEXT NOT NULL,
    "total" REAL NOT NULL,
    "modeReglement" TEXT,
    "statut" TEXT NOT NULL DEFAULT 'Émise',
    "dateEcheance" DATETIME,
    "datePaiement" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Facture_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SAVTicket" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "patientId" TEXT,
    "sujet" TEXT NOT NULL,
    "description" TEXT,
    "statut" TEXT NOT NULL DEFAULT 'Ouvert',
    "priorite" TEXT NOT NULL DEFAULT 'Normale',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" DATETIME,
    CONSTRAINT "SAVTicket_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PatientAccess" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "patientId" TEXT NOT NULL,
    "codeHash" TEXT NOT NULL,
    "actif" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastLoginAt" DATETIME,
    CONSTRAINT "PatientAccess_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Patient_numDossier_key" ON "Patient"("numDossier");

-- CreateIndex
CREATE UNIQUE INDEX "Abonnement_patientId_key" ON "Abonnement"("patientId");

-- CreateIndex
CREATE UNIQUE INDEX "Devis_numero_key" ON "Devis"("numero");

-- CreateIndex
CREATE UNIQUE INDEX "Contrat_numero_key" ON "Contrat"("numero");

-- CreateIndex
CREATE UNIQUE INDEX "Facture_numero_key" ON "Facture"("numero");

-- CreateIndex
CREATE UNIQUE INDEX "PatientAccess_patientId_key" ON "PatientAccess"("patientId");

