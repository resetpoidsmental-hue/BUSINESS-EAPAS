import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { prisma } from "@/lib/db";
import { PageHeader } from "@/components/layout/page-header";
import { RecetteForm } from "../../components/recette-form";
import type { MealKey } from "@/lib/categories-ration";

export default async function RecettePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const recette = await prisma.recette.findUnique({ where: { id } });
  if (!recette) notFound();

  return (
    <div>
      <Link href="/nutrition/recettes" className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Bibliothèque de recettes
      </Link>
      <PageHeader title={recette.titre} />
      <RecetteForm
        mode="edit"
        recetteId={recette.id}
        initial={{
          titre: recette.titre,
          repas: JSON.parse(recette.repas) as MealKey[],
          categories: JSON.parse(recette.categories) as string[],
          tags: JSON.parse(recette.tags) as string[],
          description: recette.description,
        }}
      />
    </div>
  );
}
