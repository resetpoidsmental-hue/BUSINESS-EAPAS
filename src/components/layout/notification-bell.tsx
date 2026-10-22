"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell } from "lucide-react";
import type { AlerteItem } from "@/lib/notifications";

export function NotificationBell({ initialAlertes }: { initialAlertes: AlerteItem[] }) {
  const [alertes, setAlertes] = useState(initialAlertes);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  // La mise en page partagée ne se re-rend pas à chaque navigation (cache routeur de Next.js) :
  // sans ça, la cloche resterait figée sur l'état vu à l'arrivée sur l'app. On revérifie donc
  // nous-mêmes à chaque changement de page et à chaque ouverture du menu.
  useEffect(() => {
    fetch("/api/alertes")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => data && setAlertes(data))
      .catch(() => {});
  }, [pathname]);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  function toggleOpen() {
    setOpen((v) => {
      const next = !v;
      if (next) {
        fetch("/api/alertes")
          .then((r) => (r.ok ? r.json() : null))
          .then((data) => data && setAlertes(data))
          .catch(() => {});
      }
      return next;
    });
  }

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={toggleOpen}
        aria-label="Notifications"
        className="relative flex h-9 w-9 items-center justify-center rounded-[var(--radius-sm)] border border-border hover:bg-surface-muted"
      >
        <Bell className="h-4 w-4" />
        {alertes.length > 0 && (
          <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-danger px-1 text-[10px] font-bold text-white">
            {alertes.length > 9 ? "9+" : alertes.length}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-11 z-20 w-80 rounded-[var(--radius-md)] border border-border bg-surface shadow-lg">
          <div className="border-b border-border px-4 py-3">
            <p className="text-sm font-semibold">À surveiller maintenant</p>
            <p className="text-xs text-muted">État en direct — pas un historique.</p>
          </div>
          <div className="max-h-80 overflow-y-auto">
            {alertes.length === 0 ? (
              <p className="px-4 py-6 text-center text-sm text-muted">Rien à signaler.</p>
            ) : (
              alertes.map((a, i) => (
                <Link
                  key={i}
                  href={a.href}
                  onClick={() => setOpen(false)}
                  className="flex gap-2.5 border-b border-border px-4 py-2.5 last:border-b-0 hover:bg-surface-muted"
                >
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-warning" />
                  <div className="min-w-0">
                    <p className="text-xs font-semibold">{a.type}</p>
                    <p className="truncate text-xs text-muted">
                      {a.label} — {a.sub}
                    </p>
                  </div>
                </Link>
              ))
            )}
          </div>
          <div className="border-t border-border px-4 py-2">
            <Link href="/dashboard" onClick={() => setOpen(false)} className="text-xs font-medium text-primary hover:underline">
              Tout voir sur le Tableau de bord →
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
