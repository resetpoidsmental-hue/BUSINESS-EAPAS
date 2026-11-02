"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { nextNumDossier } from "../patients/actions";
import { nextNumero } from "@/lib/numerotation";
import { requireCoachSession } from "@/lib/auth";

export interface ActionState {
  error?: string;
  success?: string;
}

export async function reserverCreneauPatientAction(patientId: string, dateISO: string): Promise<ActionState> {
  await requireCoachSession();
  if (!patientId) return { error: "Choisis un patient." };

  await prisma.seance.create({
    data: { patientId, date: new Date(dateISO), statut: "Planifiée" },
  });

  revalidatePath("/agenda");
  revalidatePath("/dashboard");
  return { success: "Rendez-vous créé." };
}

export async function reserverCreneauProspectAction(prospectId: string, dateISO: string): Promise<ActionState> {
  await requireCoachSession();
  if (!prospectId) return { error: "Choisis un prospect." };

  await prisma.prospect.update({
    where: { id: prospectId },
    data: { creneauPropose: new Date(dateISO) },
  });

  revalidatePath("/agenda");
  return { success: "Créneau proposé au prospect." };
}

export async function annulerCreneauProspectAction(prospectId: string) {
  await requireCoachSession();
  await prisma.prospect.update({ where: { id: prospectId }, data: { creneauPropose: null } });
  revalidatePath("/agenda");
}

export async function confirmerCreneauProspectAction(prospectId: string): Promise<ActionState> {
  await requireCoachSession();
  const prospect = await prisma.prospect.findUnique({ where: { id: prospectId }, include: { prestation: true } });
  if (!prospect) return { error: "Prospect introuvable." };
  if (prospect.patientId) return { error: "Ce prospect a déjà été converti." };
  if (!prospect.creneauPropose) return { error: "Aucun créneau proposé à confirmer." };

  const [prenom, ...reste] = prospect.nom.trim().split(/\s+/);
  const nom = reste.join(" ") || prenom;

  const numDossier = await nextNumDossier();
  const patient = await prisma.patient.create({
    data: {
      numDossier,
      nom,
      prenom,
      email: prospect.email,
      telephone: prospect.telephone,
    },
  });

  await prisma.seance.create({
    data: { patientId: patient.id, date: prospect.creneauPropose, statut: "Planifiée" },
  });

  if (prospect.prestation) {
    const numero = await nextNumero("devis");
    await prisma.devis.create({
      data: {
        numero,
        patientId: patient.id,
        lignes: JSON.stringify([{ designation: prospect.prestation.nom, quantite: 1, prixUnitaire: prospect.prestation.tarif }]),
        total: prospect.prestation.tarif,
      },
    });
  }

  await prisma.prospect.update({
    where: { id: prospectId },
    data: { statut: "Converti", patientId: patient.id },
  });

  revalidatePath("/agenda");
  revalidatePath("/dashboard");
  revalidatePath("/prospects");
  revalidatePath("/patients");
  return { success: "Prospect converti et rendez-vous confirmé." };
}
