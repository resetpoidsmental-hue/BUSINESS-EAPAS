import type { Metadata } from "next";
import { getFormules } from "@/lib/nocodb";
import { FormuleCard } from "@/components/formule-card";

export const metadata: Metadata = {
  title: "Formules & Programmes",
  description:
    "Découvre les programmes d'activité physique adaptée et de coaching nutrition de Santé & Co, et réserve ton appel découverte.",
};

export default async function FormulesPage() {
  const formules = await getFormules();

  return (
    <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
      <p className="text-sm font-semibold uppercase tracking-wide text-primary">Formules</p>
      <h1 className="mt-3 max-w-2xl font-display text-4xl font-semibold text-ink">
        Le programme qui te ressemble
      </h1>
      <p className="mt-4 max-w-2xl text-lg leading-relaxed text-muted">
        Chaque formule commence par un bilan initial complet, pour construire un
        accompagnement vraiment adapté à ta condition et à tes objectifs.
      </p>

      <div className="mt-12 grid gap-6 md:grid-cols-2">
        {formules.map((formule) => (
          <FormuleCard key={formule.Slug} formule={formule} />
        ))}
      </div>
    </div>
  );
}
