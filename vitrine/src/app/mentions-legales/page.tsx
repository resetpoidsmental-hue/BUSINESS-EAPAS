import type { Metadata } from "next";

export const metadata: Metadata = { title: "Mentions légales" };

export default function MentionsLegalesPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6">
      <h1 className="font-display text-3xl font-semibold text-ink">Mentions légales</h1>
      <div className="mt-8 space-y-4 text-sm leading-relaxed text-foreground">
        <p>
          <strong>Éditeur du site</strong> — Martial MILON, Enseignant en Activité
          Physique Adaptée et Santé (EAPAS) &amp; Coach Nutrition, exerçant en tant
          qu&rsquo;auto-entrepreneur. [Adresse, SIRET et coordonnées à compléter dans les
          Réglages de ton activité.]
        </p>
        <p>
          <strong>Hébergement</strong> — Ce site est hébergé sur un serveur privé
          (VPS Hostinger).
        </p>
        <p>
          <strong>Directeur de publication</strong> — Martial MILON.
        </p>
        <p>
          Ce contenu est fourni à titre indicatif et ne remplace pas un avis médical.
          Consulte un professionnel de santé avant de démarrer toute nouvelle activité
          physique, en particulier en cas de pathologie.
        </p>
      </div>
    </div>
  );
}
