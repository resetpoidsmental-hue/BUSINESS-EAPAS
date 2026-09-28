import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getArticleBySlug, getArticles } from "@/lib/nocodb";

export async function generateStaticParams() {
  const articles = await getArticles();
  return articles.map((a) => ({ slug: a.Slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const article = await getArticleBySlug(slug);
  if (!article) return {};
  return {
    title: article.SeoTitre || article.Titre,
    description: article.SeoDescription || article.Extrait,
  };
}

function formatDate(date: string | null) {
  if (!date) return null;
  return new Date(date).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export default async function ArticleDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const article = await getArticleBySlug(slug);
  if (!article) notFound();

  return (
    <article className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
      <Link href="/articles" className="text-sm font-semibold text-primary hover:underline">
        ← Tous les articles
      </Link>
      <p className="mt-6 text-sm font-semibold uppercase tracking-wide text-accent">
        {article.Categorie}
      </p>
      <h1 className="mt-3 font-display text-4xl font-semibold leading-tight text-ink">
        {article.Titre}
      </h1>
      {article.DatePublication && (
        <p className="mt-4 text-sm text-muted">{formatDate(article.DatePublication)}</p>
      )}

      {article.ImageUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={article.ImageUrl}
          alt=""
          className="mt-8 aspect-[16/9] w-full rounded-2xl object-cover"
        />
      )}

      <div
        className="prose-eapas mt-10 max-w-none text-base leading-relaxed text-foreground [&_h2]:mt-8 [&_h2]:font-display [&_h2]:text-2xl [&_h2]:font-semibold [&_h2]:text-ink [&_p]:mt-4 [&_ul]:mt-4 [&_ul]:list-disc [&_ul]:pl-5"
        dangerouslySetInnerHTML={{ __html: article.Contenu }}
      />

      <div className="mt-14 rounded-2xl bg-surface-muted p-6 text-center">
        <p className="font-display text-lg font-semibold text-ink">
          Envie d&rsquo;un accompagnement personnalisé ?
        </p>
        <Link
          href="/contact"
          className="mt-4 inline-block rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition hover:bg-primary-hover"
        >
          Réserver un appel découverte
        </Link>
      </div>
    </article>
  );
}
