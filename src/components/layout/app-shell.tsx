"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Salad,
  FileText,
  LifeBuoy,
  Settings,
  Menu,
  X,
  LogOut,
  Link2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { logout } from "@/app/connexion/actions";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Tableau de bord", icon: LayoutDashboard },
  { href: "/patients", label: "Patients & clients", icon: Users },
  { href: "/nutrition", label: "Nutrition", icon: Salad },
  { href: "/administratif", label: "Administratif", icon: FileText },
  { href: "/sav", label: "SAV", icon: LifeBuoy },
  { href: "/reglages", label: "Réglages", icon: Settings },
];

export function AppShell({
  nom,
  portalEnabled,
  children,
}: {
  nom: string;
  portalEnabled: boolean;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const initial = nom.trim().charAt(0).toUpperCase() || "?";

  const navContent = (
    <>
      <div className="flex items-center gap-2 px-5 py-5">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground font-bold">
          E
        </div>
        <span className="text-sm font-semibold">EAPAS Suite</span>
      </div>
      <nav className="flex flex-1 flex-col gap-1 px-3">
        {NAV_ITEMS.map((item) => {
          const active = pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              className={cn(
                "flex items-center gap-3 rounded-[var(--radius-sm)] px-3 py-2.5 text-sm font-medium transition-colors",
                active
                  ? "bg-primary-soft text-primary"
                  : "text-muted hover:bg-surface-muted hover:text-foreground"
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {item.label}
            </Link>
          );
        })}
        {portalEnabled && (
          <div className="mt-4 flex items-center gap-2 rounded-[var(--radius-sm)] bg-primary-soft/60 px-3 py-2.5 text-xs text-primary">
            <Link2 className="h-3.5 w-3.5 shrink-0" />
            Portail patient activé
          </div>
        )}
      </nav>
      <div className="border-t border-border px-3 py-3">
        <div className="flex items-center gap-3 rounded-[var(--radius-sm)] px-2 py-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-surface-muted text-xs font-semibold">
            {initial}
          </div>
          <div className="flex-1 truncate text-sm font-medium">{nom}</div>
          <form action={logout}>
            <button
              type="submit"
              className="flex h-8 w-8 items-center justify-center rounded-[var(--radius-sm)] text-muted hover:bg-surface-muted hover:text-danger"
              title="Se déconnecter"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </form>
        </div>
      </div>
    </>
  );

  return (
    <div className="flex min-h-screen bg-background">
      <aside className="hidden w-64 shrink-0 flex-col border-r border-border bg-surface md:flex">
        {navContent}
      </aside>

      {open && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} />
          <aside className="absolute inset-y-0 left-0 flex w-72 flex-col bg-surface shadow-xl">
            <button
              onClick={() => setOpen(false)}
              className="absolute right-3 top-4 flex h-8 w-8 items-center justify-center rounded-full hover:bg-surface-muted"
            >
              <X className="h-4 w-4" />
            </button>
            {navContent}
          </aside>
        </div>
      )}

      <div className="flex min-h-screen flex-1 flex-col">
        <header className="flex items-center gap-3 border-b border-border bg-surface px-4 py-3 md:hidden">
          <button
            onClick={() => setOpen(true)}
            className="flex h-9 w-9 items-center justify-center rounded-[var(--radius-sm)] hover:bg-surface-muted"
          >
            <Menu className="h-5 w-5" />
          </button>
          <span className="text-sm font-semibold">EAPAS Suite</span>
        </header>
        <main className="flex-1 px-4 py-6 md:px-8 md:py-8">
          <div className="mx-auto w-full max-w-6xl">{children}</div>
        </main>
      </div>
    </div>
  );
}
