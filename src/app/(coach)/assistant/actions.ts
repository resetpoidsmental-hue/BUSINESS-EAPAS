"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { genererFicheSeance, assistantIADisponible } from "@/lib/ai";
import { isFicheSeance, type FicheSeance } from "@/lib/fiche-seance";

export interface GenererState {
  error?: string;
  fiche?: FicheSeance;
}

async function buildPatientContext(patientId: string): Promise<string> {
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

export async function genererFicheSeanceAction(_prev: GenererState, formData: FormData): Promise<GenererState> {
  if (!assistantIADisponible()) {
    return { error: "L'assistant IA n'est pas configuré (clé API manquante)." };
  }

  const patientId = formData.get("patientId");
  const consigneRaw = formData.get("consigne");
  if (typeof patientId !== "string" || !patientId) return { error: "Choisis un patient." };

  const consigne =
    typeof consigneRaw === "string" && consigneRaw.trim()
      ? consigneRaw.trim()
      : "Prépare la prochaine séance de ce patient en te basant sur son profil et sa dernière séance.";

  try {
    const patientContext = await buildPatientContext(patientId);
    const fiche = await genererFicheSeance({ patientContext, consigne });
    return { fiche };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Erreur inattendue lors de la génération." };
  }
}

export interface ValiderState {
  error?: string;
  success?: string;
}

export async function validerFicheSeanceAction(_prev: ValiderState, formData: FormData): Promise<ValiderState> {
  const seanceId = formData.get("seanceId");
  const patientId = formData.get("patientId");
  const ficheJson = formData.get("ficheJson");
  const texteEditeRaw = formData.get("texteEdite");
  const materielRaw = formData.get("materielNecessaire");

  if (typeof patientId !== "string" || !patientId) return { error: "Patient manquant." };
  if (typeof seanceId !== "string" || !seanceId) {
    return { error: "Choisis une séance planifiée à compléter avant de valider." };
  }

  const texteEdite = typeof texteEditeRaw === "string" ? texteEditeRaw.trim() : "";
  let contenu: string;

  if (texteEdite) {
    contenu = texteEdite;
  } else if (typeof ficheJson === "string" && ficheJson) {
    let parsed: unknown;
    try {
      parsed = JSON.parse(ficheJson);
    } catch {
      return { error: "Fiche invalide, impossible de l'enregistrer." };
    }
    if (!isFicheSeance(parsed)) return { error: "Fiche invalide, impossible de l'enregistrer." };
    contenu = JSON.stringify(parsed);
  } else {
    return { error: "Rien à enregistrer." };
  }

  const materielNecessaire = typeof materielRaw === "string" && materielRaw.trim() ? materielRaw.trim() : null;

  await prisma.seance.update({
    where: { id: seanceId },
    data: {
      contenu,
      genereParIA: true,
      materielNecessaire,
      materielVu: false,
    },
  });

  revalidatePath(`/patients/${patientId}`);
  revalidatePath("/assistant");
  revalidatePath("/portail");

  return { success: "Fiche enregistrée dans le dossier du patient." };
}
