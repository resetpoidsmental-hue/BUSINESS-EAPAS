import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { prisma } from "@/lib/db";
import { PageHeader } from "@/components/layout/page-header";
import { RationBuilder } from "../../components/ration-builder";
import type { RecetteItem } from "../../components/bibliotheque-recettes";
import type { MealKey } from "@/lib/categories-ration";

export default async function NouveauModeleRationPage({
  searchParams,
}: {
  searchParams: Promise<{ patientId?: string; targetKcal?: string }>;
}) {
  const { patientId, targetKcal } = await searchParams;

  const recettesDb = await prisma.recette.findMany({ orderBy: { updatedAt: "desc" } });
  const recettes: RecetteItem[] = recettesDb.map((r) => ({
    id: r.id,
    titre: r.titre,
    repas: JSON.parse(r.repas) as MealKey[],
    categories: JSON.parse(r.categories) as string[],
    tags: JSON.parse(r.tags) as string[],
    description: r.description,
    updatedAt: r.updatedAt.toISOString(),
  }));

  return (
    <div>
      <Link
        href={patientId ? `/patients/${patientId}` : "/nutrition/rations"}
        className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> {patientId ? "Retour à la fiche patient" : "Bibliothèque de rations"}
      </Link>
      <PageHeader title="Nouveau modèle de ration" description="Construis le tableau de ration, répartis-le par repas, puis écris le menu type." />
      <RationBuilder
        mode="create"
        patientId={patientId ?? null}
        defaultTargetKcal={targetKcal ? Number(targetKcal) : undefined}
        recettes={recettes}
      />
    </div>
  );
}
