import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getFormuleBySlug, getFormules } from "@/lib/nocodb";

export async function generateStaticParams() {
  const formules = await getFormules();
  return formules.map((f) => ({ slug: f.Slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const formule = await getFormuleBySlug(slug);
  if (!formule) return {};
  return { title: formule.Nom, description: formule.Accroche };
}

export default async function FormuleDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const formule = await getFormuleBySlug(slug);
  if (!formule) notFound();

  const inclusions = formule.Inclusions.split("\n").filter(Boolean);
  const paragraphes = formule.DescriptionLongue.split("\n\n").filter(Boolean);

  return (
    <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6">
      <p className="text-sm font-semibold uppercase tracking-wide text-primary">Formule</p>
      <h1 className="mt-3 font-display text-4xl font-semibold text-ink">{formule.Nom}</h1>
      <p className="mt-3 text-lg text-muted">{formule.Accroche}</p>

      <div className="mt-10 grid gap-10 md:grid-cols-[1.4fr_1fr]">
        <div className="space-y-4 text-base leading-relaxed text-foreground">
          {paragraphes.map((p, i) => (
            <p key={i}>{p}</p>
          ))}
        </div>

        <div className="h-fit rounded-2xl border border-border bg-surface p-6">
          <div className="flex items-baseline gap-1">
            <span className="font-display text-3xl font-semibold text-ink">{formule.Prix}€</span>
            <span className="text-sm text-muted">{formule.Unite}</span>
          </div>
          <ul className="mt-5 space-y-2.5 text-sm text-foreground">
            {inclusions.map((item) => (
              <li key={item} className="flex items-start gap-2.5">
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="mt-0.5 shrink-0 text-primary"
                >
                  <path d="M20 6L9 17l-5-5" />
                </svg>
                <span>{item}</span>
              </li>
            ))}
          </ul>
          <Link
            href="/contact"
            className="mt-6 block rounded-full bg-primary px-5 py-3 text-center text-sm font-semibold text-primary-foreground transition hover:bg-primary-hover"
          >
            {formule.CtaLabel}
          </Link>
          <p className="mt-3 text-center text-xs text-muted">
            Sans engagement — réponse sous 48h.
          </p>
        </div>
      </div>
    </div>
  );
}
