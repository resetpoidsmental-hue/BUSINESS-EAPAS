import Link from "next/link";
import { getArticles, getFormules } from "@/lib/nocodb";
import { FormuleCard } from "@/components/formule-card";
import { ArticleCard } from "@/components/article-card";

export default async function AccueilPage() {
  const [formules, articles] = await Promise.all([getFormules(), getArticles()]);
  const derniersArticles = articles.slice(0, 3);

  return (
    <>
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute -right-24 -top-24 h-80 w-80 rounded-full bg-primary-soft" />
        <div className="pointer-events-none absolute -right-4 top-28 h-64 w-64 rounded-full bg-accent-soft" />
        <div className="relative mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-28">
          <p className="text-sm font-semibold uppercase tracking-wide text-primary">
            EAPAS &amp; Coach Nutrition
          </p>
          <h1 className="mt-4 max-w-2xl font-display text-4xl font-semibold leading-tight text-ink sm:text-5xl">
            Retrouve le mouvement et l&rsquo;équilibre alimentaire, à ton rythme.
          </h1>
          <p className="mt-5 max-w-xl text-lg leading-relaxed text-muted">
            Martial MILON t&rsquo;accompagne avec des programmes d&rsquo;activité physique
            adaptée et de nutrition personnalisés — bilans, séances individuelles et
            suivi de progression, pour des résultats qui durent.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-4">
            <Link
              href="/formules"
              className="rounded-full bg-primary px-6 py-3.5 text-sm font-semibold text-primary-foreground transition hover:bg-primary-hover"
            >
              Découvrir les formules
            </Link>
            <Link
              href="/contact"
              className="rounded-full border border-border bg-surface px-6 py-3.5 text-sm font-semibold text-ink transition hover:border-primary hover:text-primary"
            >
              Réserver un appel découverte
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <div className="grid gap-6 sm:grid-cols-3">
          {[
            {
              title: "Bilan initial complet",
              text: "Tests physiques (PASS), entretien de tes objectifs et de tes limitations, pour un programme vraiment adapté.",
            },
            {
              title: "Séances individuelles",
              text: "Un accompagnement en tête-à-tête, ajusté à ton ressenti et à ta progression, séance après séance.",
            },
            {
              title: "Suivi mesuré",
              text: "Des bilans intermédiaires réguliers pour objectiver tes progrès et ajuster le programme si besoin.",
            },
          ].map((item) => (
            <div key={item.title} className="rounded-2xl border border-border bg-surface p-6">
              <h3 className="font-display text-lg font-semibold text-ink">{item.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">{item.text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-surface-muted py-16">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="flex items-end justify-between">
            <h2 className="font-display text-3xl font-semibold text-ink">Les formules</h2>
            <Link href="/formules" className="text-sm font-semibold text-primary hover:underline">
              Voir tout
            </Link>
          </div>
          <div className="mt-8 grid gap-6 md:grid-cols-2">
            {formules.slice(0, 2).map((formule) => (
              <FormuleCard key={formule.Slug} formule={formule} />
            ))}
          </div>
        </div>
      </section>

      {derniersArticles.length > 0 && (
        <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
          <div className="flex items-end justify-between">
            <h2 className="font-display text-3xl font-semibold text-ink">Derniers articles</h2>
            <Link href="/articles" className="text-sm font-semibold text-primary hover:underline">
              Tous les articles
            </Link>
          </div>
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {derniersArticles.map((article) => (
              <ArticleCard key={article.Slug} article={article} />
            ))}
          </div>
        </section>
      )}

      <section className="mx-auto max-w-6xl px-4 pb-24 sm:px-6">
        <div className="rounded-3xl bg-primary px-8 py-14 text-center sm:px-16">
          <h2 className="font-display text-3xl font-semibold text-primary-foreground">
            Prêt·e à démarrer ?
          </h2>
          <p className="mx-auto mt-3 max-w-lg text-sm leading-relaxed text-primary-foreground/85">
            Réserve un appel découverte gratuit et sans engagement pour parler de tes
            objectifs et voir quelle formule te correspond.
          </p>
          <Link
            href="/contact"
            className="mt-7 inline-block rounded-full bg-white px-6 py-3.5 text-sm font-semibold text-primary transition hover:bg-white/90"
          >
            Réserver un appel découverte
          </Link>
        </div>
      </section>
    </>
  );
}
