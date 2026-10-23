import { prisma } from "@/lib/db";
import { telegramDisponible, envoyerMessageTelegram, type TelegramBouton } from "@/lib/telegram";
import { assistantIADisponible, genererMessageRelanceProspect } from "@/lib/ai";

const VINGT_QUATRE_HEURES_MS = 24 * 60 * 60 * 1000;

/**
 * Pour chaque prospect encore "Nouveau" 24h après sa création, propose une seule fois un brouillon
 * de relance par email sur Telegram (boutons Envoyer / Ignorer). N'envoie jamais l'email elle-même —
 * ça n'arrive que si le coach tape "Envoyer" (voir le webhook Telegram). Un prospect déjà proposé
 * une fois (`relancePropositionEnvoyee`) n'est jamais reproposé, même ignoré.
 */
export async function proposerRelancesProspects() {
  if (!telegramDisponible() || !assistantIADisponible()) return;

  const seuil = new Date(Date.now() - VINGT_QUATRE_HEURES_MS);
  const prospects = await prisma.prospect.findMany({
    where: {
      statut: "Nouveau",
      email: { not: null },
      relancePropositionEnvoyee: false,
      createdAt: { lte: seuil },
    },
    include: { prestation: { select: { nom: true } } },
  });

  for (const p of prospects) {
    try {
      const brouillon = await genererMessageRelanceProspect({
        nom: p.nom,
        source: p.source,
        message: p.message,
        formuleInteressee: p.prestation?.nom ?? null,
      });

      await prisma.prospect.update({
        where: { id: p.id },
        data: { relancePropositionEnvoyee: true, relanceEmailBrouillon: brouillon },
      });

      const lignesBoutons: TelegramBouton[][] = [
        [
          { texte: "✉️ Envoyer", callbackData: `relenv:${p.id}` },
          { texte: "Ignorer", callbackData: `relign:${p.id}` },
        ],
      ];

      const texte = [
        `📨 Prospect sans réponse depuis 24h — ${p.nom}`,
        `Source : ${p.source}${p.prestation?.nom ? ` · Formule : ${p.prestation.nom}` : ""}`,
        "",
        "Brouillon de relance par email :",
        brouillon,
      ].join("\n");

      await envoyerMessageTelegram(texte, lignesBoutons);
    } catch (e) {
      console.error(`Échec de la proposition de relance pour le prospect ${p.id}:`, e);
    }
  }
}
