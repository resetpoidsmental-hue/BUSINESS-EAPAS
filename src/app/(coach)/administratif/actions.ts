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

function num(formData: FormData, key: string) {
  const v = str(formData, key);
  return v !== null ? Number(v) : null;
}

interface LigneInput {
  designation: string;
  quantite: number;
  prixUnitaire: number;
}

function parseLignes(formData: FormData): LigneInput[] {
  const designations = formData.getAll("ligne_designation") as string[];
  const quantites = formData.getAll("ligne_quantite") as string[];
  const prix = formData.getAll("ligne_prix") as string[];

  const lignes: LigneInput[] = [];
  for (let i = 0; i < designations.length; i++) {
    if (!designations[i]?.trim()) continue;
    lignes.push({
      designation: designations[i].trim(),
      quantite: Number(quantites[i]) || 1,
      prixUnitaire: Number(prix[i]) || 0,
    });
  }
  return lignes;
}

function totalLignes(lignes: LigneInput[]) {
  return lignes.reduce((sum, l) => sum + l.quantite * l.prixUnitaire, 0);
}

async function nextNumero(kind: "devis" | "facture" | "contrat") {
  const settings = await prisma.settings.upsert({ where: { id: 1 }, update: {}, create: { id: 1 } });
  const year = new Date().getFullYear();

  if (kind === "devis") {
    const seq = settings.prochainDevis;
    await prisma.settings.update({ where: { id: 1 }, data: { prochainDevis: seq + 1 } });
    return `D-${year}-${String(seq).padStart(3, "0")}`;
  }
  if (kind === "contrat") {
    const seq = settings.prochainContrat;
    await prisma.settings.update({ where: { id: 1 }, data: { prochainContrat: seq + 1 } });
    return `C-${year}-${String(seq).padStart(3, "0")}`;
  }
  const seq = settings.prochainFacture;
  await prisma.settings.update({ where: { id: 1 }, data: { prochainFacture: seq + 1 } });
  return `${year}-${String(seq).padStart(3, "0")}`;
}

export async function createDevis(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const patientId = str(formData, "patientId");
  if (!patientId) return { error: "Sélectionne un patient ou client." };
  const lignes = parseLignes(formData);
  if (lignes.length === 0) return { error: "Ajoute au moins une ligne." };

  const numero = await nextNumero("devis");
  await prisma.devis.create({
    data: {
      numero,
      patientId,
      validiteJours: num(formData, "validiteJours") ?? 30,
      lignes: JSON.stringify(lignes),
      total: totalLignes(lignes),
    },
  });

  revalidatePath("/administratif");
  return { success: `Devis ${numero} créé.` };
}

export async function createContrat(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const patientId = str(formData, "patientId");
  if (!patientId) return { error: "Sélectionne un patient ou client." };

  const numero = await nextNumero("contrat");
  await prisma.contrat.create({
    data: {
      numero,
      patientId,
      formule: str(formData, "formule"),
      inclusions: str(formData, "inclusions"),
      dureeMois: num(formData, "dureeMois"),
      frequenceSeances: str(formData, "frequenceSeances"),
      tarif: num(formData, "tarif"),
      modalitePaiement: str(formData, "modalitePaiement"),
      conditionsAnnulation: str(formData, "conditionsAnnulation"),
    },
  });

  revalidatePath("/administratif");
  return { success: `Contrat ${numero} créé.` };
}

export async function createFacture(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const patientId = str(formData, "patientId");
  if (!patientId) return { error: "Sélectionne un patient ou client." };
  const lignes = parseLignes(formData);
  if (lignes.length === 0) return { error: "Ajoute au moins une ligne." };

  const numero = await nextNumero("facture");
  await prisma.facture.create({
    data: {
      numero,
      patientId,
      lignes: JSON.stringify(lignes),
      total: totalLignes(lignes),
      modeReglement: str(formData, "modeReglement"),
      dateEcheance: (() => {
        const v = str(formData, "dateEcheance");
        return v ? new Date(v) : null;
      })(),
    },
  });

  revalidatePath("/administratif");
  return { success: `Facture ${numero} créée.` };
}

export async function marquerFacturePayee(factureId: string) {
  await prisma.facture.update({
    where: { id: factureId },
    data: { statut: "Payée", datePaiement: new Date() },
  });
  revalidatePath("/administratif");
}

export async function marquerFactureImpayee(factureId: string) {
  await prisma.facture.update({
    where: { id: factureId },
    data: { statut: "Impayée" },
  });
  revalidatePath("/administratif");
}

export async function upsertAbonnement(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const patientId = str(formData, "patientId");
  const formule = str(formData, "formule");
  const montantMensuel = num(formData, "montantMensuel");
  const dateDebutStr = str(formData, "dateDebut");

  if (!patientId || !formule || montantMensuel === null || !dateDebutStr) {
    return { error: "Merci de remplir tous les champs obligatoires." };
  }

  await prisma.abonnement.upsert({
    where: { patientId },
    update: {
      formule,
      montantMensuel,
      dateDebut: new Date(dateDebutStr),
      jourPrelevement: num(formData, "jourPrelevement"),
      statutPaiement: str(formData, "statutPaiement") ?? "À jour",
    },
    create: {
      patientId,
      formule,
      montantMensuel,
      dateDebut: new Date(dateDebutStr),
      jourPrelevement: num(formData, "jourPrelevement"),
    },
  });

  revalidatePath("/administratif");
  return { success: "Abonnement enregistré." };
}

export async function marquerPaiementRecu(patientId: string) {
  const abo = await prisma.abonnement.findUnique({ where: { patientId } });
  if (!abo) return;
  const now = new Date();
  const prochain = new Date(now);
  prochain.setMonth(prochain.getMonth() + 1);

  await prisma.abonnement.update({
    where: { patientId },
    data: { dateDernierPaiement: now, prochainPaiement: prochain, statutPaiement: "À jour" },
  });
  revalidatePath("/administratif");
}
