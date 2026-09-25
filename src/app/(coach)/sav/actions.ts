"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";

export interface ActionState {
  error?: string;
  success?: string;
}

function str(formData: FormData, key: string) {
  const v = formData.get(key);
  return typeof v === "string" && v.trim() !== "" ? v.trim() : null;
}

export async function createTicket(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const sujet = str(formData, "sujet");
  if (!sujet) return { error: "Le sujet est obligatoire." };

  await prisma.sAVTicket.create({
    data: {
      sujet,
      description: str(formData, "description"),
      patientId: str(formData, "patientId"),
      priorite: str(formData, "priorite") ?? "Normale",
    },
  });

  revalidatePath("/sav");
  return { success: "Ticket créé." };
}

export async function updateTicketStatut(ticketId: string, statut: string) {
  await prisma.sAVTicket.update({
    where: { id: ticketId },
    data: { statut, resolvedAt: statut === "Résolu" ? new Date() : null },
  });
  revalidatePath("/sav");
}
