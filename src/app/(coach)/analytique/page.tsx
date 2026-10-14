import { prisma } from "@/lib/db";
import { PageHeader } from "@/components/layout/page-header";
import { calculerAnalytique, type PeriodeKey, type PatientAnalyticsInput } from "@/lib/analytics";
import type { Repartition } from "@/lib/categories-ration";
import { AnalytiqueView } from "./analytique-view";

const PERIODES: PeriodeKey[] = ["semaine", "mois", "tout"];

export default async function AnalytiquePage() {
  const patients = await prisma.patient.findMany({
    orderBy: { nom: "asc" },
    include: {
      seances: { select: { date: true, statut: true, borgRessenti: true } },
      journalEntrees: { select: { date: true, repasStructure: true } },
      bilansNutrition: { select: { date: true, poids: true } },
      bilans: { select: { date: true, tugTemps: true } },
      objectifs: { select: { dateCible: true, createdAt: true, atteint: true } },
      modelesRation: { select: { repartition: true, updatedAt: true }, orderBy: { updatedAt: "desc" }, take: 1 },
      devis: { select: { statut: true, total: true, date: true } },
      factures: { select: { statut: true, total: true, createdAt: true, datePaiement: true } },
    },
  });

  const input: PatientAnalyticsInput[] = patients.map((p) => ({
    id: p.id,
    nom: p.nom,
    prenom: p.prenom,
    seances: p.seances,
    journalEntrees: p.journalEntrees,
    bilansNutrition: p.bilansNutrition,
    bilansCliniques: p.bilans,
    objectifs: p.objectifs,
    repartitionRation: p.modelesRation[0] ? (JSON.parse(p.modelesRation[0].repartition) as Repartition) : null,
    factures: p.factures,
    devis: p.devis,
  }));

  const now = new Date();
  const resultats = Object.fromEntries(PERIODES.map((periode) => [periode, calculerAnalytique(periode, now, input)])) as Record<
    PeriodeKey,
    ReturnType<typeof calculerAnalytique>
  >;

  return (
    <div>
      <PageHeader title="Analytique" description="Tendances de cohorte et comparaison entre patients — calculées directement depuis les dossiers." />
      <AnalytiqueView resultats={resultats} />
    </div>
  );
}
