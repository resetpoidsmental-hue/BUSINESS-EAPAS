import { NextRequest, NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { prisma } from "@/lib/db";
import { getCoachSession } from "@/lib/auth";
import { ContratPDF } from "@/lib/pdf/contrat-pdf";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getCoachSession();
  if (!session) return new NextResponse("Non autorisé", { status: 401 });

  const { id } = await params;
  const contrat = await prisma.contrat.findUnique({ where: { id }, include: { patient: true } });
  if (!contrat) return new NextResponse("Introuvable", { status: 404 });

  const settings = await prisma.settings.upsert({ where: { id: 1 }, update: {}, create: { id: 1 } });

  const buffer = await renderToBuffer(
    ContratPDF({
      numero: contrat.numero,
      dateDebut: contrat.dateDebut,
      settings,
      patient: contrat.patient,
      formule: contrat.formule,
      inclusions: contrat.inclusions,
      dureeMois: contrat.dureeMois,
      frequenceSeances: contrat.frequenceSeances,
      tarif: contrat.tarif,
      modalitePaiement: contrat.modalitePaiement,
      conditionsAnnulation: contrat.conditionsAnnulation,
    })
  );

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="contrat-${contrat.numero}.pdf"`,
    },
  });
}
