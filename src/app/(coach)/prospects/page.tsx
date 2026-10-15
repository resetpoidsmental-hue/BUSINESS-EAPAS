import Link from "next/link";
import { prisma } from "@/lib/db";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Plus, Phone } from "lucide-react";
import { ProspectsList, type ProspectRow } from "./components/prospects-list";

export default async function ProspectsPage() {
  const prospects = await prisma.prospect.findMany({
    orderBy: { createdAt: "desc" },
    include: { prestation: { select: { nom: true } } },
  });

  const rows: ProspectRow[] = prospects.map((p) => ({
    id: p.id,
    nom: p.nom,
    email: p.email,
    telephone: p.telephone,
    source: p.source,
    statut: p.statut,
    createdAt: p.createdAt.toISOString(),
    prestationNom: p.prestation?.nom ?? null,
    patientId: p.patientId,
  }));

  return (
    <div>
      <PageHeader
        title="Prospects"
        description="Toutes tes pistes, quelle que soit leur origine — site, réseaux, bouche-à-oreille, partenariat..."
        action={
          <div className="flex flex-wrap gap-2">
            <Button asChild variant="outline">
              <Link href="/prospects/appel">
                <Phone className="h-4 w-4" /> Fiche d&rsquo;appel
              </Link>
            </Button>
            <Button asChild>
              <Link href="/prospects/nouveau">
                <Plus className="h-4 w-4" /> Nouveau prospect
              </Link>
            </Button>
          </div>
        }
      />
      <ProspectsList prospects={rows} />
    </div>
  );
}
