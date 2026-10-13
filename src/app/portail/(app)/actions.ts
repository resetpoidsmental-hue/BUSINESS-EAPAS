"use server";

import { revalidatePath } from "next/cache";
import { getPatientSession } from "@/lib/auth";
import { prisma } from "@/lib/db";

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

export async function ajouterJournalAction(
  _prev: JournalActionState,
  formData: FormData
): Promise<JournalActionState> {
  const session = await getPatientSession();
  if (!session) return { error: "Session expirée, reconnecte-toi." };

  const repas = strOrNull(formData, "repas");
  const activite = strOrNull(formData, "activite");
  const heure = strOrNull(formData, "heure");
  const notes = strOrNull(formData, "notes");
  const dureeRaw = strOrNull(formData, "dureeMinutes");
  const motivationRaw = strOrNull(formData, "motivation");

  if (!repas && !activite && !notes) {
    return { error: "Remplis au moins un champ avant d'enregistrer." };
  }

  await prisma.journalEntree.create({
    data: {
      patientId: session.patientId,
      date: new Date(),
      repas,
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
