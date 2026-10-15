import Link from "next/link";
import { prisma } from "@/lib/db";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Plus } from "lucide-react";
import { PrestationsList } from "./components/prestations-list";

export default async function PrestationsPage() {
  const prestations = await prisma.prestation.findMany({ orderBy: [{ actif: "desc" }, { updatedAt: "desc" }] });

  return (
    <div>
      <PageHeader
        title="Prestations"
        description="Ta grille de tarifs — utilisée pour construire tes devis et contrats sans tout retaper."
        action={
          <Button asChild>
            <Link href="/prestations/nouveau">
              <Plus className="h-4 w-4" /> Nouvelle prestation
            </Link>
          </Button>
        }
      />

      {prestations.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted">
            Aucune prestation pour le moment. Crée la première pour commencer ta grille de tarifs.
          </CardContent>
        </Card>
      ) : (
        <PrestationsList prestations={prestations} />
      )}
    </div>
  );
}
