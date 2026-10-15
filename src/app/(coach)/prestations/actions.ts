"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { genererDescriptionMarketing, assistantIADisponible } from "@/lib/ai";

export interface ActionState {
  error?: string;
  success?: string;
}

export interface DescriptionMarketingState {
  error?: string;
  description?: string;
}

export async function genererDescriptionMarketingAction(
  _prev: DescriptionMarketingState,
  formData: FormData
): Promise<DescriptionMarketingState> {
  if (!assistantIADisponible()) {
    return { error: "L'assistant IA n'est pas configuré (clé API manquante)." };
  }
  const nom = str(formData, "nom");
  const type = str(formData, "type");
  const tarif = num(formData, "tarif");
  const unite = str(formData, "unite");
  if (!nom || !type || tarif === null || !unite) {
    return { error: "Remplis au moins le nom, le type, le tarif et l'unité avant de générer une description." };
  }

  try {
    const description = await genererDescriptionMarketing({
      nom,
      type,
      tarif,
      unite,
      inclusions: str(formData, "inclusions") ?? "",
    });
    return { description };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Erreur inattendue lors de la génération." };
  }
}

function str(formData: FormData, key: string) {
  const v = formData.get(key);
  return typeof v === "string" && v.trim() !== "" ? v.trim() : null;
}

function num(formData: FormData, key: string) {
  const v = str(formData, key);
  return v !== null ? Number(v) : null;
}

export async function creerPrestationAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const nom = str(formData, "nom");
  const type = str(formData, "type");
  const tarif = num(formData, "tarif");
  const unite = str(formData, "unite");
  if (!nom) return { error: "Donne un nom à cette prestation." };
  if (!type) return { error: "Indique un type (ou crée le tien)." };
  if (tarif === null || tarif < 0) return { error: "Indique un tarif valide." };
  if (!unite) return { error: "Indique une unité (par séance, par mois…)." };

  const prestation = await prisma.prestation.create({
    data: {
      nom,
      type,
      tarif,
      unite,
      dureeSemaines: num(formData, "dureeSemaines"),
      inclusions: str(formData, "inclusions"),
      descriptionMarketing: str(formData, "descriptionMarketing"),
    },
  });

  revalidatePath("/prestations");
  redirect(`/prestations/${prestation.id}`);
}

export async function modifierPrestationAction(
  prestationId: string,
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const nom = str(formData, "nom");
  const type = str(formData, "type");
  const tarif = num(formData, "tarif");
  const unite = str(formData, "unite");
  if (!nom) return { error: "Donne un nom à cette prestation." };
  if (!type) return { error: "Indique un type (ou crée le tien)." };
  if (tarif === null || tarif < 0) return { error: "Indique un tarif valide." };
  if (!unite) return { error: "Indique une unité (par séance, par mois…)." };

  await prisma.prestation.update({
    where: { id: prestationId },
    data: {
      nom,
      type,
      tarif,
      unite,
      dureeSemaines: num(formData, "dureeSemaines"),
      inclusions: str(formData, "inclusions"),
      descriptionMarketing: str(formData, "descriptionMarketing"),
    },
  });

  revalidatePath("/prestations");
  revalidatePath(`/prestations/${prestationId}`);
  return { success: "Prestation mise à jour." };
}

export async function toggleActifPrestationAction(prestationId: string, actif: boolean) {
  await prisma.prestation.update({ where: { id: prestationId }, data: { actif } });
  revalidatePath("/prestations");
}
