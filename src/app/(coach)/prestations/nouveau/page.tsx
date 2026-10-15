import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { PrestationForm } from "../components/prestation-form";

export default function NouvellePrestationPage() {
  return (
    <div>
      <Link href="/prestations" className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Prestations
      </Link>
      <PageHeader title="Nouvelle prestation" description="Elle apparaîtra dans le catalogue et pourra être utilisée pour un devis ou un contrat." />
      <PrestationForm mode="create" />
    </div>
  );
}
