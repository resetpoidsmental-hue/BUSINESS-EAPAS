import { NextResponse } from "next/server";
import { getCoachSession } from "@/lib/auth";
import { getAlertesActives } from "@/lib/notifications";

// Jamais mis en cache : la cloche doit refléter l'état réel au moment où elle est consultée,
// pas une version figée au premier chargement de la mise en page partagée.
export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getCoachSession();
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const alertes = await getAlertesActives();
  return NextResponse.json(alertes);
}
