import { NextRequest, NextResponse } from "next/server";
import { creerSauvegarde } from "@/lib/backup";

/**
 * Appelée une fois par jour (cron sur le VPS, même principe que les rappels Telegram et les
 * prélèvements) : copie la base de données et ne garde que les 14 dernières copies.
 */
export async function POST(req: NextRequest) {
  const secret = req.headers.get("x-cron-secret");
  if (!process.env.CRON_SECRET || secret !== process.env.CRON_SECRET) {
    return new NextResponse("Non autorisé", { status: 401 });
  }

  try {
    const sauvegarde = creerSauvegarde();
    return NextResponse.json({ ok: true, sauvegarde });
  } catch (e) {
    console.error("Erreur cron sauvegarde:", e);
    // On répond quand même 200 pour éviter que le cron VPS ne s'affole — l'échec est en logs.
    return NextResponse.json({ ok: false, erreur: e instanceof Error ? e.message : "inconnue" });
  }
}
