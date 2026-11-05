import { prisma } from "@/lib/db";
import { formatRepasStructureResume } from "@/lib/categories-ration";

/**
 * Contexte patient anonymisé (pas de nom, pas de coordonnées) à fournir à l'assistant IA. Commun à
 * toutes les générations IA (fiche de séance, objectif SMART, planning, observations de bilan,
 * programme nutrition…) : inclut systématiquement l'entretien initial, les bilans (clinique ET
 * nutritionnel), l'IPAQ, les objectifs SMART déjà posés et le modèle de ration actif — chaque section
 * n'apparaît que si la donnée existe, donc le contexte s'adapte naturellement au pôle du patient
 * (EAPAS, Nutrition, ou les deux) sans bascule explicite.
 */
export async function buildPatientContext(patientId: string): Promise<string> {
  const patient = await prisma.patient.findUnique({
    where: { id: patientId },
    include: {
      entretiens: { orderBy: { date: "desc" }, take: 1 },
      bilans: { orderBy: { date: "desc" }, take: 1 },
      bilansNutrition: { orderBy: { date: "desc" }, take: 1 },
      ipaqEvaluations: { orderBy: { date: "desc" }, take: 1 },
      objectifs: { orderBy: { createdAt: "desc" } },
      modelesRation: { orderBy: { updatedAt: "desc" }, take: 1 },
      seances: { where: { statut: "Faite" }, orderBy: { date: "desc" }, take: 2 },
    },
  });
  if (!patient) throw new Error("Patient introuvable.");

  const age = patient.dateNaissance
    ? Math.floor((Date.now() - patient.dateNaissance.getTime()) / (365.25 * 24 * 3600 * 1000))
    : null;

  const lignes: string[] = [];
  lignes.push(`Pôle de suivi : ${patient.metier}`);
  lignes.push(`Âge : ${age ?? "non renseigné"}`);
  if (patient.pathologieALD) lignes.push(`Pathologie / ALD : ${patient.pathologieALD}`);
  if (patient.limitations) lignes.push(`Limitations connues : ${patient.limitations}`);

  const entretien = patient.entretiens[0];
  if (entretien?.objectifPatientMots) {
    lignes.push(`Objectif exprimé par le patient en entretien initial : ${entretien.objectifPatientMots}`);
  }
  if (entretien?.declencheur) {
    lignes.push(`Déclencheur de la démarche : ${entretien.declencheur}`);
  }
  if (entretien?.attentesCoach) {
    lignes.push(`Attentes vis-à-vis de l'accompagnement : ${entretien.attentesCoach}`);
  }
  if (entretien?.freinsPotentiels) {
    lignes.push(`Freins potentiels identifiés : ${entretien.freinsPotentiels}`);
  }
  if (entretien?.gesteAPreserver) {
    lignes.push(`Geste ou activité à préserver/retrouver : ${entretien.gesteAPreserver}`);
  }
  if (entretien?.douleursApprehensions) {
    lignes.push(`Douleurs / appréhensions rapportées : ${entretien.douleursApprehensions}`);
  }
  if (entretien?.limitationsMedecin) {
    lignes.push(`Limitations indiquées par le médecin : ${entretien.limitationsMedecin}`);
  }
  if (entretien?.activitesActuelles) {
    lignes.push(`Activités actuelles : ${entretien.activitesActuelles}`);
  }

  const bilan = patient.bilans[0];
  if (bilan) {
    lignes.push(
      `Dernier bilan clinique (${bilan.phase}) : TUG ${bilan.tugTemps ?? "n/d"}s, levers de chaise 30s ${bilan.leversChaise ?? "n/d"}, handgrip ${bilan.handgrip ?? "n/d"}kg.`
    );
    if (bilan.tugTemps && bilan.tugTemps > 12) {
      lignes.push("Attention : TUG > 12s, risque de chute accru — prudence sur l'équilibre.");
    }
  } else if (patient.metier !== "Nutrition") {
    lignes.push("Aucun bilan clinique initial enregistré pour l'instant.");
  }

  const bilanNutrition = patient.bilansNutrition[0];
  if (bilanNutrition) {
    lignes.push(
      `Dernier bilan nutritionnel : IMC ${bilanNutrition.imc.toFixed(1)} (${bilanNutrition.classificationIMC}), objectif pondéral : ${bilanNutrition.objectifPonderal}, apport calorique cible ${Math.round(bilanNutrition.apportCalorique)} kcal/j (protéines ${Math.round(bilanNutrition.apportProteines)}g, lipides ${Math.round(bilanNutrition.apportLipides)}g, glucides ${Math.round(bilanNutrition.apportGlucides)}g).`
    );
  }

  const ipaq = patient.ipaqEvaluations[0];
  if (ipaq) {
    lignes.push(`Dernière évaluation IPAQ : score ${Math.round(ipaq.scoreTotal)} MET-min/semaine, niveau d'activité ${ipaq.classification}.`);
  }

  const objectifsActifs = patient.objectifs.filter((o) => !o.atteint);
  if (objectifsActifs.length > 0) {
    lignes.push("Objectifs SMART déjà posés et en cours (à ne pas contredire sans raison) :");
    for (const o of objectifsActifs) {
      lignes.push(`- ${o.texteSMART}${o.dateCible ? ` (échéance : ${o.dateCible.toISOString().slice(0, 10)})` : ""}`);
    }
  }

  const modele = patient.modelesRation[0];
  if (modele) {
    lignes.push(`Modèle de ration actif : "${modele.nom}", ${modele.targetKcal} kcal/j.`);
  }

  if (patient.seances.length > 0) {
    lignes.push("Dernières séances réalisées :");
    for (const s of patient.seances) {
      const parts = [s.type ?? "Séance"];
      if (s.borgRessenti !== null) parts.push(`ressenti ${s.borgRessenti}/10`);
      if (s.notes) parts.push(`retour : ${s.notes}`);
      lignes.push(`- ${parts.join(" · ")}`);
    }
  }

  return lignes.join("\n");
}

export interface SeanceManqueeInfo {
  id: string;
  date: Date;
  type: string | null;
}

/** Contexte patient anonymisé, enrichi pour le suivi continu (③) : séances manquées,
 * tendance du ressenti et journal de bord récent, en plus de buildPatientContext(). */
export async function buildSuiviContext(patientId: string): Promise<{ contexte: string; seancesManquees: SeanceManqueeInfo[] }> {
  const base = await buildPatientContext(patientId);

  const maintenant = new Date();
  const septJoursAvant = new Date(maintenant.getTime() - 7 * 24 * 3600 * 1000);

  const [seancesManquees, journalRecent] = await Promise.all([
    prisma.seance.findMany({
      where: { patientId, statut: "Planifiée", date: { lt: maintenant } },
      orderBy: { date: "asc" },
      select: { id: true, date: true, type: true },
    }),
    prisma.journalEntree.findMany({
      where: { patientId, date: { gte: septJoursAvant } },
      orderBy: { date: "desc" },
      take: 10,
    }),
  ]);

  const lignes: string[] = [base];

  if (seancesManquees.length > 0) {
    lignes.push(
      "\nSéances planifiées non confirmées (date passée, statut jamais mis à jour en \"Faite\" ou \"Annulée\") :"
    );
    for (const s of seancesManquees) {
      lignes.push(`- ${s.type ?? "Séance"} du ${s.date.toLocaleDateString("fr-FR")}`);
    }
  } else {
    lignes.push("\nAucune séance manquée actuellement.");
  }

  if (journalRecent.length > 0) {
    lignes.push("\nJournal de bord rempli par le patient (7 derniers jours, dans ses propres mots) :");
    for (const j of journalRecent) {
      const parts = [j.date.toLocaleDateString("fr-FR")];
      const repasStructure = formatRepasStructureResume(j.repasStructure);
      if (repasStructure) parts.push(`repas : ${repasStructure}`);
      if (j.repas) parts.push(`repas/boissons : ${j.repas}`);
      if (j.activite) {
        const duree = j.dureeMinutes ? `${j.dureeMinutes} min` : null;
        parts.push(`activité : ${j.activite}${duree ? ` (${duree}${j.heure ? `, ${j.heure}` : ""})` : ""}`);
      } else {
        parts.push("aucune activité ce jour-là");
      }
      if (j.motivation !== null) parts.push(`motivation ${j.motivation}/10`);
      if (j.notes) parts.push(`notes : ${j.notes}`);
      lignes.push(`- ${parts.join(" · ")}`);
    }
  } else {
    lignes.push("\nAucune entrée de journal sur les 7 derniers jours.");
  }

  return { contexte: lignes.join("\n"), seancesManquees };
}
