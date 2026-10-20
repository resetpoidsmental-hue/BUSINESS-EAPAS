"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { genererFicheSeance, assistantIADisponible } from "@/lib/ai";
import { buildPatientContext } from "@/lib/patient-context";
import { isFicheSeance, type FicheSeance } from "@/lib/fiche-seance";
import { telegramDisponible, envoyerMessageTelegram } from "@/lib/telegram";
import { formatDateHeureParis } from "@/lib/utils";

export interface GenererState {
  error?: string;
  fiche?: FicheSeance;
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

  const seance = await prisma.seance.update({
    where: { id: seanceId },
    data: {
      contenu,
      genereParIA: true,
      materielNecessaire,
      materielVu: false,
    },
    include: { patient: { select: { prenom: true, nom: true } } },
  });

  revalidatePath(`/patients/${patientId}`);
  revalidatePath("/assistant");
  revalidatePath("/portail");

  if (telegramDisponible()) {
    try {
      await envoyerMessageTelegram(
        `✅ Fiche prête — ${seance.patient.prenom} ${seance.patient.nom}\nSéance du ${formatDateHeureParis(seance.date)}, préparée par l'IA.\nÀ relire et ajuster si besoin dans sa fiche patient.`
      );
    } catch (e) {
      console.error("Échec de la notification Telegram (fiche prête):", e);
    }
  }

  return { success: "Fiche enregistrée dans le dossier du patient." };
}
