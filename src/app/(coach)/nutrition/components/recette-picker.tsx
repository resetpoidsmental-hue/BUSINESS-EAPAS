"use client";

import { useState } from "react";
import type { MealKey } from "@/lib/categories-ration";
import { Button } from "@/components/ui/button";
import type { RecetteItem } from "./bibliotheque-recettes";

function overlap(a: string[], b: string[]) {
  return a.filter((x) => b.includes(x)).length;
}

export function RecettePicker({
  meal,
  allocatedCategories,
  recettes,
  onInsert,
}: {
  meal: MealKey;
  allocatedCategories: string[];
  recettes: RecetteItem[];
  onInsert: (text: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  const forMeal = recettes.filter((r) => r.repas.includes(meal));
  if (forMeal.length === 0) return null;

  const filtered = forMeal.filter(
    (r) => !query.trim() || r.titre.toLowerCase().includes(query.trim().toLowerCase())
  );
  const sorted = [...filtered].sort(
    (a, b) => overlap(b.categories, allocatedCategories) - overlap(a.categories, allocatedCategories)
  );

  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-fit rounded-[var(--radius-sm)] border border-border bg-surface px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-surface-muted"
      >
        {open ? "Fermer la bibliothèque" : "Choisir depuis la bibliothèque"}
      </button>
      {open && (
        <div className="flex flex-col gap-2 rounded-[var(--radius-sm)] border border-border p-3">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Rechercher…"
            className="h-8 rounded-[var(--radius-sm)] border border-border bg-surface px-2 text-xs"
          />
          {sorted.length === 0 && <p className="text-xs text-muted">Aucune recette ne correspond.</p>}
          {sorted.map((r) => {
            const match = overlap(r.categories, allocatedCategories) >= 2;
            return (
              <div
                key={r.id}
                className={`flex items-center justify-between gap-2 rounded-[var(--radius-sm)] border p-2 text-xs ${
                  match ? "border-primary bg-primary-soft" : "border-border"
                }`}
              >
                <div className="flex flex-col gap-0.5">
                  <span className="font-semibold">{r.titre}</span>
                  {match && <span className="font-semibold text-primary">✓ correspond aux catégories allouées</span>}
                </div>
                <Button type="button" size="sm" variant="outline" onClick={() => onInsert(r.description)}>
                  Insérer
                </Button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
