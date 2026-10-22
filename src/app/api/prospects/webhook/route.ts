import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

/**
 * Appelée par le workflow n8n "Vitrine - Nouveau prospect" juste après l'enregistrement dans
 * NocoDB, pour que chaque lead du site vitrine entre aussi directement dans le circuit normal
 * (fiche d'appel, conversion) — sans geste manuel du coach. Protégée par un secret partagé
 * (même principe que les routes /api/cron/*), jamais par la session coach puisque n8n ne l'a pas.
 */
export async function POST(req: NextRequest) {
  const secret = req.headers.get("x-webhook-secret");
  if (!process.env.N8N_WEBHOOK_SECRET || secret !== process.env.N8N_WEBHOOK_SECRET) {
    return new NextResponse("Non autorisé", { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON invalide." }, { status: 400 });
  }

  const data = body as Record<string, unknown>;
  const nom = typeof data.nom === "string" ? data.nom.trim() : "";
  if (!nom) return NextResponse.json({ error: "Le nom est obligatoire." }, { status: 400 });

  const email = typeof data.email === "string" && data.email.trim() ? data.email.trim() : null;
  const telephone = typeof data.telephone === "string" && data.telephone.trim() ? data.telephone.trim() : null;
  const message = typeof data.message === "string" && data.message.trim() ? data.message.trim() : null;
  const source = typeof data.source === "string" && data.source.trim() ? data.source.trim() : "Site vitrine";
  const formuleNom = typeof data.formule === "string" && data.formule.trim() ? data.formule.trim() : null;

  let prestationId: string | null = null;
  if (formuleNom) {
    const prestation = await prisma.prestation.findFirst({ where: { nom: formuleNom, actif: true } });
    prestationId = prestation?.id ?? null;
  }

  const prospect = await prisma.prospect.create({
    data: { nom, email, telephone, message, source, prestationId },
  });

  return NextResponse.json({ ok: true, prospectId: prospect.id });
}
