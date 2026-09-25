import { PageHeader } from "@/components/layout/page-header";
import { NewPatientForm } from "./patient-form";

export default function NouveauPatientPage() {
  return (
    <div>
      <PageHeader title="Nouveau dossier" description="Ouvre le dossier dès le premier contact — tu complèteras l'entretien et les bilans ensuite." />
      <NewPatientForm />
    </div>
  );
}
