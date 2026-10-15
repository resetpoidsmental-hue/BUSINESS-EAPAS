import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { prisma } from "@/lib/db";
import { PageHeader } from "@/components/layout/page-header";
import { PrestationForm } from "../components/prestation-form";

export default async function PrestationDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const prestation = await prisma.prestation.findUnique({ where: { id } });
  if (!prestation) notFound();

  return (
    <div>
      <Link href="/prestations" className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Prestations
      </Link>
      <PageHeader title={prestation.nom} description="Modifier cette prestation du catalogue." />
      <PrestationForm
        mode="edit"
        prestationId={prestation.id}
        initial={{
          nom: prestation.nom,
          type: prestation.type,
          tarif: prestation.tarif,
          unite: prestation.unite,
          dureeSemaines: prestation.dureeSemaines,
          inclusions: prestation.inclusions,
          descriptionMarketing: prestation.descriptionMarketing,
        }}
      />
    </div>
  );
}
