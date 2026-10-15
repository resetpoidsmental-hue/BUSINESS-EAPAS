import Link from "next/link";
import { prisma } from "@/lib/db";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import { Plus } from "lucide-react";
import { ToggleActifButton } from "./components/toggle-actif-button";

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
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {prestations.map((p) => (
            <Card key={p.id} className={p.actif ? "" : "opacity-55"}>
              <CardContent className="flex flex-col gap-2.5 p-4">
                <div className="flex items-center justify-between">
                  <span className="w-fit rounded-full bg-primary-soft px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide text-primary-hover">
                    {p.type}
                  </span>
                  <span className={`text-[11px] font-semibold ${p.actif ? "text-success" : "text-muted"}`}>
                    {p.actif ? "● Actif" : "○ Inactif"}
                  </span>
                </div>
                <Link href={`/prestations/${p.id}`} className="text-base font-bold text-foreground hover:text-primary">
                  {p.nom}
                </Link>
                <p className="text-xl font-bold">
                  {formatCurrency(p.tarif)} <span className="text-xs font-medium text-muted">/ {p.unite}</span>
                </p>
                {p.inclusions && (
                  <ul className="flex list-disc flex-col gap-0.5 pl-4 text-xs text-muted">
                    {p.inclusions
                      .split("\n")
                      .filter(Boolean)
                      .slice(0, 3)
                      .map((line, i) => (
                        <li key={i}>{line}</li>
                      ))}
                  </ul>
                )}
                <div className="flex items-center gap-2">
                  <Button asChild size="sm" variant="outline">
                    <Link href={`/prestations/${p.id}`}>Modifier</Link>
                  </Button>
                  <ToggleActifButton prestationId={p.id} actif={p.actif} />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
