import { prisma } from "@/lib/db";

/** Contexte patient anonymisé (pas de nom, pas de coordonnées) à fournir à l'assistant IA. */
export async function buildPatientContext(patientId: string): Promise<string> {
  const patient = await prisma.patient.findUnique({
    where: { id: patientId },
    include: {
      entretiens: { orderBy: { date: "desc" }, take: 1 },
      bilans: { orderBy: { date: "desc" }, take: 1 },
      seances: { where: { statut: "Faite" }, orderBy: { date: "desc" }, take: 2 },
    },
  });
  if (!patient) throw new Error("Patient introuvable.");

  const age = patient.dateNaissance
    ? Math.floor((Date.now() - patient.dateNaissance.getTime()) / (365.25 * 24 * 3600 * 1000))
    : null;

  const lignes: string[] = [];
  lignes.push(`Âge : ${age ?? "non renseigné"}`);
  if (patient.pathologieALD) lignes.push(`Pathologie / ALD : ${patient.pathologieALD}`);
  if (patient.limitations) lignes.push(`Limitations connues : ${patient.limitations}`);

  const entretien = patient.entretiens[0];
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
  } else {
    lignes.push("Aucun bilan clinique initial enregistré pour l'instant.");
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
