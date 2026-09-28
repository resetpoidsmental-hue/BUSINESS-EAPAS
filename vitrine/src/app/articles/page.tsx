import type { Metadata } from "next";
import { getArticles } from "@/lib/nocodb";
import { ArticleCard } from "@/components/article-card";

export const metadata: Metadata = {
  title: "Articles",
  description:
    "Conseils en activité physique adaptée, nutrition et bien-être, publiés chaque semaine par Santé & Co.",
};

export default async function ArticlesPage() {
  const articles = await getArticles();

  return (
    <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
      <p className="text-sm font-semibold uppercase tracking-wide text-primary">Articles</p>
      <h1 className="mt-3 max-w-2xl font-display text-4xl font-semibold text-ink">
        Conseils santé, bien-être & activité physique
      </h1>
      <p className="mt-4 max-w-2xl text-lg leading-relaxed text-muted">
        Un nouvel article chaque semaine sur l&rsquo;activité physique adaptée, la
        nutrition et le bien-être au quotidien.
      </p>

      {articles.length === 0 ? (
        <p className="mt-12 text-muted">Aucun article publié pour le moment.</p>
      ) : (
        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {articles.map((article) => (
            <ArticleCard key={article.Slug} article={article} />
          ))}
        </div>
      )}
    </div>
  );
}
