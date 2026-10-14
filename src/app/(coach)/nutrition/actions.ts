"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { assistantIADisponible, genererPropositionMenu } from "@/lib/ai";
import { buildPatientContext } from "@/lib/patient-context";
import { CATEGORIES_RATION, MEAL_KEYS, MEAL_LABELS, calculerEcartsRation, type Repartition } from "@/lib/categories-ration";

function str(formData: FormData, key: string) {
  const v = formData.get(key);
  return typeof v === "string" && v.trim() !== "" ? v.trim() : null;
}

export interface ActionState {
  error?: string;
  success?: string;
}

export async function creerModeleRationAction(
  patientId: string | null,
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const nom = str(formData, "nom");
  const targetKcal = Number(str(formData, "targetKcal"));
  const ration = str(formData, "rationJson");
  const repartition = str(formData, "repartitionJson");
  const menuType = str(formData, "menuTypeJson");

  if (!nom) return { error: "Donne un nom à ce modèle." };
  if (!targetKcal || targetKcal <= 0) return { error: "Renseigne un objectif énergétique valide." };
  if (!ration || !repartition || !menuType) return { error: "Données de ration manquantes." };

  const modele = await prisma.modeleRation.create({
    data: { nom, targetKcal, ration, repartition, menuType, patientId: patientId ?? undefined },
  });

  revalidatePath("/nutrition/rations");
  if (patientId) {
    revalidatePath(`/patients/${patientId}`);
    redirect(`/patients/${patientId}`);
  }
  redirect(`/nutrition/rations/${modele.id}`);
}

export async function modifierModeleRationAction(
  modeleId: string,
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const nom = str(formData, "nom");
  const targetKcal = Number(str(formData, "targetKcal"));
  const ration = str(formData, "rationJson");
  const repartition = str(formData, "repartitionJson");
  const menuType = str(formData, "menuTypeJson");

  if (!nom) return { error: "Donne un nom à ce modèle." };
  if (!targetKcal || targetKcal <= 0) return { error: "Renseigne un objectif énergétique valide." };
  if (!ration || !repartition || !menuType) return { error: "Données de ration manquantes." };

  const modele = await prisma.modeleRation.update({
    where: { id: modeleId },
    data: { nom, targetKcal, ration, repartition, menuType },
  });

  revalidatePath("/nutrition/rations");
  revalidatePath(`/nutrition/rations/${modeleId}`);
  if (modele.patientId) revalidatePath(`/patients/${modele.patientId}`);
  return { success: "Modèle enregistré." };
}

export async function dupliquerModeleRationAction(formData: FormData) {
  const modeleId = str(formData, "modeleId");
  const patientId = str(formData, "patientId");
  if (!modeleId || !patientId) return;

  const source = await prisma.modeleRation.findUnique({ where: { id: modeleId } });
  if (!source) return;

  await prisma.modeleRation.create({
    data: {
      nom: source.nom,
      targetKcal: source.targetKcal,
      ration: source.ration,
      repartition: source.repartition,
      menuType: source.menuType,
      patientId,
      sourceNom: source.nom,
    },
  });

  revalidatePath(`/patients/${patientId}`);
  redirect(`/patients/${patientId}`);
}

export async function supprimerModeleRationAction(modeleId: string, patientId: string | null) {
  await prisma.modeleRation.delete({ where: { id: modeleId } });

  revalidatePath("/nutrition/rations");
  if (patientId) revalidatePath(`/patients/${patientId}`);
}

export interface SuggestionMenuState {
  error?: string;
  menu?: { pd: string; dej: string; col: string; din: string };
}

export async function suggererMenuIAAction(
  modeleId: string,
  _prev: SuggestionMenuState,
  _formData: FormData
): Promise<SuggestionMenuState> {
  if (!assistantIADisponible()) {
    return { error: "L'assistant IA n'est pas configuré (clé API manquante)." };
  }

  const modele = await prisma.modeleRation.findUnique({ where: { id: modeleId } });
  if (!modele) return { error: "Modèle introuvable." };
  if (!modele.patientId) return { error: "Attribue d'abord ce modèle à un patient avant de proposer un menu." };

  try {
    const repartition = JSON.parse(modele.repartition) as Repartition;

    const categoriesParRepas = MEAL_KEYS.map((m) => {
      const labels = CATEGORIES_RATION.filter((c) => (repartition[c.key]?.[m] ?? 0) > 0).map((c) => c.label);
      return `${MEAL_LABELS[m]} : ${labels.length > 0 ? labels.join(", ") : "aucun aliment alloué"}`;
    }).join("\n");

    const septJoursAvant = new Date(Date.now() - 7 * 24 * 3600 * 1000);
    const entries = await prisma.journalEntree.findMany({
      where: { patientId: modele.patientId, date: { gte: septJoursAvant } },
      select: { date: true, repasStructure: true },
    });
    const ecarts = calculerEcartsRation(repartition, entries);
    const ecartsTexte =
      ecarts.length === 0
        ? "Aucune catégorie prévue à comparer."
        : ecarts.map((e) => `- ${e.label} : reporté ${e.loggedDays}/${e.targetDays} jours dans le journal`).join("\n");

    const patientContext = await buildPatientContext(modele.patientId);

    const menu = await genererPropositionMenu({ patientContext, categoriesParRepas, ecartsTexte });
    return { menu };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Erreur inattendue lors de la génération." };
  }
}

export async function envoyerMenuAction(modeleId: string, _prev: ActionState, formData: FormData): Promise<ActionState> {
  const menuType = str(formData, "menuTypeJson");
  if (!menuType) return { error: "Menu manquant." };

  const modele = await prisma.modeleRation.update({
    where: { id: modeleId },
    data: { menuType, partageLe: new Date() },
  });

  revalidatePath(`/nutrition/rations/${modeleId}`);
  if (modele.patientId) {
    revalidatePath(`/patients/${modele.patientId}`);
    revalidatePath("/portail");
  }
  return { success: "Menu envoyé dans son espace." };
}

export async function creerRecetteAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const titre = str(formData, "titre");
  const repas = str(formData, "repasJson");
  const categories = str(formData, "categoriesJson");
  const tags = str(formData, "tagsJson");
  const description = str(formData, "description");

  if (!titre) return { error: "Donne un titre à cette recette." };
  if (!description) return { error: "Décris la recette (ingrédients, préparation)." };

  const recette = await prisma.recette.create({
    data: {
      titre,
      repas: repas ?? "[]",
      categories: categories ?? "[]",
      tags: tags ?? "[]",
      description,
    },
  });

  revalidatePath("/nutrition/recettes");
  redirect(`/nutrition/recettes/${recette.id}`);
}

export async function modifierRecetteAction(
  recetteId: string,
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const titre = str(formData, "titre");
  const repas = str(formData, "repasJson");
  const categories = str(formData, "categoriesJson");
  const tags = str(formData, "tagsJson");
  const description = str(formData, "description");

  if (!titre) return { error: "Donne un titre à cette recette." };
  if (!description) return { error: "Décris la recette (ingrédients, préparation)." };

  await prisma.recette.update({
    where: { id: recetteId },
    data: {
      titre,
      repas: repas ?? "[]",
      categories: categories ?? "[]",
      tags: tags ?? "[]",
      description,
    },
  });

  revalidatePath("/nutrition/recettes");
  revalidatePath(`/nutrition/recettes/${recetteId}`);
  return { success: "Recette enregistrée." };
}

export async function supprimerRecetteAction(recetteId: string) {
  await prisma.recette.delete({ where: { id: recetteId } });
  revalidatePath("/nutrition/recettes");
}
