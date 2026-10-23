import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import type { Patient } from "@prisma/client";
import { envoyerMessageTelegram, repondreCallbackTelegram } from "@/lib/telegram";
import { verifierDisponibilite, declarerCreneauExceptionnel } from "@/lib/disponibilite";
import { envoyerNotificationPatient, emailDisponible } from "@/lib/email";
import { formatHeure, formatDateHeureParis } from "@/lib/utils";

const DELTAS_MS: Record<string, number> = { h1: 60 * 60 * 1000, h2: 2 * 60 * 60 * 1000, j1: 24 * 60 * 60 * 1000 };

interface TelegramUpdate {
  callback_query?: { id: string; data?: string };
}

type SeanceAvecPatient = { id: string; patientId: string; date: Date; patient: Patient };

/**
 * Reçoit les taps sur les boutons Telegram (Annuler / Déplacer / Confirmer le créneau
 * exceptionnel). Chaque action vient d'un geste explicite du coach sur son propre Telegram —
 * jamais déclenchée automatiquement par l'IA. La notification au patient qui en découle est une
 * conséquence directe et déterministe de ce geste, pas une décision de l'IA.
 */
export async function POST(req: NextRequest) {
  const secret = req.headers.get("x-telegram-bot-api-secret-token");
  if (!process.env.TELEGRAM_WEBHOOK_SECRET || secret !== process.env.TELEGRAM_WEBHOOK_SECRET) {
    return new NextResponse("Non autorisé", { status: 401 });
  }

  let update: TelegramUpdate;
  try {
    update = await req.json();
  } catch {
    return NextResponse.json({ ok: true });
  }

  const cq = update.callback_query;
  if (!cq || typeof cq.data !== "string") return NextResponse.json({ ok: true });

  try {
    await traiterCallback(cq.id, cq.data);
  } catch (e) {
    console.error("Erreur webhook Telegram:", e);
  }

  return NextResponse.json({ ok: true });
}

async function traiterCallback(callbackId: string, data: string) {
  const [action, seanceId, delta] = data.split(":");

  if (action === "movxno") {
    await repondreCallbackTelegram(callbackId, "Rien n'a changé.");
    return;
  }

  if (action === "relenv") {
    await envoyerRelanceProspect(seanceId, callbackId);
    return;
  }

  if (action === "relign") {
    await repondreCallbackTelegram(callbackId, "D'accord, rien n'est envoyé.");
    return;
  }

  const seance = await prisma.seance.findUnique({ where: { id: seanceId }, include: { patient: true } });
  if (!seance) {
    await repondreCallbackTelegram(callbackId, "Séance introuvable (déjà modifiée ailleurs ?).");
    return;
  }

  if (action === "ann") {
    await annulerSeance(seance);
    await repondreCallbackTelegram(callbackId, "Séance annulée.");
    return;
  }

  if (action === "mov" && delta) {
    const cible = new Date(seance.date.getTime() + DELTAS_MS[delta]);
    const { disponible, conflit } = await verifierDisponibilite(cible, seance.id);
    if (!disponible) {
      await repondreCallbackTelegram(callbackId, conflit ? "Ce créneau vient d'être pris, à faire depuis l'app." : "Ce créneau n'est plus libre, à faire depuis l'app.");
      return;
    }
    await deplacerSeance(seance, cible);
    await repondreCallbackTelegram(callbackId, `Séance déplacée à ${formatHeure(cible)}.`);
    return;
  }

  if (action === "movx" && delta) {
    const cible = new Date(seance.date.getTime() + DELTAS_MS[delta]);
    await repondreCallbackTelegram(callbackId);
    await envoyerMessageTelegram(
      `⚠️ Créneau exceptionnel\n${formatHeure(cible)} est en dehors de tes horaires habituels. Confirmer quand même ?`,
      [
        [
          { texte: `Confirmer ${formatHeure(cible)}`, callbackData: `movxok:${seanceId}:${delta}` },
          { texte: "Annuler", callbackData: `movxno:${seanceId}` },
        ],
      ]
    );
    return;
  }

  if (action === "movxok" && delta) {
    const cible = new Date(seance.date.getTime() + DELTAS_MS[delta]);
    // Revérifie au cas où un autre créneau aurait été pris entre-temps — un vrai conflit reste
    // bloquant même pour un horaire exceptionnel (on ne double-réserve jamais).
    const { conflit } = await verifierDisponibilite(cible, seance.id);
    if (conflit) {
      await repondreCallbackTelegram(callbackId, "Ce créneau vient d'être pris entre-temps, à faire depuis l'app.");
      return;
    }
    await declarerCreneauExceptionnel(cible, `Déplacement exceptionnel depuis Telegram — ${seance.patient.prenom} ${seance.patient.nom}`);
    await deplacerSeance(seance, cible);
    await repondreCallbackTelegram(callbackId, `Créneau exceptionnel confirmé, séance déplacée à ${formatHeure(cible)}.`);
    return;
  }

  await repondreCallbackTelegram(callbackId);
}

async function annulerSeance(seance: SeanceAvecPatient) {
  await prisma.seance.update({ where: { id: seance.id }, data: { statut: "Annulée" } });

  await avertirPatient(
    seance,
    "Votre séance a été annulée",
    `Ta séance du ${formatDateHeureParis(seance.date)} a été annulée par ton coach. Il te recontactera pour la reprogrammer si besoin.`
  );

  await envoyerMessageTelegram(
    `✅ Séance annulée — ${seance.patient.prenom} ${seance.patient.nom}\n${seance.patient.email ? "Patient prévenu dans son espace + par email." : "Patient prévenu dans son espace (pas d'email enregistré)."}`
  );
}

async function deplacerSeance(seance: SeanceAvecPatient, cible: Date) {
  const ancienneDate = seance.date;
  await prisma.seance.update({ where: { id: seance.id }, data: { date: cible, rappel2hEnvoye: false } });

  await avertirPatient(
    seance,
    "Votre séance a été déplacée",
    `Ta séance du ${formatDateHeureParis(ancienneDate)} a été déplacée au ${formatDateHeureParis(cible)} par ton coach.`
  );

  await envoyerMessageTelegram(
    `✅ Séance déplacée à ${formatHeure(cible)} — ${seance.patient.prenom} ${seance.patient.nom}\nPatient prévenu dans son espace${seance.patient.email ? " + par email." : "."}`
  );
}

/**
 * Envoie le brouillon de relance déjà rédigé par l'IA pour ce prospect — jamais appelée
 * automatiquement, uniquement en réaction au tap du coach sur "Envoyer" dans Telegram.
 */
async function envoyerRelanceProspect(prospectId: string, callbackId: string) {
  const prospect = await prisma.prospect.findUnique({ where: { id: prospectId } });
  if (!prospect) {
    await repondreCallbackTelegram(callbackId, "Prospect introuvable (déjà supprimé ?).");
    return;
  }
  if (prospect.relanceEmailEnvoyee) {
    await repondreCallbackTelegram(callbackId, "Déjà envoyé.");
    return;
  }
  if (!prospect.email || !prospect.relanceEmailBrouillon) {
    await repondreCallbackTelegram(callbackId, "Impossible d'envoyer (email ou brouillon manquant).");
    return;
  }
  if (!emailDisponible()) {
    await repondreCallbackTelegram(callbackId, "L'envoi d'email n'est pas configuré (RESEND_API_KEY).");
    return;
  }

  try {
    await envoyerNotificationPatient({
      destinataire: prospect.email,
      nomPatient: prospect.nom,
      sujet: "Santé & Co — on reste disponible pour en discuter",
      texte: prospect.relanceEmailBrouillon,
    });
    await prisma.prospect.update({
      where: { id: prospect.id },
      data: { relanceEmailEnvoyee: true, statut: prospect.statut === "Nouveau" ? "Contacté" : prospect.statut },
    });
    await repondreCallbackTelegram(callbackId, `Email envoyé à ${prospect.nom}.`);
  } catch (e) {
    console.error("Échec de l'envoi de la relance prospect:", e);
    await repondreCallbackTelegram(callbackId, "Échec de l'envoi, réessaie plus tard.");
  }
}

async function avertirPatient(seance: SeanceAvecPatient, sujet: string, texte: string) {
  await prisma.messageCoach.create({ data: { patientId: seance.patientId, contenu: texte } });

  if (seance.patient.email && emailDisponible()) {
    try {
      await envoyerNotificationPatient({
        destinataire: seance.patient.email,
        nomPatient: `${seance.patient.prenom} ${seance.patient.nom}`,
        sujet,
        texte,
      });
    } catch (e) {
      console.error("Échec de l'email de notification de séance:", e);
    }
  }
}
