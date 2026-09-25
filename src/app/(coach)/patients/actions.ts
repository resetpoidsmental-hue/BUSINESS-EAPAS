"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { generateAccessCode, hashAccessCode } from "@/lib/auth";
import { calculerScoreIPAQ, calculerBilanNutritionnel, type Sexe } from "@/lib/calculs";

export interface ActionState {
  error?: string;
  success?: string;
}

async function nextNumDossier() {
  const year = new Date().getFullYear();
  const count = await prisma.patient.count();
  return `DP-${year}-${String(count + 1).padStart(3, "0")}`;
}

function str(formData: FormData, key: string) {
  const v = formData.get(key);
  return typeof v === "string" && v.trim() !== "" ? v.trim() : null;
}

function num(formData: FormData, key: string) {
  const v = str(formData, key);
  return v !== null ? Number(v) : null;
}

function date(formData: FormData, key: string) {
  const v = str(formData, key);
  return v ? new Date(v) : null;
}

export async function createPatient(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const nom = str(formData, "nom");
  const prenom = str(formData, "prenom");
  if (!nom || !prenom) return { error: "Le nom et le prénom sont obligatoires." };

  const numDossier = await nextNumDossier();

  const patient = await prisma.patient.create({
    data: {
      numDossier,
      nom,
      prenom,
      dateNaissance: date(formData, "dateNaissance"),
      genre: str(formData, "genre"),
      telephone: str(formData, "telephone"),
      email: str(formData, "email"),
      adresse: str(formData, "adresse"),
      metier: str(formData, "metier") ?? "EAPAS",
      pathologieALD: str(formData, "pathologieALD"),
      medecinPrescripteur: str(formData, "medecinPrescripteur"),
      numPrescription: str(formData, "numPrescription"),
      datePrescription: date(formData, "datePrescription"),
      objectifPrincipal: str(formData, "objectifPrincipal"),
      limitations: str(formData, "limitations"),
      consentementRGPD: formData.get("consentementRGPD") === "on",
      dateConsentement: formData.get("consentementRGPD") === "on" ? new Date() : null,
      notes: str(formData, "notes"),
    },
  });

  revalidatePath("/patients");
  redirect(`/patients/${patient.id}`);
}

export async function updatePatient(patientId: string, _prev: ActionState, formData: FormData): Promise<ActionState> {
  const nom = str(formData, "nom");
  const prenom = str(formData, "prenom");
  if (!nom || !prenom) return { error: "Le nom et le prénom sont obligatoires." };

  const consentementRGPD = formData.get("consentementRGPD") === "on";
  const existing = await prisma.patient.findUnique({
    where: { id: patientId },
    select: { consentementRGPD: true, dateConsentement: true },
  });
  const dateConsentement = consentementRGPD
    ? (existing?.dateConsentement ?? new Date())
    : null;

  await prisma.patient.update({
    where: { id: patientId },
    data: {
      nom,
      prenom,
      dateNaissance: date(formData, "dateNaissance"),
      genre: str(formData, "genre"),
      telephone: str(formData, "telephone"),
      email: str(formData, "email"),
      adresse: str(formData, "adresse"),
      metier: str(formData, "metier") ?? "EAPAS",
      pathologieALD: str(formData, "pathologieALD"),
      medecinPrescripteur: str(formData, "medecinPrescripteur"),
      numPrescription: str(formData, "numPrescription"),
      datePrescription: date(formData, "datePrescription"),
      dateBilanInitial: date(formData, "dateBilanInitial"),
      objectifPrincipal: str(formData, "objectifPrincipal"),
      limitations: str(formData, "limitations"),
      statutSuivi: str(formData, "statutSuivi") ?? "Bilan initial à faire",
      consentementRGPD,
      dateConsentement,
      notes: str(formData, "notes"),
    },
  });

  revalidatePath(`/patients/${patientId}`);
  revalidatePath("/patients");
  return { success: "Fiche mise à jour." };
}

export async function deletePatient(patientId: string) {
  await prisma.patient.delete({ where: { id: patientId } });
  revalidatePath("/patients");
  redirect("/patients");
}

export async function addEntretien(patientId: string, _prev: ActionState, formData: FormData): Promise<ActionState> {
  await prisma.entretienInitial.create({
    data: {
      patientId,
      ressentiDemarrage: str(formData, "ressentiDemarrage"),
      experienceAnterieure: str(formData, "experienceAnterieure"),
      quotidien: str(formData, "quotidien"),
      depuisQuand: str(formData, "depuisQuand"),
      prescritConseillePar: str(formData, "prescritConseillePar"),
      declencheur: str(formData, "declencheur"),
      representationAP: str(formData, "representationAP"),
      souvenirPositif: str(formData, "souvenirPositif"),
      objectifPatientMots: str(formData, "objectifPatientMots"),
      gesteAPreserver: str(formData, "gesteAPreserver"),
      limitationsMedecin: str(formData, "limitationsMedecin"),
      douleursApprehensions: str(formData, "douleursApprehensions"),
      attentesCoach: str(formData, "attentesCoach"),
      freinsPotentiels: str(formData, "freinsPotentiels"),
      modaliteCommunication: str(formData, "modaliteCommunication"),
      tempsAssisParJour: num(formData, "tempsAssisParJour"),
      activitesActuelles: str(formData, "activitesActuelles"),
      evaDouleur: num(formData, "evaDouleur"),
      chutes12Mois: formData.get("chutes12Mois") === "on",
    },
  });

  await prisma.patient.update({
    where: { id: patientId },
    data: { statutSuivi: "Bilan initial à faire" },
  });

  revalidatePath(`/patients/${patientId}`);
  return { success: "Entretien initial enregistré." };
}

export async function addBilan(patientId: string, _prev: ActionState, formData: FormData): Promise<ActionState> {
  const phase = str(formData, "phase") ?? "T0";

  await prisma.bilanClinique.create({
    data: {
      patientId,
      phase,
      tm6Distance: num(formData, "tm6Distance"),
      tm6Borg: num(formData, "tm6Borg"),
      tm6FCMax: num(formData, "tm6FCMax"),
      tm6SpO2: num(formData, "tm6SpO2"),
      tugTemps: num(formData, "tugTemps"),
      equilibreYO: num(formData, "equilibreYO"),
      equilibreYF: num(formData, "equilibreYF"),
      leversChaise: num(formData, "leversChaise"),
      handgrip: num(formData, "handgrip"),
      pompesMur: num(formData, "pompesMur"),
      flexionTronc: num(formData, "flexionTronc"),
      observations: str(formData, "observations"),
    },
  });

  if (phase === "T0") {
    await prisma.patient.update({
      where: { id: patientId },
      data: { dateBilanInitial: new Date(), statutSuivi: "Suivi en cours" },
    });
  }
  if (phase === "T2") {
    await prisma.patient.update({
      where: { id: patientId },
      data: { statutSuivi: "Bilan final fait" },
    });
  }

  revalidatePath(`/patients/${patientId}`);
  return { success: `Bilan ${phase} enregistré.` };
}

export async function addObjectif(patientId: string, _prev: ActionState, formData: FormData): Promise<ActionState> {
  const texteOriginal = str(formData, "texteOriginal");
  const texteSMART = str(formData, "texteSMART");
  if (!texteOriginal || !texteSMART) return { error: "Merci de renseigner les deux champs." };

  await prisma.objectifSMART.create({
    data: {
      patientId,
      texteOriginal,
      texteSMART,
      dateCible: date(formData, "dateCible"),
    },
  });

  revalidatePath(`/patients/${patientId}`);
  return { success: "Objectif ajouté." };
}

export async function toggleObjectif(objectifId: string, patientId: string, atteint: boolean) {
  await prisma.objectifSMART.update({ where: { id: objectifId }, data: { atteint } });
  revalidatePath(`/patients/${patientId}`);
}

export async function addIPAQ(patientId: string, _prev: ActionState, formData: FormData): Promise<ActionState> {
  const params = {
    marcheJours: num(formData, "marcheJours") ?? 0,
    marcheMinutes: num(formData, "marcheMinutes") ?? 0,
    modJours: num(formData, "modJours") ?? 0,
    modMinutes: num(formData, "modMinutes") ?? 0,
    vigJours: num(formData, "vigJours") ?? 0,
    vigMinutes: num(formData, "vigMinutes") ?? 0,
  };
  const { scoreTotal, classification } = calculerScoreIPAQ(params);

  await prisma.iPAQEvaluation.create({
    data: {
      patientId,
      ...params,
      tempsAssisMinutes: num(formData, "tempsAssisMinutes"),
      scoreTotal,
      classification,
    },
  });

  revalidatePath(`/patients/${patientId}`);
  return { success: `Score IPAQ calculé : ${scoreTotal} MET-min/sem (${classification}).` };
}

export async function addBilanNutrition(patientId: string, _prev: ActionState, formData: FormData): Promise<ActionState> {
  const poidsKg = num(formData, "poids");
  const tailleCm = num(formData, "taille");
  const age = num(formData, "age");
  const sexe = (str(formData, "sexe") as Sexe) ?? "H";
  const nap = num(formData, "nap") ?? 1.375;
  const objectifPonderal = str(formData, "objectifPonderal") ?? "maintien";

  if (!poidsKg || !tailleCm || !age) {
    return { error: "Poids, taille et âge sont obligatoires." };
  }

  const resultat = calculerBilanNutritionnel({ poidsKg, tailleCm, age, sexe, nap, objectifPonderal });

  await prisma.bilanNutritionnel.create({
    data: {
      patientId,
      taille: tailleCm,
      poids: poidsKg,
      tourDeTaille: num(formData, "tourDeTaille"),
      age,
      sexe,
      nap,
      objectifPonderal,
      ...resultat,
    },
  });

  revalidatePath(`/patients/${patientId}`);
  return { success: "Bilan nutritionnel calculé et enregistré." };
}

export async function addSeance(patientId: string, _prev: ActionState, formData: FormData): Promise<ActionState> {
  const dateSeance = date(formData, "date");
  if (!dateSeance) return { error: "La date est obligatoire." };

  await prisma.seance.create({
    data: {
      patientId,
      date: dateSeance,
      type: str(formData, "type"),
      format: str(formData, "format"),
      statut: str(formData, "statut") ?? "Planifiée",
      contenu: str(formData, "contenu"),
      borgRessenti: num(formData, "borgRessenti"),
      notes: str(formData, "notes"),
    },
  });

  revalidatePath(`/patients/${patientId}`);
  return { success: "Séance ajoutée." };
}

export async function updateSeanceStatut(seanceId: string, patientId: string, statut: string) {
  await prisma.seance.update({ where: { id: seanceId }, data: { statut } });
  revalidatePath(`/patients/${patientId}`);
}

export async function generatePatientAccess(patientId: string) {
  const code = generateAccessCode();
  const codeHash = hashAccessCode(code);

  await prisma.patientAccess.upsert({
    where: { patientId },
    update: { codeHash, actif: true },
    create: { patientId, codeHash },
  });

  revalidatePath(`/patients/${patientId}`);
  return code;
}

export async function revokePatientAccess(patientId: string) {
  await prisma.patientAccess.updateMany({ where: { patientId }, data: { actif: false } });
  revalidatePath(`/patients/${patientId}`);
}
