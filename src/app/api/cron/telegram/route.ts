import { NextRequest, NextResponse } from "next/server";
import { envoyerDigestVeille, envoyerDigestMatin, envoyerRappels2h } from "@/lib/rappels-seance";
import { proposerRelancesProspects } from "@/lib/relance-prospects";

/**
 * Appelée par des tâches cron distinctes sur le VPS (mode=veille une fois le soir, mode=matin une
 * fois le matin, mode=rappel2h toutes les ~15-30 min, mode=relanceProspects environ une fois par
 * heure) — voir le README pour les horaires exacts.
 */
export async function POST(req: NextRequest) {
  const secret = req.headers.get("x-cron-secret");
  if (!process.env.CRON_SECRET || secret !== process.env.CRON_SECRET) {
    return new NextResponse("Non autorisé", { status: 401 });
  }

  const mode = req.nextUrl.searchParams.get("mode");

  try {
    if (mode === "veille") {
      await envoyerDigestVeille();
    } else if (mode === "matin") {
      await envoyerDigestMatin();
    } else if (mode === "rappel2h") {
      await envoyerRappels2h();
    } else if (mode === "relanceProspects") {
      await proposerRelancesProspects();
    } else {
      return new NextResponse("Paramètre mode manquant ou invalide (veille | matin | rappel2h | relanceProspects)", { status: 400 });
    }
  } catch (e) {
    console.error("Erreur cron Telegram:", e);
    // On répond quand même 200 pour éviter que le cron VPS ne s'affole — l'échec est en logs.
  }

  return NextResponse.json({ ok: true, mode });
}
