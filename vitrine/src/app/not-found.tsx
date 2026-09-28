import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto flex max-w-xl flex-col items-center px-4 py-28 text-center sm:px-6">
      <h1 className="font-display text-4xl font-semibold text-ink">Page introuvable</h1>
      <p className="mt-3 text-muted">Cette page n&rsquo;existe pas ou plus.</p>
      <Link
        href="/"
        className="mt-8 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition hover:bg-primary-hover"
      >
        Retour à l&rsquo;accueil
      </Link>
    </div>
  );
}
