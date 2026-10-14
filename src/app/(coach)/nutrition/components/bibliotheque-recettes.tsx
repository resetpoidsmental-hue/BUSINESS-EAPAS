"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { supprimerRecetteAction } from "../actions";
import { MEAL_KEYS, MEAL_LABELS, CATEGORIES_RATION, type MealKey } from "@/lib/categories-ration";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const LABEL_PAR_CLE = new Map(CATEGORIES_RATION.map((c) => [c.key, c.label]));

export interface RecetteItem {
  id: string;
  titre: string;
  repas: MealKey[];
  categories: string[];
  tags: string[];
  description: string;
  updatedAt: string;
}

export function BibliothequeRecettes({ recettes }: { recettes: RecetteItem[] }) {
  const [query, setQuery] = useState("");
  const [mealFilter, setMealFilter] = useState<MealKey | "all">("all");
  const [tagFilter, setTagFilter] = useState<string | null>(null);

  const allTags = useMemo(() => {
    const set = new Set<string>();
    recettes.forEach((r) => r.tags.forEach((t) => set.add(t)));
    return Array.from(set).sort();
  }, [recettes]);

  const filtered = recettes.filter((r) => {
    if (query.trim() && !r.titre.toLowerCase().includes(query.trim().toLowerCase())) return false;
    if (mealFilter !== "all" && !r.repas.includes(mealFilter)) return false;
    if (tagFilter && !r.tags.includes(tagFilter)) return false;
    return true;
  });

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-[var(--radius-sm)] bg-primary-soft px-4 py-2.5 text-sm font-medium text-primary">
        Construites par toi, insérables en un clic dans n&apos;importe quel menu type.
      </div>

      <Input placeholder="Rechercher une recette…" value={query} onChange={(e) => setQuery(e.target.value)} className="max-w-sm" />

      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-semibold text-muted">Repas</span>
        <button
          type="button"
          onClick={() => setMealFilter("all")}
          className={`rounded-full border px-3 py-1.5 text-xs font-semibold ${mealFilter === "all" ? "border-primary bg-primary text-primary-foreground" : "border-border bg-surface"}`}
        >
          Tous
        </button>
        {MEAL_KEYS.map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => setMealFilter(m)}
            className={`rounded-full border px-3 py-1.5 text-xs font-semibold ${mealFilter === m ? "border-primary bg-primary text-primary-foreground" : "border-border bg-surface"}`}
          >
            {MEAL_LABELS[m]}
          </button>
        ))}
      </div>

      {allTags.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold text-muted">Tags</span>
          {allTags.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTagFilter((f) => (f === t ? null : t))}
              className={`rounded-full border px-3 py-1.5 text-xs font-semibold ${tagFilter === t ? "border-primary bg-primary text-primary-foreground" : "border-border bg-surface"}`}
            >
              #{t}
            </button>
          ))}
        </div>
      )}

      {filtered.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted">
            {recettes.length === 0
              ? "Aucune recette pour le moment — crée ta première recette."
              : "Aucune recette ne correspond à ces filtres."}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {filtered.map((r) => (
            <Card key={r.id}>
              <CardContent className="flex flex-col gap-3 p-5">
                <Link href={`/nutrition/recettes/${r.id}`} className="font-medium hover:text-primary">
                  {r.titre}
                </Link>
                <div className="flex flex-wrap gap-1.5">
                  {r.repas.map((m) => (
                    <span key={m} className="rounded-full bg-primary-soft px-2.5 py-1 text-xs font-semibold text-primary">
                      {MEAL_LABELS[m]}
                    </span>
                  ))}
                  {r.categories.map((c) => (
                    <span key={c} className="rounded-full bg-surface-muted px-2.5 py-1 text-xs font-medium text-muted">
                      {LABEL_PAR_CLE.get(c) ?? c}
                    </span>
                  ))}
                </div>
                <p className="line-clamp-2 text-sm text-muted">{r.description}</p>
                {r.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {r.tags.map((t) => (
                      <span key={t} className="rounded-full border border-border px-2.5 py-0.5 text-xs font-semibold text-muted">
                        #{t}
                      </span>
                    ))}
                  </div>
                )}
                <form action={supprimerRecetteAction.bind(null, r.id)} className="border-t border-border pt-2">
                  <Button type="submit" size="sm" variant="ghost" className="text-danger hover:text-danger">
                    Supprimer
                  </Button>
                </form>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
