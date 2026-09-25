import { NextRequest, NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { prisma } from "@/lib/db";
import { getCoachSession } from "@/lib/auth";
import { DevisFacturePDF } from "@/lib/pdf/devis-facture-pdf";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getCoachSession();
  if (!session) return new NextResponse("Non autorisé", { status: 401 });

  const { id } = await params;
  const devis = await prisma.devis.findUnique({ where: { id }, include: { patient: true } });
  if (!devis) return new NextResponse("Introuvable", { status: 404 });

  const settings = await prisma.settings.upsert({ where: { id: 1 }, update: {}, create: { id: 1 } });

  const buffer = await renderToBuffer(
    DevisFacturePDF({
      kind: "devis",
      numero: devis.numero,
      date: devis.date,
      settings,
      patient: devis.patient,
      lignes: JSON.parse(devis.lignes),
      total: devis.total,
      validiteJours: devis.validiteJours,
      statut: devis.statut,
    })
  );

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="devis-${devis.numero}.pdf"`,
    },
  });
}
