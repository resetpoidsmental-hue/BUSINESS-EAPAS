import type { Metadata } from "next";
import { getFormules } from "@/lib/nocodb";
import { Quiz } from "@/components/quiz";

export const metadata: Metadata = {
  title: "Bilan forme — quiz gratuit",
  description:
    "Répondez à 5 questions sur votre activité physique et votre objectif, recevez votre bilan personnalisé et la formule Santé & Co la mieux adaptée.",
};

// Voir le commentaire dans app/page.tsx : NocoDB n'est joignable qu'au runtime.
export const dynamic = "force-dynamic";

export default async function QuizPage() {
  const formules = await getFormules();

  return (
    <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6">
      <div className="mx-auto mb-10 max-w-lg text-center">
        <span className="inline-flex items-center rounded-full bg-primary-soft px-3.5 py-1.5 text-xs font-bold text-primary">
          Quiz gratuit · 2 minutes · Résultat immédiat
        </span>
        <h1 className="mt-4 font-display text-3xl font-semibold leading-tight text-ink">
          Quel est votre profil forme ?
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-muted">
          Répondez à 5 questions courtes et recevez un bilan personnalisé, avec la
          formule d&rsquo;accompagnement la mieux adaptée à votre situation.
        </p>
      </div>

      <Quiz formules={formules} />

      <p className="mx-auto mt-8 max-w-md text-center text-xs leading-relaxed text-muted">
        Les réponses servent uniquement à personnaliser votre bilan. Aucune donnée de
        santé n&rsquo;est demandée à ce stade — ce test ne remplace pas un avis
        médical.
      </p>
    </div>
  );
}
