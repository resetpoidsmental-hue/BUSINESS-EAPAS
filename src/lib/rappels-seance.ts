import { prisma } from "@/lib/db";
import { telegramDisponible, envoyerMessageTelegram, type TelegramBouton } from "@/lib/telegram";
import { verifierDisponibilite } from "@/lib/disponibilite";
import { envoyerNotificationPatient, emailDisponible } from "@/lib/email";
import { formatHeure } from "@/lib/utils";
import { ajouterJours, parisHeureVersDate, type JourCalendaire } from "@/lib/agenda";

const DELTAS_MS: Record<string, number> = {
  h1: 60 * 60 * 1000,
  h2: 2 * 60 * 60 * 1000,
  j1: 24 * 60 * 60 * 1000,
};

const LABELS_DELTA: Record<string, string> = { h1: "+1h", h2: "+2h", j1: "Demain, même heure" };

function jourDeDate(date: Date): JourCalendaire {
  // Reconstruit l'AAAA-MM-JJ Paris à partir d'une clé déjà calculée ailleurs (évite la dépendance
  // circulaire avec dateKeyParis en recalculant directement via Intl).
  const cle = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Paris", year: "numeric", month: "2-digit", day: "2-digit" }).format(date);
  const [year, month, day] = cle.split("-").map(Number);
  return { year, month, day };
}

async function seancesDuJour(jour: JourCalendaire) {
  const debut = parisHeureVersDate(jour, 0, 0);
  const fin = parisHeureVersDate(ajouterJours(jour, 1), 0, 0);
  return prisma.seance.findMany({
    where: { date: { gte: debut, lt: fin }, statut: "Planifiée" },
    orderBy: { date: "asc" },
    include: {
      patient: { select: { prenom: true, nom: true } },
      objectifSMART: { select: { texteSMART: true } },
    },
  });
}

function ligneSeance(s: { date: Date; type: string | null; patient: { prenom: string; nom: string } }) {
  return `${formatHeure(s.date)} — ${s.patient.prenom} ${s.patient.nom} · ${s.type ?? "Séance"}`;
}

/** Digest envoyé la veille au soir : toutes les séances planifiées du lendemain. */
export async function envoyerDigestVeille() {
  if (!telegramDisponible()) return;
  const demain = ajouterJours(jourDeDate(new Date()), 1);
  const seances = await seancesDuJour(demain);
  if (seances.length === 0) return;

  const lignes = seances.map((s) => ligneSeance(s)).join("\n");
  await envoyerMessageTelegram(`📅 Demain (${String(demain.day).padStart(2, "0")}/${String(demain.month).padStart(2, "0")})\n\n${lignes}`);
}

/** Digest envoyé le matin : toutes les séances planifiées du jour même. */
export async function envoyerDigestMatin() {
  if (!telegramDisponible()) return;
  const aujourdhui = jourDeDate(new Date());
  const seances = await seancesDuJour(aujourdhui);
  if (seances.length === 0) return;

  const lignes = seances.map((s) => ligneSeance(s)).join("\n");
  await envoyerMessageTelegram(
    `☀️ Aujourd'hui (${String(aujourdhui.day).padStart(2, "0")}/${String(aujourdhui.month).padStart(2, "0")}) — ${seances.length} séance${seances.length > 1 ? "s" : ""}\n\n${lignes}`
  );
}

/**
 * Rappels individuels 2h avant chaque séance, avec boutons Annuler / Déplacer. Chaque option de
 * déplacement n'est proposée que si réellement libre (vérifié contre les horaires de travail et
 * les séances déjà prises) ; sinon elle est proposée comme créneau exceptionnel à confirmer.
 */
export async function envoyerRappels2h() {
  if (!telegramDisponible()) return;

  const maintenant = new Date();
  const borneBasse = new Date(maintenant.getTime() + 105 * 60 * 1000); // 1h45
  const borneHaute = new Date(maintenant.getTime() + 135 * 60 * 1000); // 2h15

  const seances = await prisma.seance.findMany({
    where: { date: { gte: borneBasse, lt: borneHaute }, statut: "Planifiée", rappel2hEnvoye: false },
    include: {
      patient: { select: { prenom: true, nom: true } },
      objectifSMART: { select: { texteSMART: true } },
    },
  });

  for (const s of seances) {
    const lignesBoutons: TelegramBouton[][] = [[{ texte: "✕ Annuler cette séance", callbackData: `ann:${s.id}` }]];
    const ligneDeplacer: TelegramBouton[] = [];

    for (const delta of ["h1", "h2", "j1"] as const) {
      const cible = new Date(s.date.getTime() + DELTAS_MS[delta]);
      const { disponible, conflit } = await verifierDisponibilite(cible, s.id);
      if (conflit) continue; // vraiment déjà pris par une autre séance : pas d'option proposée
      const heureCible = formatHeure(cible);
      if (disponible) {
        ligneDeplacer.push({ texte: `${LABELS_DELTA[delta]} (${heureCible}) ✓`, callbackData: `mov:${s.id}:${delta}` });
      } else {
        ligneDeplacer.push({ texte: `${LABELS_DELTA[delta]} (${heureCible}) ⚠️`, callbackData: `movx:${s.id}:${delta}` });
      }
    }
    if (ligneDeplacer.length > 0) lignesBoutons.push(ligneDeplacer);

    const texte = [
      `⏰ Dans 2h — ${s.patient.prenom} ${s.patient.nom}`,
      "",
      `${formatHeure(s.date)} · ${s.type ?? "Séance"}`,
      s.objectifSMART ? `Objectif : ${s.objectifSMART.texteSMART}` : null,
    ]
      .filter(Boolean)
      .join("\n");

    try {
      await envoyerMessageTelegram(texte, lignesBoutons);
      await prisma.seance.update({ where: { id: s.id }, data: { rappel2hEnvoye: true } });
    } catch (e) {
      console.error("Échec du rappel Telegram 2h:", e);
    }
  }
}

type SeanceAVisio = {
  id: string;
  lienVisio: string | null;
  patient: { prenom: string; email: string | null };
};

async function seancesVisioAEnvoyer(delaiMinCible: number, margeMin: number, champFlag: "rappelVisio1hEnvoye" | "rappelVisio15minEnvoye") {
  const maintenant = new Date();
  const borneBasse = new Date(maintenant.getTime() + (delaiMinCible - margeMin) * 60 * 1000);
  const borneHaute = new Date(maintenant.getTime() + (delaiMinCible + margeMin) * 60 * 1000);

  return prisma.seance.findMany({
    where: {
      date: { gte: borneBasse, lt: borneHaute },
      statut: "Planifiée",
      format: "Distance",
      lienVisio: { not: null },
      [champFlag]: false,
    },
    include: { patient: { select: { prenom: true, email: true } } },
  });
}

async function envoyerRappelsVisio(seances: SeanceAVisio[], champFlag: "rappelVisio1hEnvoye" | "rappelVisio15minEnvoye", delaiTexte: string) {
  for (const s of seances) {
    // Rien à envoyer sans email patient — on ne marque le rappel "envoyé" que si l'email part réellement,
    // pour ne pas perdre silencieusement le rappel si l'email est renseigné plus tard hors de la fenêtre.
    if (!s.patient.email || !s.lienVisio) continue;
    try {
      await envoyerNotificationPatient({
        destinataire: s.patient.email,
        nomPatient: s.patient.prenom,
        sujet: `Ta séance visio commence ${delaiTexte}`,
        texte: `Ta séance en visio commence ${delaiTexte}. Voici le lien pour nous rejoindre :\n\n${s.lienVisio}`,
      });
      await prisma.seance.update({ where: { id: s.id }, data: { [champFlag]: true } });
    } catch (e) {
      console.error(`Échec du rappel visio (${delaiTexte}):`, e);
    }
  }
}

/** Rappel par email du lien visio, 1h avant une séance à distance. */
export async function envoyerRappelsVisio1h() {
  if (!emailDisponible()) return;
  const seances = await seancesVisioAEnvoyer(60, 10, "rappelVisio1hEnvoye");
  await envoyerRappelsVisio(seances, "rappelVisio1hEnvoye", "dans 1h");
}

/** Rappel par email du lien visio, 15 min avant une séance à distance. */
export async function envoyerRappelsVisio15min() {
  if (!emailDisponible()) return;
  const seances = await seancesVisioAEnvoyer(15, 5, "rappelVisio15minEnvoye");
  await envoyerRappelsVisio(seances, "rappelVisio15minEnvoye", "dans 15 min");
}
