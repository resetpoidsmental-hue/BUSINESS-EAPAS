import { NextResponse } from "next/server";
import { readFileSync } from "node:fs";
import { getCoachSession } from "@/lib/auth";
import { cheminSauvegarde } from "@/lib/backup";

export async function GET(_req: Request, { params }: { params: Promise<{ nom: string }> }) {
  const session = await getCoachSession();
  if (!session) return new NextResponse("Non autorisé", { status: 401 });

  const { nom } = await params;
  const chemin = cheminSauvegarde(nom);
  if (!chemin) return new NextResponse("Sauvegarde introuvable", { status: 404 });

  const data = readFileSync(chemin);
  return new NextResponse(new Uint8Array(data), {
    headers: {
      "Content-Type": "application/octet-stream",
      "Content-Disposition": `attachment; filename="${nom}"`,
    },
  });
}
