import Link from "next/link";
import { Plus } from "lucide-react";
import { prisma } from "@/lib/db";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { BibliothequeRations } from "../components/bibliotheque-rations";
import { calculerRation, type RationQuantites } from "@/lib/categories-ration";

export default async function RationsPage() {
  const [modeles, patients] = await Promise.all([
    prisma.modeleRation.findMany({ where: { patientId: null }, orderBy: { updatedAt: "desc" } }),
    prisma.patient.findMany({
      where: { metier: { in: ["Nutrition", "EAPAS+Nutrition"] } },
      select: { id: true, nom: true, prenom: true },
      orderBy: { nom: "asc" },
    }),
  ]);

  const items = modeles.map((m) => {
    const { totaux } = calculerRation(JSON.parse(m.ration) as RationQuantites);
    return {
      id: m.id,
      nom: m.nom,
      targetKcal: m.targetKcal,
      pctP: totaux.pctP,
      pctL: totaux.pctL,
      pctG: totaux.pctG,
      updatedAt: m.updatedAt.toISOString(),
    };
  });

  return (
    <div>
      <PageHeader
        title="Bibliothèque de rations"
        description="Tes modèles de ration, construits par toi, réutilisables pour n'importe quel patient."
        action={
          <Button asChild>
            <Link href="/nutrition/rations/nouveau">
              <Plus className="h-4 w-4" /> Nouveau modèle
            </Link>
          </Button>
        }
      />
      <BibliothequeRations modeles={items} patients={patients} />
    </div>
  );
}
