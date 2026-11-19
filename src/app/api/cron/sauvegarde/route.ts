import { NextRequest, NextResponse } from "next/server";
import { readFileSync } from "node:fs";
import {
  creerSauvegarde,
  cheminSauvegarde,
  chiffrerPourEnvoiHorsSite,
  backupHorsSiteDisponible,
  TAILLE_MAX_ENVOI_HORS_SITE,
} from "@/lib/backup";
import { telegramDisponible, envoyerMessageTelegram } from "@/lib/telegram";
import { envoyerSauvegardeHorsSite } from "@/lib/email";

/**
 * Appelée une fois par jour (cron sur le VPS, même principe que les rappels Telegram et les
 * prélèvements) : copie la base de données, ne garde que les 14 dernières copies, puis envoie
 * une copie chiffrée hors site par email — sans ce second volet, un incident sur le serveur
 * (pas seulement un bug de l'appli) emporterait la base ET toutes ses sauvegardes locales
 * d'un coup, puisqu'elles vivent sur le même disque.
 */
export async function POST(req: NextRequest) {
  const secret = req.headers.get("x-cron-secret");
  if (!process.env.CRON_SECRET || secret !== process.env.CRON_SECRET) {
    return new NextResponse("Non autorisé", { status: 401 });
  }

  let sauvegarde;
  try {
    sauvegarde = creerSauvegarde();
  } catch (e) {
    const message = e instanceof Error ? e.message : "inconnue";
    console.error("Erreur cron sauvegarde:", e);
    // Seule alerte proactive de l'app qui manquait : sans elle, un échec répété resterait
    // invisible jusqu'à ce que quelqu'un pense à vérifier Réglages — potentiellement après que
    // les 14 dernières copies valides aient toutes été purgées.
    if (telegramDisponible()) {
      try {
        await envoyerMessageTelegram(`⚠️ Échec de la sauvegarde automatique\n\n${message}`);
      } catch (telegramError) {
        console.error("Échec de l'alerte Telegram sauvegarde:", telegramError);
      }
    }
    // On répond quand même 200 pour éviter que le cron VPS ne s'affole — l'échec est en logs.
    return NextResponse.json({ ok: false, erreur: message });
  }

  if (backupHorsSiteDisponible()) {
    try {
      const chemin = cheminSauvegarde(sauvegarde.nom);
      if (!chemin) throw new Error("Fichier de sauvegarde introuvable juste après sa création.");
      if (sauvegarde.tailleOctets > TAILLE_MAX_ENVOI_HORS_SITE) {
        throw new Error(
          `Sauvegarde trop volumineuse pour un envoi par email (${Math.round(sauvegarde.tailleOctets / 1024 / 1024)} Mo) — change de destination hors site.`
        );
      }
      const contenu = readFileSync(chemin);
      const chiffre = chiffrerPourEnvoiHorsSite(contenu);
      await envoyerSauvegardeHorsSite({
        destinataire: process.env.BACKUP_EMAIL_TO!,
        nomFichier: sauvegarde.nom,
        contenuChiffre: chiffre,
      });
    } catch (e) {
      const message = e instanceof Error ? e.message : "inconnue";
      console.error("Erreur envoi sauvegarde hors site:", e);
      // La copie locale a réussi — seul le volet hors site est en cause, mais ça mérite une
      // alerte quand même : c'est précisément ce volet qui protège contre une perte du serveur.
      if (telegramDisponible()) {
        try {
          await envoyerMessageTelegram(`⚠️ Sauvegarde locale OK, mais l'envoi hors site a échoué\n\n${message}`);
        } catch (telegramError) {
          console.error("Échec de l'alerte Telegram sauvegarde hors site:", telegramError);
        }
      }
    }
  }

  return NextResponse.json({ ok: true, sauvegarde });
}
