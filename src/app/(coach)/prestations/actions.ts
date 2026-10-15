"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";

export interface ActionState {
  error?: string;
  success?: string;
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
