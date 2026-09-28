import Link from "next/link";
import type { Formule } from "@/lib/types";

export function FormuleCard({ formule }: { formule: Formule }) {
  const inclusions = formule.Inclusions.split("\n").filter(Boolean);

  return (
    <div className="relative flex flex-col rounded-2xl border border-border bg-surface p-8 shadow-sm">
      {formule.Badge && (
        <span className="absolute -top-3 left-8 rounded-full bg-accent px-3 py-1 text-xs font-semibold text-white">
          {formule.Badge}
        </span>
      )}
      <h3 className="font-display text-2xl font-semibold text-ink">{formule.Nom}</h3>
      <p className="mt-2 text-sm text-muted">{formule.Accroche}</p>
      <div className="mt-6 flex items-baseline gap-1">
        <span className="font-display text-4xl font-semibold text-ink">{formule.Prix}€</span>
        <span className="text-sm text-muted">{formule.Unite}</span>
      </div>
      <ul className="mt-6 flex-1 space-y-3 text-sm text-foreground">
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
        href={`/formules/${formule.Slug}`}
        className="mt-8 rounded-full bg-primary px-5 py-3 text-center text-sm font-semibold text-primary-foreground transition hover:bg-primary-hover"
      >
        {formule.CtaLabel}
      </Link>
    </div>
  );
}
