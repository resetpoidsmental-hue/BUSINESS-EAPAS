import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { prisma } from "@/lib/db";
import { PageHeader } from "@/components/layout/page-header";
import { ProspectForm } from "../components/prospect-form";

export default async function NouveauProspectPage() {
  const prestations = await prisma.prestation.findMany({ where: { actif: true }, orderBy: { nom: "asc" }, select: { id: true, nom: true } });

  return (
    <div>
      <Link href="/prospects" className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Prospects
      </Link>
      <PageHeader title="Nouveau prospect" description="Pour une piste venue d'ailleurs que du site (réseaux, parrainage, en réel…)." />
      <ProspectForm prestations={prestations} />
    </div>
  );
}
