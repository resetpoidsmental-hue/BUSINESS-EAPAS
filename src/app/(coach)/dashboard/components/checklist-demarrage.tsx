"use client";

import { useState } from "react";
import Link from "next/link";
import { CheckCircle2, Circle, Rocket } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { VisiteGuideeModal } from "@/components/visite-guidee-modal";

interface ChecklistItem {
  label: string;
  done: boolean;
  href?: string;
  cta: string;
  key?: string;
}

/**
 * Visible tant que l'app est "neuve" (étapes pas toutes faites) — disparaît d'elle-même une fois
 * les étapes accomplies, pas besoin de la masquer à la main.
 */
export function ChecklistDemarrage({ items }: { items: ChecklistItem[] }) {
  const [tourOuverte, setTourOuverte] = useState(false);

  if (items.every((i) => i.done)) return null;

  return (
    <>
      <Card className="mb-6 border-primary/30 bg-primary/5">
        <CardContent className="p-5">
          <div className="mb-3 flex items-center gap-2">
            <Rocket className="h-4 w-4 text-primary" />
            <h2 className="text-sm font-semibold">Pour bien démarrer</h2>
          </div>
          <div className="flex flex-col gap-1">
            {items.map((item) => (
              <div key={item.label} className="flex flex-wrap items-center justify-between gap-2 rounded-[var(--radius-sm)] px-2 py-2">
                <div className="flex items-center gap-2.5">
                  {item.done ? (
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-success" />
                  ) : (
                    <Circle className="h-4 w-4 shrink-0 text-muted" />
                  )}
                  <span className={`text-sm ${item.done ? "text-muted line-through" : "font-medium"}`}>{item.label}</span>
                </div>
                {!item.done &&
                  (item.key === "visite-guidee" ? (
                    <button
                      type="button"
                      onClick={() => setTourOuverte(true)}
                      className="text-xs font-medium text-primary hover:underline"
                    >
                      {item.cta} →
                    </button>
                  ) : (
                    <Link href={item.href ?? "#"} className="text-xs font-medium text-primary hover:underline">
                      {item.cta} →
                    </Link>
                  ))}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
      <VisiteGuideeModal open={tourOuverte} onClose={() => setTourOuverte(false)} />
    </>
  );
}
