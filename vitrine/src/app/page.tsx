import Image from "next/image";
import Link from "next/link";
import { getArticles, getFormules } from "@/lib/nocodb";
import { FormuleCard } from "@/components/formule-card";
import { ArticleCard } from "@/components/article-card";

const PROOF_STATS = [
  { value: "2 ans", label: "d'expérience EAPAS" },
  { value: "30+", label: "clients accompagnés" },
  { value: "3 diplômes", label: "Licence STAPS APA-S · BPJEPS APT · Nutrition" },
];

const BENEFITS = [
  {
    title: "Nutrition sur-mesure",
    text: "Un suivi adapté à ton métabolisme et ton quotidien réels — pas un plan générique copié-collé.",
  },
  {
    title: "Mouvement sans risque",
    text: "Un programme d'activité physique construit sur ton bilan (tests PASS), pour progresser sans te blesser.",
  },
  {
    title: "Un seul interlocuteur",
    text: "Nutrition et activité physique pensées ensemble, par la même personne qualifiée sur les deux volets.",
  },
  {
    title: "Résultats mesurés",
    text: "Comparaison T0/T1/T2 à chaque bilan : tu vois noir sur blanc ce qui a changé, pas juste « ça devrait marcher ».",
  },
];

const STEPS = [
  {
    title: "Appel découverte",
    text: "15 min, gratuit, en visio, pour parler de tes objectifs et de tes contraintes.",
  },
  {
    title: "Bilan initial — 79€",
    text: "En présentiel (rayon de 50 km autour de Lunéville) : tests physiques + entretien complet. Au-delà de ce rayon, le bilan se fait aussi en visio.",
  },
  {
    title: "Programme & séances",
    text: "Suivi en visio-conférence, ajusté séance après séance à ta progression.",
  },
  {
    title: "Bilans réguliers",
    text: "T1, T2… en présentiel, pour mesurer et ajuster — jusqu'au bilan final.",
  },
];

const FAQ = [
  {
    question: "Est-ce encore un régime strict qui ne va pas tenir ?",
    answer:
      "Non. L'objectif est un rééquilibrage nutrition + mouvement adapté à ton quotidien et à tes capacités réelles, pas une restriction à court terme — c'est justement ce qui fait tenir les résultats dans la durée.",
  },
  {
    question: "Comment se déroulent les séances : en visio ou en présentiel ?",
    answer:
      "Le suivi se fait principalement en visio-conférence. Les bilans (initial, intermédiaires, final) se font en présentiel, dans un rayon de 50 km autour de Lunéville.",
  },
  {
    question: "Je n'ai jamais fait de sport, ou j'ai une pathologie / un surpoids important, est-ce adapté ?",
    answer:
      "Oui. C'est exactement le rôle du bilan initial : identifier tes limites réelles pour construire un programme sécurisé, que tu partes de zéro ou avec une contrainte de santé.",
  },
  {
    question: "Ai-je besoin d'un certificat médical avant de commencer ?",
    answer:
      "Ce n'est pas obligatoire, mais fortement recommandé si tu as une pathologie. Sans certificat, tu signes une décharge avant de démarrer.",
  },
  {
    question: "Quels sont tes horaires de disponibilité ?",
    answer:
      "Du lundi au vendredi, 9h–17h. Tu peux aussi m'écrire par mail à tout moment : je réponds rapidement.",
  },
];

export default async function AccueilPage() {
  const [formules, articles] = await Promise.all([getFormules(), getArticles()]);
  const derniersArticles = articles.slice(0, 3);

  return (
    <>
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute -right-24 -top-24 h-80 w-80 rounded-full bg-primary-soft" />
        <div className="pointer-events-none absolute -right-4 top-28 h-64 w-64 rounded-full bg-accent-soft" />
        <div className="relative mx-auto grid max-w-6xl gap-10 px-4 py-20 sm:px-6 sm:py-28 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-primary">
              Coaching Nutrition &amp; Mouvement
            </p>
            <h1 className="mt-4 max-w-xl font-display text-4xl font-semibold leading-tight text-ink sm:text-5xl">
              Perds du poids pour de bon — sans repartir de zéro à chaque régime, sans
              te blesser en reprenant le sport.
            </h1>
            <p className="mt-5 max-w-xl text-lg leading-relaxed text-muted">
              Un accompagnement nutrition + activité physique individuel, pensé pour
              les corps qui ont déjà essayé plein de choses : bilan complet, programme
              ajusté à tes capacités réelles, suivi mesuré à chaque étape.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-4">
              <Link
                href="/contact"
                className="rounded-full bg-primary px-6 py-3.5 text-sm font-semibold text-primary-foreground transition hover:bg-primary-hover"
              >
                Réserver un appel découverte
              </Link>
              <Link
                href="/formules"
                className="rounded-full border border-border bg-surface px-6 py-3.5 text-sm font-semibold text-ink transition hover:border-primary hover:text-primary"
              >
                Découvrir les formules
              </Link>
            </div>
          </div>
          <div className="relative aspect-[4/5] overflow-hidden rounded-[28px] border border-border lg:aspect-[4/5]">
            <Image
              src="/images/hero-seance-duo.webp"
              alt="Séance d'activité physique adaptée, coach et client souriants"
              fill
              priority
              sizes="(min-width: 1024px) 480px, 100vw"
              className="object-cover"
            />
          </div>
        </div>
      </section>

      <section className="border-y border-border bg-surface-muted">
        <div className="mx-auto flex max-w-6xl flex-wrap justify-between gap-6 px-4 py-9 sm:px-6">
          {PROOF_STATS.map((stat) => (
            <div key={stat.label} className="min-w-[160px] flex-1 text-center">
              <div className="font-display text-2xl font-semibold text-primary">
                {stat.value}
              </div>
              <div className="mt-1 text-sm text-muted">{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <p className="text-sm font-semibold uppercase tracking-wide text-primary">
          Avant / après
        </p>
        <h2 className="mt-3 max-w-2xl font-display text-3xl font-semibold text-ink">
          Pourquoi les régimes et les programmes « tout prêt » ne tiennent jamais
        </h2>
        <div className="mt-8 grid gap-6 sm:grid-cols-2">
          <div className="rounded-2xl border border-accent/30 bg-accent-soft p-7">
            <h3 className="font-display text-lg font-semibold text-ink">
              Le cycle habituel
            </h3>
            <ul className="mt-4 space-y-3 text-sm leading-relaxed text-foreground">
              <li>Un énième régime qui marche 3 semaines, puis la reprise de poids</li>
              <li>
                Des programmes de sport génériques qui ignorent tes limites et
                finissent par te blesser ou te décourager
              </li>
              <li>Un coach nutrition et un coach sport qui ne se parlent pas — à toi de faire le lien</li>
            </ul>
          </div>
          <div className="rounded-2xl border border-primary/30 bg-primary-soft p-7">
            <h3 className="font-display text-lg font-semibold text-ink">
              Avec Santé &amp; Co
            </h3>
            <ul className="mt-4 space-y-3 text-sm leading-relaxed text-foreground">
              <li>Un bilan complet (corps + capacités) avant toute recommandation</li>
              <li>
                Nutrition ET activité physique pensées ensemble, par la même personne
                diplômée sur les deux
              </li>
              <li>Des bilans réguliers (T1, T2…) qui prouvent que ça tient, pas juste une promesse</li>
            </ul>
          </div>
        </div>
      </section>

      <section className="bg-surface-muted py-16">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <p className="text-sm font-semibold uppercase tracking-wide text-primary">
            Ce que ça change pour toi
          </p>
          <h2 className="mt-3 font-display text-3xl font-semibold text-ink">
            Bénéfices concrets de l&rsquo;accompagnement
          </h2>
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {BENEFITS.map((item) => (
              <div key={item.title} className="rounded-2xl border border-border bg-surface p-6">
                <h3 className="font-display text-base font-semibold text-ink">{item.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">{item.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <p className="text-sm font-semibold uppercase tracking-wide text-primary">
          Le déroulé
        </p>
        <h2 className="mt-3 font-display text-3xl font-semibold text-ink">
          Comment ça marche ?
        </h2>
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((step, index) => (
            <div key={step.title} className="rounded-2xl border border-border bg-surface p-6">
              <div className="font-display text-2xl font-semibold text-accent">
                {index + 1}
              </div>
              <h3 className="mt-2 font-display text-base font-semibold text-ink">
                {step.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">{step.text}</p>
            </div>
          ))}
        </div>
        <p className="mt-6 max-w-2xl text-sm leading-relaxed text-muted">
          Suivi majoritairement en visio, bilans en présentiel dans un rayon de 50 km
          autour de Lunéville (ou en visio au-delà), disponibilités du lundi au
          vendredi 9h–17h.
        </p>
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

      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <div className="grid gap-10 sm:grid-cols-[0.8fr_1.2fr] sm:items-center">
          <div className="relative aspect-square overflow-hidden rounded-[24px] border border-border">
            <Image
              src="/images/seance-apa-elastique.webp"
              alt="Séance d'activité physique adaptée avec élastique, en position assise"
              fill
              sizes="(min-width: 640px) 360px, 100vw"
              className="object-cover"
            />
          </div>
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-primary">
              À propos
            </p>
            <blockquote className="mt-3 font-display text-xl font-medium leading-snug text-ink">
              « Mon métier, c&rsquo;est de construire un programme à partir de ce que
              tu es capable de faire aujourd&rsquo;hui — pas d&rsquo;un modèle
              standard. »
            </blockquote>
            <p className="mt-4 text-sm leading-relaxed text-muted">
              Martial MILON — Enseignant en Activité Physique Adaptée et Santé, Coach
              Nutrition. Licence STAPS mention APA-S, BPJEPS Activités Physiques pour
              Tous et certifié en nutrition, avec 2 ans d&rsquo;expérience et plus de
              30 clients accompagnés. Suivi principalement en visio-conférence ;
              bilans (initial, intermédiaires, final) en présentiel dans un rayon de
              50 km autour de Lunéville.
            </p>
            <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-muted">
              EAPAS &amp; Coach Nutrition
            </p>
          </div>
        </div>
      </section>

      <section id="faq" className="scroll-mt-20 bg-surface-muted py-16">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <p className="text-sm font-semibold uppercase tracking-wide text-primary">
            Questions fréquentes
          </p>
          <h2 className="mt-3 font-display text-3xl font-semibold text-ink">FAQ</h2>
          <div className="mt-8 flex flex-col gap-3">
            {FAQ.map((item) => (
              <div
                key={item.question}
                className="rounded-2xl border border-border bg-surface p-5 sm:p-6"
              >
                <h3 className="font-display text-base font-semibold text-ink">
                  {item.question}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">{item.answer}</p>
              </div>
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
            Prêt·e à arrêter le yo-yo ?
          </h2>
          <p className="mx-auto mt-3 max-w-lg text-sm leading-relaxed text-primary-foreground/85">
            Réserve un appel découverte gratuit et sans engagement : on fait le point
            sur ton parcours (régimes essayés, contraintes, objectifs) pour voir si
            l&rsquo;accompagnement est fait pour toi.
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
