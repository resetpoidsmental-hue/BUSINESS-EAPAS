import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { RecetteForm } from "../../components/recette-form";

export default function NouvelleRecettePage() {
  return (
    <div>
      <Link href="/nutrition/recettes" className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Bibliothèque de recettes
      </Link>
      <PageHeader title="Nouvelle recette" description="Donne-lui un titre, indique les repas et catégories concernés, puis décris-la." />
      <RecetteForm mode="create" />
    </div>
  );
}
