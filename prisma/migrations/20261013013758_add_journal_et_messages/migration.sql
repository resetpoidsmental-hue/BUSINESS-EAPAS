-- CreateTable
CREATE TABLE "JournalEntree" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "patientId" TEXT NOT NULL,
    "date" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "repas" TEXT,
    "activite" TEXT,
    "dureeMinutes" INTEGER,
    "heure" TEXT,
    "motivation" INTEGER,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "JournalEntree_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "MessageCoach" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "patientId" TEXT NOT NULL,
    "contenu" TEXT NOT NULL,
    "lu" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "MessageCoach_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
