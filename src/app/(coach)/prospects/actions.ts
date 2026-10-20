"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { nextNumDossier } from "../patients/actions";
import { nextNumero } from "@/lib/numerotation";
import { genererResumeAppel, genererPropositionOffre, assistantIADisponible, type ResumeAppel, type PropositionOffre } from "@/lib/ai";

export interface ActionState {
  error?: string;
  success?: string;
}

function str(formData: FormData, key: string) {
  const v = formData.get(key);
  return typeof v === "string" && v.trim() !== "" ? v.trim() : null;
}

export async function creerProspectAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const nom = str(formData, "nom");
  const source = str(formData, "source");
  if (!nom) return { error: "Indique au moins un nom." };
  if (!source) return { error: "Indique une source (ou crée la tienne)." };

  await prisma.prospect.create({
    data: {
      nom,
      email: str(formData, "email"),
      telephone: str(formData, "telephone"),
      source,
      prestationId: str(formData, "prestationId"),
      message: str(formData, "message"),
    },
  });

  revalidatePath("/prospects");
  redirect("/prospects");
}

export async function changerStatutProspectAction(prospectId: string, statut: string) {
  await prisma.prospect.update({ where: { id: prospectId }, data: { statut } });
  revalidatePath("/prospects");
}

export interface ResumeAppelState {
  error?: string;
  resume?: ResumeAppel;
}

export async function suggererResumeAppelAction(_prev: ResumeAppelState, formData: FormData): Promise<ResumeAppelState> {
  if (!assistantIADisponible()) {
    return { error: "L'assistant IA n'est pas configuré (clé API manquante)." };
  }
  const notes = str(formData, "notesTexte");
  if (!notes) return { error: "Prends au moins quelques notes avant de demander un résumé." };

  try {
    const prestationsActives = await prisma.prestation.findMany({ where: { actif: true }, select: { nom: true } });
    const resume = await genererResumeAppel({ notes, prestationsActives: prestationsActives.map((p) => p.nom) });
    return { resume };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Erreur inattendue lors de la génération." };
  }
}

export interface PropositionOffreState {
  error?: string;
  proposition?: PropositionOffre;
}

export async function genererPropositionOffreAction(_prev: PropositionOffreState, formData: FormData): Promise<PropositionOffreState> {
  if (!assistantIADisponible()) {
    return { error: "L'assistant IA n'est pas configuré (clé API manquante)." };
  }
  const decouverte = str(formData, "decouverte");
  if (!decouverte) return { error: "Remplis au moins une réponse de Découverte avant de demander une proposition." };

  try {
    const prestationsActives = await prisma.prestation.findMany({
      where: { actif: true },
      select: { nom: true, type: true, tarif: true, unite: true, inclusions: true },
    });
    if (prestationsActives.length === 0) {
      return { error: "Aucune prestation active dans ton catalogue — crée au moins une prestation avant de demander une proposition." };
    }
    const proposition = await genererPropositionOffre({ decouverte, prestationsActives });
    return { proposition };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Erreur inattendue lors de la génération." };
  }
}

export async function enregistrerAppelProspectAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const nom = str(formData, "nom");
  const source = str(formData, "source");
  if (!nom) return { error: "Indique au moins un nom avant d'enregistrer." };
  if (!source) return { error: "Indique une source." };

  const prestationNom = str(formData, "prestationSuggereeNom");
  let prestationId: string | null = null;
  if (prestationNom) {
    const prestation = await prisma.prestation.findFirst({ where: { nom: prestationNom, actif: true } });
    prestationId = prestation?.id ?? null;
  }

  const prospect = await prisma.prospect.create({
    data: {
      nom,
      email: str(formData, "email"),
      telephone: str(formData, "telephone"),
      source,
      prestationId,
      notesAppel: str(formData, "notesTexte"),
      statut: "Contacté",
    },
  });

  revalidatePath("/prospects");
  redirect(`/prospects?cree=${prospect.id}`);
}

export async function convertirProspectAction(prospectId: string, _prev: ActionState, formData: FormData): Promise<ActionState> {
  const prenom = str(formData, "prenom");
  const nom = str(formData, "nom");
  if (!prenom || !nom) return { error: "Le prénom et le nom sont obligatoires." };

  const prospect = await prisma.prospect.findUnique({ where: { id: prospectId }, include: { prestation: true } });
  if (!prospect) return { error: "Prospect introuvable." };
  if (prospect.patientId) return { error: "Ce prospect a déjà été converti." };

  const numDossier = await nextNumDossier();
  const patient = await prisma.patient.create({
    data: {
      numDossier,
      nom,
      prenom,
      email: str(formData, "email") ?? prospect.email,
      telephone: str(formData, "telephone") ?? prospect.telephone,
    },
  });

  const prestationId = str(formData, "prestationId") ?? prospect.prestationId;
  if (prestationId) {
    const prestation = await prisma.prestation.findUnique({ where: { id: prestationId } });
    if (prestation) {
      const numero = await nextNumero("devis");
      await prisma.devis.create({
        data: {
          numero,
          patientId: patient.id,
          lignes: JSON.stringify([{ designation: prestation.nom, quantite: 1, prixUnitaire: prestation.tarif }]),
          total: prestation.tarif,
        },
      });
    }
  }

  await prisma.prospect.update({
    where: { id: prospectId },
    data: { statut: "Converti", patientId: patient.id, creneauPropose: null },
  });

  revalidatePath("/prospects");
  revalidatePath("/patients");
  redirect(`/patients/${patient.id}`);
}
