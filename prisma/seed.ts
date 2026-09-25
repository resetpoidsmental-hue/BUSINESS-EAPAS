import { PrismaClient } from "@prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import bcrypt from "bcryptjs";
import { calculerScoreIPAQ, calculerBilanNutritionnel } from "../src/lib/calculs";

const dbUrl = process.env.DATABASE_URL ?? "file:./prisma/dev.db";
const adapter = new PrismaBetterSqlite3({ url: dbUrl });
const prisma = new PrismaClient({ adapter });

async function main() {
  const email = "demo@eapas-suite.fr";
  const password = "demodemo123";

  const existing = await prisma.user.findUnique({ where: { email } });
  if (!existing) {
    await prisma.user.create({
      data: { email, nom: "Antoine Dupont", passwordHash: await bcrypt.hash(password, 12) },
    });
    console.log(`Compte coach créé — email: ${email} / mot de passe: ${password}`);
  }

  await prisma.settings.upsert({
    where: { id: 1 },
    update: {},
    create: {
      id: 1,
      nomEntreprise: "Antoine Dupont — EAPAS & Coaching Nutrition",
      siret: "123 456 789 00012",
      adresse: "12 rue de la Santé, 75013 Paris",
      telephone: "06 12 34 56 78",
      email: "contact@eapas-suite.fr",
      assuranceRCPro: "MAIF Pro — Contrat n°123456",
    },
  });

  if (await prisma.patient.count()) {
    console.log("Des patients existent déjà — seed ignoré pour les données de démo.");
    return;
  }

  // Patient 1 — Jean Bernard (parcours complet, cf. dossier-patient-eapas.xlsx)
  const jean = await prisma.patient.create({
    data: {
      numDossier: "DP-2026-001",
      nom: "Bernard",
      prenom: "Jean",
      dateNaissance: new Date("1958-05-14"),
      genre: "H",
      telephone: "06 11 22 33 44",
      email: "jean.bernard@example.com",
      metier: "EAPAS+Nutrition",
      pathologieALD: "Diabète Type 2 & Obésité",
      medecinPrescripteur: "Dr. Morel",
      numPrescription: "ORD-2026-112",
      datePrescription: new Date("2026-08-01"),
      dateBilanInitial: new Date("2026-08-01"),
      objectifPrincipal: "Reconditionnement aérobie, perte de masse grasse, autonomie",
      limitations: "Gonalgie droite modérée (EVA 3/10)",
      statutSuivi: "Suivi en cours",
      consentementRGPD: true,
      dateConsentement: new Date("2026-08-01"),
    },
  });

  await prisma.entretienInitial.create({
    data: {
      patientId: jean.id,
      date: new Date("2026-08-01"),
      ressentiDemarrage: "Un peu appréhensif mais motivé à retrouver de la mobilité.",
      experienceAnterieure: "Aucune pratique encadrée depuis 10 ans.",
      quotidien: "Sédentaire, travail de bureau, peu de déplacements à pied.",
      objectifPatientMots: "Pouvoir monter les escaliers jusqu'au 1er étage sans être essoufflé.",
      limitationsMedecin: "Éviter les chocs sur le genou droit.",
      evaDouleur: 3,
      chutes12Mois: false,
      tempsAssisParJour: 360,
      activitesActuelles: "Marche occasionnelle",
    },
  });

  await prisma.bilanClinique.create({
    data: {
      patientId: jean.id,
      phase: "T0",
      date: new Date("2026-08-01"),
      tm6Distance: 410,
      tm6Borg: 15,
      tm6FCMax: 148,
      tm6SpO2: 94,
      tugTemps: 13.8,
      equilibreYO: 15,
      equilibreYF: 5,
      leversChaise: 10,
      handgrip: 26,
      pompesMur: 12,
      flexionTronc: 12,
      observations: "Bilan initial — bonne motivation, prudence sur le genou droit.",
    },
  });
  await prisma.bilanClinique.create({
    data: {
      patientId: jean.id,
      phase: "T1",
      date: new Date("2026-09-01"),
      tm6Distance: 440,
      tm6Borg: 13,
      tm6FCMax: 142,
      tm6SpO2: 96,
      tugTemps: 12,
      equilibreYO: 22,
      equilibreYF: 8,
      leversChaise: 12,
      handgrip: 29,
      pompesMur: 16,
      flexionTronc: 7,
      observations: "Nette progression de l'endurance et de la force fonctionnelle.",
    },
  });

  const ipaq = calculerScoreIPAQ({ marcheJours: 5, marcheMinutes: 30, modJours: 3, modMinutes: 20, vigJours: 2, vigMinutes: 30 });
  await prisma.iPAQEvaluation.create({
    data: { patientId: jean.id, date: new Date("2026-08-01"), marcheJours: 5, marcheMinutes: 30, modJours: 3, modMinutes: 20, vigJours: 2, vigMinutes: 30, tempsAssisMinutes: 360, ...ipaq },
  });

  const nutri = calculerBilanNutritionnel({ poidsKg: 92.5, tailleCm: 172, age: 68, sexe: "H", nap: 1.375, objectifPonderal: "perte_progressive" });
  await prisma.bilanNutritionnel.create({
    data: { patientId: jean.id, date: new Date("2026-08-01"), taille: 172, poids: 92.5, tourDeTaille: 104, age: 68, sexe: "H", nap: 1.375, objectifPonderal: "perte_progressive", ...nutri },
  });

  await prisma.objectifSMART.create({
    data: {
      patientId: jean.id,
      texteOriginal: "Pouvoir monter les escaliers jusqu'au 1er étage sans être essoufflé.",
      texteSMART: "Monter 1 étage sans essoufflement significatif d'ici 2 mois (fin octobre 2026).",
      dateCible: new Date("2026-10-31"),
    },
  });

  for (const [i, date] of [["2026-09-05", "Faite"], ["2026-09-12", "Faite"], ["2026-10-03", "Planifiée"]].entries()) {
    await prisma.seance.create({
      data: {
        patientId: jean.id,
        date: new Date(date[0]),
        type: i === 2 ? "Endurance + équilibre" : "Renforcement membres inférieurs",
        format: "Individuel",
        statut: date[1],
        contenu: "Renforcement membres inf. (chaise, squats guidés) + travail d'équilibre",
        borgRessenti: 4,
        notes: "Bonne exécution, aisance en progrès.",
      },
    });
  }

  await prisma.abonnement.create({
    data: {
      patientId: jean.id,
      formule: "Formule 1 : Essentiel Santé & Forme",
      montantMensuel: 220,
      dateDebut: new Date("2026-08-01"),
      jourPrelevement: 1,
      dateDernierPaiement: new Date("2026-09-01"),
      prochainPaiement: new Date("2026-10-01"),
      statutPaiement: "À jour",
    },
  });

  await prisma.facture.create({
    data: {
      numero: "2026-001",
      patientId: jean.id,
      date: new Date("2026-08-01"),
      lignes: JSON.stringify([{ designation: "Formule 1 : Essentiel Santé & Forme — 1er mois", quantite: 1, prixUnitaire: 220 }]),
      total: 220,
      modeReglement: "Virement",
      statut: "Payée",
      datePaiement: new Date("2026-08-02"),
    },
  });
  await prisma.facture.create({
    data: {
      numero: "2026-002",
      patientId: jean.id,
      date: new Date("2026-09-01"),
      lignes: JSON.stringify([{ designation: "Formule 1 : Essentiel Santé & Forme — 2e mois", quantite: 1, prixUnitaire: 220 }]),
      total: 220,
      modeReglement: "Virement",
      statut: "Payée",
      datePaiement: new Date("2026-09-02"),
    },
  });
  await prisma.contrat.create({
    data: {
      numero: "C-2026-001",
      patientId: jean.id,
      dateDebut: new Date("2026-08-01"),
      formule: "Formule 1 : Essentiel Santé & Forme",
      inclusions:
        "Bilan initial complet : évaluation fonctionnelle APA (tests de terrain) et diagnostic nutritionnel\n4 séances d'APA guidées par mois (1 séance/semaine)\n1 programme d'entraînement autonome personnalisé\nCoaching nutritionnel de base (PNNS/ANSES)\n1 entretien de suivi mensuel de 30 min",
      dureeMois: 3,
      frequenceSeances: "4 séances / mois (1/semaine)",
      tarif: 220,
      modalitePaiement: "Virement mensuel le 1er du mois",
      conditionsAnnulation: "Toute séance annulée moins de 24h avant reste due, sauf cas de force majeure.",
      signeLe: new Date("2026-08-01"),
    },
  });

  // Patient 2 — Sophie Martin (Parkinson, en cours, plus léger)
  const sophie = await prisma.patient.create({
    data: {
      numDossier: "DP-2026-002",
      nom: "Martin",
      prenom: "Sophie",
      dateNaissance: new Date("1952-02-20"),
      genre: "F",
      telephone: "06 22 33 44 55",
      metier: "EAPAS",
      pathologieALD: "Parkinson (Stade 2)",
      medecinPrescripteur: "Dr. Laurent",
      dateBilanInitial: new Date("2026-08-05"),
      objectifPrincipal: "Travail de l'équilibre et prévention des chutes",
      statutSuivi: "Suivi en cours",
      consentementRGPD: true,
      dateConsentement: new Date("2026-08-05"),
    },
  });
  await prisma.bilanClinique.create({
    data: {
      patientId: sophie.id,
      phase: "T0",
      date: new Date("2026-08-05"),
      tugTemps: 14.5,
      equilibreYO: 10,
      equilibreYF: 3,
      leversChaise: 8,
      observations: "Priorité : équilibre et prévention des chutes.",
    },
  });
  await prisma.seance.create({
    data: { patientId: sophie.id, date: new Date("2026-10-05T09:00:00"), type: "Équilibre", format: "Individuel", statut: "Planifiée" },
  });

  // Patient 3 — dossier vierge à compléter (montre le statut "Bilan initial à faire")
  await prisma.patient.create({
    data: {
      numDossier: "DP-2026-003",
      nom: "Petit",
      prenom: "Isabelle",
      metier: "Nutrition",
      pathologieALD: "Oncologie (post-chirurgie sein)",
      statutSuivi: "Bilan initial à faire",
    },
  });

  await prisma.sAVTicket.create({
    data: {
      patientId: jean.id,
      sujet: "Question sur la facture de septembre",
      description: "Le client demande si la facture peut être envoyée aussi à son épouse.",
      statut: "Ouvert",
      priorite: "Basse",
    },
  });

  console.log("Données de démonstration créées : 3 patients, bilans, séances, contrat, factures.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => process.exit(0));
