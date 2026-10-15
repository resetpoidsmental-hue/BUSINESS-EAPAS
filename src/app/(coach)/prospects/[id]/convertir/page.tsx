import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { prisma } from "@/lib/db";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { formatDate } from "@/lib/utils";
import { ConversionForm } from "../../components/conversion-form";

export default async function ConvertirProspectPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const prospect = await prisma.prospect.findUnique({ where: { id } });
  if (!prospect) notFound();
  if (prospect.patientId) redirect(`/patients/${prospect.patientId}`);

  const prestations = await prisma.prestation.findMany({
    where: { actif: true },
    orderBy: { nom: "asc" },
    select: { id: true, nom: true, tarif: true, unite: true },
  });

  const [prenomDefault, ...reste] = prospect.nom.trim().split(/\s+/);
  const nomDefault = reste.join(" ") || prenomDefault;

  return (
    <div>
      <Link href="/prospects" className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Prospects
      </Link>
      <PageHeader
        title={`Convertir ${prospect.nom} en patient`}
        description="On pré-remplit sa fiche et un devis à partir de ce qu'il a déjà laissé — tu vérifies, tu valides."
      />

      {(prospect.message || prospect.notesAppel) && (
        <Card className="mb-6">
          <CardContent className="flex items-center gap-3 p-4">
            <span className="rounded-full bg-primary-soft px-2 py-0.5 text-xs font-semibold text-primary-hover">{prospect.source}</span>
            <p className="flex-1 text-sm text-muted">
              « {prospect.notesAppel || prospect.message} » — reçu le {formatDate(prospect.createdAt)}
            </p>
          </CardContent>
        </Card>
      )}

      <ConversionForm
        prospectId={prospect.id}
        prenomDefault={prenomDefault ?? ""}
        nomDefault={nomDefault ?? ""}
        emailDefault={prospect.email ?? ""}
        telephoneDefault={prospect.telephone ?? ""}
        prestations={prestations}
        prestationDefaultId={prospect.prestationId}
      />
    </div>
  );
}
