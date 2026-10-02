import Link from "next/link";
import { Logo } from "@/components/logo";

const NAV = [
  { href: "/formules", label: "Formules" },
  { href: "/articles", label: "Articles" },
  { href: "/recettes", label: "Recettes" },
  { href: "/contact", label: "Contact" },
];

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
        <Logo height={34} />
        <nav className="hidden items-center gap-7 text-sm font-medium text-muted sm:flex">
          {NAV.map((item) => (
            <Link key={item.href} href={item.href} className="transition hover:text-ink">
              {item.label}
            </Link>
          ))}
        </nav>
        <Link
          href="/formules"
          className="rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition hover:bg-primary-hover"
        >
          Réserver un appel
        </Link>
      </div>
      <nav className="flex items-center gap-5 overflow-x-auto border-t border-border px-4 py-2 text-sm font-medium text-muted sm:hidden">
        {NAV.map((item) => (
          <Link key={item.href} href={item.href} className="whitespace-nowrap transition hover:text-ink">
            {item.label}
          </Link>
        ))}
      </nav>
    </header>
  );
}
