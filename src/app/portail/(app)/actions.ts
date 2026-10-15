"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getPatientSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { MEAL_KEYS, type MealKey } from "@/lib/categories-ration";
import { creerSessionPremierPaiement, creerSessionMiseAJourCarte, stripeDisponible } from "@/lib/stripe";

export interface PaiementActionState {
  error?: string;
}

export async function demarrerEnregistrementCarteAction(
  _prev: PaiementActionState,
  _formData: FormData
): Promise<PaiementActionState> {
  const session = await getPatientSession();
  if (!session) return { error: "Session expirée, reconnecte-toi." };
  if (!stripeDisponible()) return { error: "Le paiement en ligne n'est pas encore configuré — contacte ton coach." };

  const abonnement = await prisma.abonnement.findUnique({
    where: { patientId: session.patientId },
    include: { patient: { select: { email: true } } },
  });
  if (!abonnement) return { error: "Aucun abonnement actif n'a été trouvé." };

  let url: string;
  try {
    url = await creerSessionPremierPaiement({
      abonnementId: abonnement.id,
      patientId: session.patientId,
      patientEmail: abonnement.patient.email,
      montant: abonnement.montantMensuel,
      formule: abonnement.formule,
      stripeCustomerId: abonnement.stripeCustomerId,
    });
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Impossible de démarrer le paiement." };
  }

  redirect(url);
}

export async function demarrerMiseAJourCarteAction(
  _prev: PaiementActionState,
  _formData: FormData
): Promise<PaiementActionState> {
  const session = await getPatientSession();
  if (!session) return { error: "Session expirée, reconnecte-toi." };
  if (!stripeDisponible()) return { error: "Le paiement en ligne n'est pas encore configuré — contacte ton coach." };

  const abonnement = await prisma.abonnement.findUnique({ where: { patientId: session.patientId } });
  if (!abonnement || !abonnement.stripeCustomerId) {
    return { error: "Enregistre d'abord un moyen de paiement avant de pouvoir le modifier." };
  }

  let url: string;
  try {
    url = await creerSessionMiseAJourCarte({
      abonnementId: abonnement.id,
      patientId: session.patientId,
      stripeCustomerId: abonnement.stripeCustomerId,
    });
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Impossible de démarrer la mise à jour." };
  }

  redirect(url);
}

export async function suspendrePrelevementAction() {
  const session = await getPatientSession();
  if (!session) return;
  await prisma.abonnement.updateMany({
    where: { patientId: session.patientId },
    data: { prelevementActif: false },
  });
  revalidatePath("/portail/paiement");
}

export async function marquerMaterielVu(seanceId: string) {
  const session = await getPatientSession();
  if (!session) return;

  // On ne modifie que les séances du patient connecté, jamais un id arbitraire reçu du client.
  await prisma.seance.updateMany({
    where: { id: seanceId, patientId: session.patientId },
    data: { materielVu: true },
  });

  revalidatePath("/portail");
}

export async function marquerMessageLu(messageId: string) {
  const session = await getPatientSession();
  if (!session) return;

  await prisma.messageCoach.updateMany({
    where: { id: messageId, patientId: session.patientId },
    data: { lu: true },
  });

  revalidatePath("/portail");
}

export interface JournalActionState {
  error?: string;
  success?: string;
}

function strOrNull(formData: FormData, key: string) {
  const v = formData.get(key);
  return typeof v === "string" && v.trim() ? v.trim() : null;
}

/** Parsing permissif : ne garde que les repas/catégories/portions valides, ignore le reste
 * plutôt que de rejeter toute la saisie. */
function parseRepasStructure(raw: string | null): string | null {
  if (!raw) return null;
  try {
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== "object" || parsed === null) return null;

    const cleaned: Partial<Record<MealKey, Record<string, number>>> = {};
    for (const meal of MEAL_KEYS) {
      const mealPicks = (parsed as Record<string, unknown>)[meal];
      if (typeof mealPicks !== "object" || mealPicks === null) continue;
      const entries = Object.entries(mealPicks as Record<string, unknown>).filter(
        ([, v]) => typeof v === "number" && v > 0
      );
      if (entries.length > 0) cleaned[meal] = Object.fromEntries(entries) as Record<string, number>;
    }

    return Object.keys(cleaned).length > 0 ? JSON.stringify(cleaned) : null;
  } catch {
    return null;
  }
}

export async function ajouterJournalAction(
  _prev: JournalActionState,
  formData: FormData
): Promise<JournalActionState> {
  const session = await getPatientSession();
  if (!session) return { error: "Session expirée, reconnecte-toi." };

  const repasStructure = parseRepasStructure(strOrNull(formData, "repasStructureJson"));
  const activite = strOrNull(formData, "activite");
  const heure = strOrNull(formData, "heure");
  const notes = strOrNull(formData, "notes");
  const dureeRaw = strOrNull(formData, "dureeMinutes");
  const motivationRaw = strOrNull(formData, "motivation");

  if (!repasStructure && !activite && !notes) {
    return { error: "Remplis au moins un champ avant d'enregistrer." };
  }

  await prisma.journalEntree.create({
    data: {
      patientId: session.patientId,
      date: new Date(),
      repasStructure,
      activite,
      heure,
      notes,
      dureeMinutes: dureeRaw ? Number(dureeRaw) : null,
      motivation: motivationRaw ? Number(motivationRaw) : null,
    },
  });

  revalidatePath("/portail/journal");
  revalidatePath(`/patients/${session.patientId}`);
  return { success: "Journal enregistré." };
}
