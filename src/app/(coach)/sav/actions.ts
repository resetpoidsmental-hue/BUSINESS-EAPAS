"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { assistantIADisponible, genererReponseSAV } from "@/lib/ai";
import { buildPatientContext } from "@/lib/patient-context";
import { envoyerNotificationPatient, emailDisponible } from "@/lib/email";

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

export async function deleteTicket(ticketId: string) {
  await prisma.sAVTicket.delete({ where: { id: ticketId } });
  revalidatePath("/sav");
}

export interface GenererReponseState {
  error?: string;
  reponse?: string;
}

export async function genererReponseSAVAction(_prev: GenererReponseState, formData: FormData): Promise<GenererReponseState> {
  if (!assistantIADisponible()) {
    return { error: "L'assistant IA n'est pas configuré (clé API manquante)." };
  }

  const ticketId = formData.get("ticketId");
  if (typeof ticketId !== "string" || !ticketId) return { error: "Ticket manquant." };

  const ticket = await prisma.sAVTicket.findUnique({ where: { id: ticketId } });
  if (!ticket) return { error: "Ticket introuvable." };
  if (!ticket.patientId) return { error: "Ce ticket n'est lié à aucun patient." };

  try {
    const patientContext = await buildPatientContext(ticket.patientId);
    const reponse = await genererReponseSAV({ patientContext, sujet: ticket.sujet, message: ticket.description });
    return { reponse };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Erreur inattendue lors de la génération." };
  }
}

export interface EnvoyerReponseState {
  error?: string;
  success?: string;
}

export async function envoyerReponseSAVAction(_prev: EnvoyerReponseState, formData: FormData): Promise<EnvoyerReponseState> {
  const ticketId = formData.get("ticketId");
  const texteRaw = formData.get("texte");
  if (typeof ticketId !== "string" || !ticketId) return { error: "Ticket manquant." };

  const texte = typeof texteRaw === "string" ? texteRaw.trim() : "";
  if (!texte) return { error: "La réponse est vide." };

  const ticket = await prisma.sAVTicket.findUnique({
    where: { id: ticketId },
    include: { patient: { select: { id: true, nom: true, prenom: true, email: true } } },
  });
  if (!ticket) return { error: "Ticket introuvable." };
  if (!ticket.patient) return { error: "Ce ticket n'est lié à aucun patient." };

  await prisma.$transaction([
    prisma.sAVTicket.update({ where: { id: ticketId }, data: { reponse: texte, reponseEnvoyeeAt: new Date() } }),
    prisma.messageCoach.create({ data: { patientId: ticket.patient.id, contenu: texte } }),
  ]);

  if (ticket.patient.email && emailDisponible()) {
    try {
      await envoyerNotificationPatient({
        destinataire: ticket.patient.email,
        nomPatient: `${ticket.patient.prenom} ${ticket.patient.nom}`,
        sujet: ticket.sujet,
        texte,
      });
    } catch (e) {
      console.error("Échec de l'email de réponse SAV:", e);
    }
  }

  revalidatePath("/sav");
  revalidatePath("/portail");
  return { success: "Réponse envoyée." };
}
