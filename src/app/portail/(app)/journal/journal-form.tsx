"use client";

import { useActionState, useRef, useState } from "react";
import { ajouterJournalAction, type JournalActionState } from "../actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { CATEGORIES_RATION, MEAL_KEYS, MEAL_LABELS, type MealKey } from "@/lib/categories-ration";
import { ChevronDown, ChevronUp } from "lucide-react";

const initialState: JournalActionState = {};

type Picks = Record<MealKey, Record<string, number>>;

function picksVides(): Picks {
  return { pd: {}, dej: {}, col: {}, din: {} };
}

export function JournalForm() {
  const [state, formAction, pending] = useActionState(ajouterJournalAction, initialState);
  const formRef = useRef<HTMLFormElement>(null);

  const [picks, setPicks] = useState<Picks>(picksVides());
  const [openMeal, setOpenMeal] = useState<MealKey | null>("dej");

  function togglePick(meal: MealKey, catKey: string) {
    setPicks((p) => {
      const mealPicks = { ...p[meal] };
      if (catKey in mealPicks) {
        delete mealPicks[catKey];
      } else {
        mealPicks[catKey] = 1;
      }
      return { ...p, [meal]: mealPicks };
    });
  }

  function adjustPick(meal: MealKey, catKey: string, delta: number) {
    setPicks((p) => {
      const current = p[meal][catKey] ?? 1;
      const next = Math.min(3, Math.max(0.5, current + delta));
      return { ...p, [meal]: { ...p[meal], [catKey]: next } };
    });
  }

  return (
    <form
      ref={formRef}
      action={(formData) => {
        formAction(formData);
        formRef.current?.reset();
        setPicks(picksVides());
      }}
      className="flex flex-col gap-4"
    >
      <input type="hidden" name="repasStructureJson" value={JSON.stringify(picks)} />

      <div className="flex flex-col gap-1.5">
        <Label>Mon repas</Label>
        <p className="text-xs text-muted">Touche ce que tu as mangé à chaque repas — pas besoin de peser.</p>
        <div className="flex flex-col gap-2">
          {MEAL_KEYS.map((meal) => {
            const count = Object.keys(picks[meal]).length;
            const open = openMeal === meal;
            return (
              <div key={meal} className="rounded-[var(--radius-sm)] border border-border">
                <button
                  type="button"
                  onClick={() => setOpenMeal(open ? null : meal)}
                  className="flex w-full items-center justify-between px-4 py-3 text-left text-sm font-medium"
                >
                  {MEAL_LABELS[meal]}
                  <span className="flex items-center gap-2 text-xs font-normal">
                    <span className={count > 0 ? "text-success" : "text-muted"}>
                      {count > 0 ? `${count} aliment${count > 1 ? "s" : ""} renseigné${count > 1 ? "s" : ""}` : "Pas encore renseigné"}
                    </span>
                    {open ? <ChevronUp className="h-4 w-4 text-muted" /> : <ChevronDown className="h-4 w-4 text-muted" />}
                  </span>
                </button>
                {open && (
                  <div className="flex flex-wrap gap-2 px-4 pb-4">
                    {CATEGORIES_RATION.map((cat) => {
                      const selected = cat.key in picks[meal];
                      return (
                        <button
                          type="button"
                          key={cat.key}
                          onClick={() => togglePick(meal, cat.key)}
                          className={`flex items-center gap-2 rounded-full border px-3 py-2 text-xs font-semibold ${
                            selected ? "border-primary bg-primary-soft text-primary" : "border-border bg-surface text-foreground"
                          }`}
                        >
                          {cat.label}
                          {selected && (
                            <span className="flex items-center gap-1">
                              <span
                                role="button"
                                tabIndex={0}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  adjustPick(meal, cat.key, -0.5);
                                }}
                                className="flex h-5 w-5 items-center justify-center rounded-full border border-primary text-primary"
                              >
                                −
                              </span>
                              <span className="w-5 text-center tabular-nums">{picks[meal][cat.key]}</span>
                              <span
                                role="button"
                                tabIndex={0}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  adjustPick(meal, cat.key, 0.5);
                                }}
                                className="flex h-5 w-5 items-center justify-center rounded-full border border-primary text-primary"
                              >
                                +
                              </span>
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="activite">Activité physique</Label>
          <Input id="activite" name="activite" placeholder="Marche, vélo…" />
        </div>
        <div className="flex gap-2">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="dureeMinutes">Durée (min)</Label>
            <Input id="dureeMinutes" name="dureeMinutes" type="number" min={0} placeholder="30" />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="heure">Heure</Label>
            <Input id="heure" name="heure" type="time" />
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="motivation">Motivation du jour (0 à 10)</Label>
        <Input id="motivation" name="motivation" type="number" min={0} max={10} placeholder="7" />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="notes">Notes libres</Label>
        <Textarea id="notes" name="notes" rows={2} placeholder="Ce que tu veux ajouter…" />
      </div>

      {state.error && <p className="text-sm text-danger">{state.error}</p>}
      {state.success && <p className="text-sm text-success">{state.success}</p>}

      <Button type="submit" disabled={pending} className="mt-1 w-fit">
        {pending ? "Enregistrement…" : "Enregistrer mon journal du jour"}
      </Button>
    </form>
  );
}
