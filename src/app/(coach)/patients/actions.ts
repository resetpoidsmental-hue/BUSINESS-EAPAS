"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { generateAccessCode, hashAccessCode } from "@/lib/auth";
import { calculerScoreIPAQ, calculerBilanNutritionnel, type Sexe } from "@/lib/calculs";
import {
  genererObjectifSMART,
  genererPlanningSeances,
  genererMessageAttention,
  analyserSuivi,
  assistantIADisponible,
} from "@/lib/ai";
import { buildPatientContext, buildSuiviContext } from "@/lib/patient-context";

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

export interface SuggestionObjectifState {
  error?: string;
  texteSMART?: string;
  dateCible?: string;
}

export async function suggererObjectifSMARTAction(
  patientId: string,
  _prev: SuggestionObjectifState,
  formData: FormData
): Promise<SuggestionObjectifState> {
  if (!assistantIADisponible()) {
    return { error: "L'assistant IA n'est pas configuré (clé API manquante)." };
  }

  const texteOriginal = str(formData, "texteOriginal");
  if (!texteOriginal) return { error: "Note d'abord l'objectif dans les mots du patient." };

  try {
    const patientContext = await buildPatientContext(patientId);
    const suggestion = await genererObjectifSMART({ patientContext, texteOriginal });
    return { texteSMART: suggestion.texteSMART, dateCible: suggestion.dateCible ?? undefined };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Erreur inattendue lors de la génération." };
  }
}

export interface SeancePlanifieeProposee {
  dateHeure: string;
  type: string;
  note: string;
}

export interface SuggestionPlanningState {
  error?: string;
  bilanManquant?: boolean;
  rationale?: string;
  seances?: SeancePlanifieeProposee[];
}

export async function suggererPlanningAction(
  patientId: string,
  _prev: SuggestionPlanningState,
  formData: FormData
): Promise<SuggestionPlanningState> {
  if (!assistantIADisponible()) {
    return { error: "L'assistant IA n'est pas configuré (clé API manquante)." };
  }

  const objectifTexteSMART = str(formData, "objectifTexteSMART");
  if (!objectifTexteSMART) return { error: "Objectif manquant." };

  const bilan = await prisma.bilanClinique.findFirst({ where: { patientId } });
  if (!bilan) return { bilanManquant: true };

  try {
    const patientContext = await buildPatientContext(patientId);
    const planning = await genererPlanningSeances({ patientContext, objectifTexteSMART });
    return { rationale: planning.rationale, seances: planning.seances };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Erreur inattendue lors de la génération." };
  }
}

export async function creerSeancesPlanifieesAction(
  patientId: string,
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const seancesRaw = str(formData, "seancesJson");
  if (!seancesRaw) return { error: "Rien à créer." };

  let items: unknown;
  try {
    items = JSON.parse(seancesRaw);
  } catch {
    return { error: "Données invalides, impossible de créer les séances." };
  }
  if (!Array.isArray(items)) return { error: "Données invalides, impossible de créer les séances." };

  const aCreer: { date: Date; type: string | null; notes: string | null }[] = [];
  for (const item of items) {
    if (typeof item !== "object" || item === null) continue;
    const dateHeureRaw = (item as Record<string, unknown>).dateHeure;
    const typeRaw = (item as Record<string, unknown>).type;
    const noteRaw = (item as Record<string, unknown>).note;
    if (typeof dateHeureRaw !== "string") continue;
    const d = new Date(dateHeureRaw);
    if (Number.isNaN(d.getTime())) continue;
    aCreer.push({
      date: d,
      type: typeof typeRaw === "string" && typeRaw ? typeRaw : null,
      notes: typeof noteRaw === "string" && noteRaw ? noteRaw : null,
    });
  }

  if (aCreer.length === 0) return { error: "Aucune séance valide à créer." };

  await prisma.seance.createMany({
    data: aCreer.map((s) => ({
      patientId,
      date: s.date,
      type: s.type,
      format: "Individuel",
      statut: "Planifiée",
      notes: s.notes,
    })),
  });

  revalidatePath(`/patients/${patientId}`);
  return { success: `${aCreer.length} séance${aCreer.length > 1 ? "s" : ""} créée${aCreer.length > 1 ? "s" : ""}.` };
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

export interface SuggestionMessageState {
  error?: string;
  message?: string;
  seanceId?: string;
}

export async function suggererMessageAttentionAction(
  patientId: string,
  seanceId: string,
  _prev: SuggestionMessageState,
  _formData: FormData
): Promise<SuggestionMessageState> {
  if (!assistantIADisponible()) {
    return { error: "L'assistant IA n'est pas configuré (clé API manquante)." };
  }

  const seance = await prisma.seance.findUnique({ where: { id: seanceId } });
  if (!seance || seance.patientId !== patientId) return { error: "Séance introuvable." };

  try {
    const patientContext = await buildPatientContext(patientId);
    const message = await genererMessageAttention({
      patientContext,
      dateSeanceManquee: seance.date.toLocaleDateString("fr-FR"),
      typeSeanceManquee: seance.type ?? "Séance",
    });
    return { message, seanceId };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Erreur inattendue lors de la génération." };
  }
}

export async function envoyerMessageAction(
  patientId: string,
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const contenu = str(formData, "contenu");
  if (!contenu) return { error: "Le message est vide." };

  await prisma.messageCoach.create({ data: { patientId, contenu } });

  revalidatePath(`/patients/${patientId}`);
  revalidatePath("/portail");
  return { success: "Message envoyé dans son espace." };
}

export interface AnalyseSuiviState {
  error?: string;
  analyse?: string;
}

export async function analyserSuiviAction(
  patientId: string,
  _prev: AnalyseSuiviState,
  _formData: FormData
): Promise<AnalyseSuiviState> {
  if (!assistantIADisponible()) {
    return { error: "L'assistant IA n'est pas configuré (clé API manquante)." };
  }

  try {
    const { contexte } = await buildSuiviContext(patientId);
    const analyse = await analyserSuivi(contexte);
    return { analyse };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Erreur inattendue lors de l'analyse." };
  }
}
