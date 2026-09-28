import type { Metadata } from "next";
import { getArticles } from "@/lib/nocodb";
import { ArticleCard } from "@/components/article-card";

export const metadata: Metadata = {
  title: "Recettes",
  description: "Des recettes simples et équilibrées pour accompagner ton entraînement, par Santé & Co.",
};

export default async function RecettesPage() {
  const recettes = await getArticles("Recette");

  return (
    <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
      <p className="text-sm font-semibold uppercase tracking-wide text-primary">Recettes</p>
      <h1 className="mt-3 max-w-2xl font-display text-4xl font-semibold text-ink">
        Manger équilibré, simplement
      </h1>
      <p className="mt-4 max-w-2xl text-lg leading-relaxed text-muted">
        Des recettes rapides et accessibles pour accompagner tes séances et ton
        quotidien.
      </p>

      {recettes.length === 0 ? (
        <p className="mt-12 text-muted">Aucune recette publiée pour le moment.</p>
      ) : (
        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {recettes.map((recette) => (
            <ArticleCard key={recette.Slug} article={recette} />
          ))}
        </div>
      )}
    </div>
  );
}
