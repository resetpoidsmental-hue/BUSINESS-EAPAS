import { NextRequest, NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { prisma } from "@/lib/db";
import { getCoachSession, getPatientSession } from "@/lib/auth";
import { DevisFacturePDF } from "@/lib/pdf/devis-facture-pdf";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const facture = await prisma.facture.findUnique({ where: { id }, include: { patient: true } });
  if (!facture) return new NextResponse("Introuvable", { status: 404 });

  const coachSession = await getCoachSession();
  const patientSession = await getPatientSession();
  const isOwner = patientSession?.patientId === facture.patientId;
  if (!coachSession && !isOwner) return new NextResponse("Non autorisé", { status: 401 });

  const settings = await prisma.settings.upsert({ where: { id: 1 }, update: {}, create: { id: 1 } });

  const buffer = await renderToBuffer(
    DevisFacturePDF({
      kind: "facture",
      numero: facture.numero,
      date: facture.date,
      settings,
      patient: facture.patient,
      lignes: JSON.parse(facture.lignes),
      total: facture.total,
      dateEcheance: facture.dateEcheance,
      modeReglement: facture.modeReglement,
      statut: facture.statut,
    })
  );

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="facture-${facture.numero}.pdf"`,
    },
  });
}
