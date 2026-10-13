import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { prisma } from "@/lib/db";
import { PageHeader } from "@/components/layout/page-header";
import { RationBuilder } from "../../components/ration-builder";
import { PropositionMenu } from "../../components/proposition-menu";
import { calculerEcartsRation, type RationQuantites, type Repartition, type MenuType } from "@/lib/categories-ration";

export default async function ModeleRationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const modele = await prisma.modeleRation.findUnique({
    where: { id },
    include: { patient: { select: { id: true, nom: true, prenom: true } } },
  });

  if (!modele) notFound();

  const repartition = JSON.parse(modele.repartition) as Repartition;
  let ecarts: ReturnType<typeof calculerEcartsRation> = [];
  if (modele.patientId) {
    const septJoursAvant = new Date(new Date().getTime() - 7 * 24 * 3600 * 1000);
    const entries = await prisma.journalEntree.findMany({
      where: { patientId: modele.patientId, date: { gte: septJoursAvant } },
      select: { date: true, repasStructure: true },
    });
    ecarts = calculerEcartsRation(repartition, entries);
  }

  return (
    <div>
      <Link
        href={modele.patient ? `/patients/${modele.patient.id}` : "/nutrition/rations"}
        className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> {modele.patient ? `Retour à la fiche de ${modele.patient.prenom}` : "Bibliothèque de rations"}
      </Link>
      <PageHeader
        title={modele.nom}
        description={modele.patient ? `Modèle attribué à ${modele.patient.prenom} ${modele.patient.nom}` : "Modèle de bibliothèque, réutilisable pour n'importe quel patient."}
      />
      <RationBuilder
        mode="edit"
        modeleId={modele.id}
        patientId={modele.patientId}
        initial={{
          nom: modele.nom,
          targetKcal: modele.targetKcal,
          ration: JSON.parse(modele.ration) as RationQuantites,
          repartition,
          menuType: JSON.parse(modele.menuType) as MenuType,
        }}
      />

      {modele.patientId && (
        <div className="mt-6">
          <PropositionMenu modeleId={modele.id} repartition={repartition} ecarts={ecarts} />
        </div>
      )}
    </div>
  );
}
