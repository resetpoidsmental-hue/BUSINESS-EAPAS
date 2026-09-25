import Link from "next/link";
import { prisma } from "@/lib/db";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDate, formatNumber, initials } from "@/lib/utils";
import { CalculateurAutonome } from "./calculateur-autonome";

export default async function NutritionPage() {
  const clients = await prisma.patient.findMany({
    where: { metier: { in: ["Nutrition", "EAPAS+Nutrition"] } },
    include: { bilansNutrition: { orderBy: { date: "desc" }, take: 1 } },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <PageHeader title="Nutrition" description="Calculateur rapide et suivi des clients nutrition." />

      <div className="mb-8">
        <CalculateurAutonome />
      </div>

      <h2 className="mb-3 text-sm font-semibold">Clients suivis en nutrition</h2>
      {clients.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted">
            Aucun client nutrition pour le moment. Renseigne le métier « Nutrition » sur une fiche patient pour le
            voir apparaître ici.
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {clients.map((c) => {
            const bilan = c.bilansNutrition[0];
            return (
              <Link key={c.id} href={`/patients/${c.id}`}>
                <Card className="h-full transition-shadow hover:shadow-md">
                  <CardContent className="flex flex-col gap-3 p-5">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-soft text-sm font-semibold text-primary">
                        {initials(c.nom, c.prenom)}
                      </div>
                      <div>
                        <p className="font-medium leading-tight">
                          {c.prenom} {c.nom}
                        </p>
                        <p className="text-xs text-muted">{c.numDossier}</p>
                      </div>
                    </div>
                    {bilan ? (
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <span className="text-muted">
                          Poids : <strong className="text-foreground">{formatNumber(bilan.poids)} kg</strong>
                        </span>
                        <span className="text-muted">
                          IMC : <strong className="text-foreground">{formatNumber(bilan.imc)}</strong>
                        </span>
                        <span className="col-span-2 text-muted">
                          Cible : <strong className="text-foreground">{formatNumber(bilan.apportCalorique, 0)} kcal/j</strong>
                        </span>
                        <span className="col-span-2 text-muted">Dernier bilan : {formatDate(bilan.date)}</span>
                      </div>
                    ) : (
                      <p className="text-xs text-muted">Aucun bilan nutritionnel enregistré.</p>
                    )}
                    <Badge variant="outline" className="w-fit">
                      {c.metier}
                    </Badge>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
