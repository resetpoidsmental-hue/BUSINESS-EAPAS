import type { Metadata } from "next";
import Link from "next/link";
import { getFormules } from "@/lib/nocodb";
import { FormuleCard } from "@/components/formule-card";

export const metadata: Metadata = {
  title: "Formules & Programmes",
  description:
    "Un accompagnement nutrition + activité physique adaptée, pas un programme générique. Découvre les formules de Santé & Co et réserve ton appel découverte.",
};

export default async function FormulesPage() {
  const formules = await getFormules();

  return (
    <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
      <p className="text-sm font-semibold uppercase tracking-wide text-primary">Formules</p>
      <h1 className="mt-3 max-w-2xl font-display text-4xl font-semibold text-ink">
        Un accompagnement qui tient, pas un programme de plus
      </h1>
      <p className="mt-4 max-w-2xl text-lg leading-relaxed text-muted">
        Chaque formule démarre par le même bilan initial (79€) : tests physiques et
        entretien nutrition complet, pour construire un programme adapté à tes
        capacités réelles — pas un plan copié-collé. Ensuite, choisis le rythme de
        suivi qui te correspond.
      </p>

      <div className="mt-12 grid gap-6 md:grid-cols-2">
        {formules.map((formule) => (
          <FormuleCard key={formule.Slug} formule={formule} />
        ))}
      </div>

      <p className="mt-10 text-sm text-muted">
        Une question avant de te décider ? Consulte la{" "}
        <Link href="/#faq" className="font-semibold text-primary hover:underline">
          FAQ
        </Link>{" "}
        ou{" "}
        <Link href="/contact" className="font-semibold text-primary hover:underline">
          réserve un appel découverte
        </Link>
        , gratuit et sans engagement.
      </p>
    </div>
  );
}
