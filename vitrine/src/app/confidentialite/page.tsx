import type { Metadata } from "next";

export const metadata: Metadata = { title: "Politique de confidentialité" };

export default function ConfidentialitePage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6">
      <h1 className="font-display text-3xl font-semibold text-ink">
        Politique de confidentialité
      </h1>
      <div className="mt-8 space-y-4 text-sm leading-relaxed text-foreground">
        <p>
          Les informations transmises via le formulaire de contact (nom, email,
          téléphone, message) sont utilisées uniquement pour te recontacter au sujet
          de ta demande d&rsquo;accompagnement. Elles ne sont jamais transmises à des
          tiers ni utilisées à des fins commerciales autres que ce suivi.
        </p>
        <p>
          Conformément au RGPD, tu peux à tout moment demander l&rsquo;accès, la
          rectification ou la suppression de tes données en écrivant à l&rsquo;adresse
          de contact indiquée sur ce site.
        </p>
        <p>
          Si tu deviens patient·e, tes données de santé sont ensuite gérées dans un
          espace séparé, auto-hébergé, avec ton consentement explicite.
        </p>
      </div>
    </div>
  );
}
