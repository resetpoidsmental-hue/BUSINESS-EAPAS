import Link from "next/link";
import type { Article } from "@/lib/types";

function formatDate(date: string | null) {
  if (!date) return null;
  return new Date(date).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function ArticleCard({ article }: { article: Article }) {
  return (
    <Link
      href={`/articles/${article.Slug}`}
      className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-surface shadow-sm transition hover:shadow-md"
    >
      <div className="relative aspect-[16/10] w-full overflow-hidden bg-surface-muted">
        {article.ImageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={article.ImageUrl}
            alt=""
            className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center font-display text-3xl font-semibold text-primary/30">
            Santé &amp; Co
          </div>
        )}
      </div>
      <div className="flex flex-1 flex-col p-5">
        <span className="text-xs font-semibold uppercase tracking-wide text-accent">
          {article.Categorie}
        </span>
        <h3 className="mt-2 font-display text-lg font-semibold leading-snug text-ink">
          {article.Titre}
        </h3>
        <p className="mt-2 flex-1 text-sm leading-relaxed text-muted">{article.Extrait}</p>
        {article.DatePublication && (
          <span className="mt-4 text-xs text-muted">{formatDate(article.DatePublication)}</span>
        )}
      </div>
    </Link>
  );
}
