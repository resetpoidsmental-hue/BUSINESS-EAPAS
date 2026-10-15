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

export async function updateSettings(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const nomEntreprise = str(formData, "nomEntreprise");
  if (!nomEntreprise) return { error: "Le nom de l'activité est obligatoire." };

  await prisma.settings.upsert({
    where: { id: 1 },
    update: {
      nomEntreprise,
      siret: str(formData, "siret"),
      adresse: str(formData, "adresse"),
      telephone: str(formData, "telephone"),
      email: str(formData, "email"),
      mentionTVA: str(formData, "mentionTVA") ?? "TVA non applicable, article 293 B du CGI",
      tauxUrssaf: Number(str(formData, "tauxUrssaf") ?? "24.6"),
      assuranceRCPro: str(formData, "assuranceRCPro"),
    },
    create: {
      id: 1,
      nomEntreprise,
      siret: str(formData, "siret"),
      adresse: str(formData, "adresse"),
      telephone: str(formData, "telephone"),
      email: str(formData, "email"),
    },
  });

  revalidatePath("/reglages");
  revalidatePath("/", "layout");
  return { success: "Réglages enregistrés." };
}

export async function togglePortal(enabled: boolean) {
  await prisma.settings.upsert({
    where: { id: 1 },
    update: { portalEnabled: enabled },
    create: { id: 1, portalEnabled: enabled },
  });
  revalidatePath("/", "layout");
  revalidatePath("/reglages");
}

export async function enregistrerHorairesAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  for (let jour = 0; jour < 7; jour++) {
    const actif = formData.get(`actif_${jour}`) === "on";
    const debut = str(formData, `debut_${jour}`) ?? "09:00";
    const fin = str(formData, `fin_${jour}`) ?? "18:00";
    await prisma.horaireTravail.upsert({
      where: { jour },
      update: { actif, debut, fin },
      create: { jour, actif, debut, fin },
    });
  }

  revalidatePath("/reglages");
  revalidatePath("/agenda");
  return { success: "Horaires enregistrés." };
}

export async function ajouterCreneauExceptionnelAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const dateStr = str(formData, "date");
  const debut = str(formData, "debut");
  const fin = str(formData, "fin");
  if (!dateStr || !debut || !fin) return { error: "Indique une date et des horaires." };

  await prisma.creneauExceptionnel.create({
    data: { date: new Date(dateStr), debut, fin, note: str(formData, "note") },
  });

  revalidatePath("/reglages");
  revalidatePath("/agenda");
  return { success: "Créneau exceptionnel ajouté." };
}

export async function supprimerCreneauExceptionnelAction(id: string) {
  await prisma.creneauExceptionnel.delete({ where: { id } });
  revalidatePath("/reglages");
  revalidatePath("/agenda");
}
