import Link from "next/link";
import { Logo } from "@/components/logo";

export function SiteFooter() {
  return (
    <footer className="mt-24 border-t border-border bg-surface">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-[1.3fr_1fr_1fr]">
        <div>
          <Logo height={30} />
          <p className="mt-3 max-w-sm text-sm leading-relaxed text-muted">
            Activité physique adaptée &amp; coaching nutrition avec Martial MILON —
            un accompagnement personnalisé pour bouger et manger mieux, durablement.
          </p>
        </div>
        <div>
          <div className="text-xs font-semibold uppercase tracking-wide text-muted">
            Le site
          </div>
          <ul className="mt-3 space-y-2 text-sm">
            <li><Link href="/formules" className="text-foreground hover:text-primary">Formules</Link></li>
            <li><Link href="/articles" className="text-foreground hover:text-primary">Articles</Link></li>
            <li><Link href="/recettes" className="text-foreground hover:text-primary">Recettes</Link></li>
            <li><Link href="/contact" className="text-foreground hover:text-primary">Contact</Link></li>
          </ul>
        </div>
        <div>
          <div className="text-xs font-semibold uppercase tracking-wide text-muted">
            Informations
          </div>
          <ul className="mt-3 space-y-2 text-sm">
            <li><Link href="/mentions-legales" className="text-foreground hover:text-primary">Mentions légales</Link></li>
            <li><Link href="/confidentialite" className="text-foreground hover:text-primary">Confidentialité</Link></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-border px-4 py-5 text-center text-xs text-muted sm:px-6">
        © {new Date().getFullYear()} Santé &amp; Co — Martial MILON, EAPAS &amp; Coach Nutrition.
      </div>
    </footer>
  );
}
