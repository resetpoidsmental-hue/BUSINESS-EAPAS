import Link from "next/link";
import { Plus } from "lucide-react";
import { prisma } from "@/lib/db";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { BibliothequeRecettes, type RecetteItem } from "../components/bibliotheque-recettes";
import type { MealKey } from "@/lib/categories-ration";

export default async function RecettesPage() {
  const recettes = await prisma.recette.findMany({ orderBy: { updatedAt: "desc" } });

  const items: RecetteItem[] = recettes.map((r) => ({
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
      <PageHeader
        title="Bibliothèque de recettes"
        description="Tes recettes et idées de menus, construites par toi, réutilisables dans n'importe quel modèle de ration."
        action={
          <Button asChild>
            <Link href="/nutrition/recettes/nouveau">
              <Plus className="h-4 w-4" /> Nouvelle recette
            </Link>
          </Button>
        }
      />
      <BibliothequeRecettes recettes={items} />
    </div>
  );
}
