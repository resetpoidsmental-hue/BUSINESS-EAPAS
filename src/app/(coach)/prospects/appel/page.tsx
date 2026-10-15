import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { FicheAppel } from "../components/fiche-appel";

export default function FicheAppelPage() {
  return (
    <div>
      <Link href="/prospects" className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Prospects
      </Link>
      <PageHeader
        title="Fiche d'appel"
        description="À garder ouvert pendant l'appel (téléphone ou visio). Rien n'est enregistré avant que tu cliques « Enregistrer »."
      />
      <FicheAppel />
    </div>
  );
}
