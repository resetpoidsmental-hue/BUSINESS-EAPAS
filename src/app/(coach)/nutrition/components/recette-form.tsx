"use client";

import { useActionState, useState } from "react";
import { creerRecetteAction, modifierRecetteAction, type ActionState } from "../actions";
import { MEAL_KEYS, MEAL_LABELS, CATEGORIES_RATION, type MealKey } from "@/lib/categories-ration";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";

const initialState: ActionState = {};

export interface RecetteInitial {
  titre: string;
  repas: MealKey[];
  categories: string[];
  tags: string[];
  description: string;
}

export function RecetteForm({
  mode,
  recetteId,
  initial,
}: {
  mode: "create" | "edit";
  recetteId?: string;
  initial?: RecetteInitial;
}) {
  const action =
    mode === "edit" && recetteId ? modifierRecetteAction.bind(null, recetteId) : creerRecetteAction;
  const [state, formAction, pending] = useActionState(action, initialState);

  const [titre, setTitre] = useState(initial?.titre ?? "");
  const [repas, setRepas] = useState<MealKey[]>(initial?.repas ?? []);
  const [categories, setCategories] = useState<string[]>(initial?.categories ?? []);
  const [tags, setTags] = useState<string[]>(initial?.tags ?? []);
  const [tagDraft, setTagDraft] = useState("");
  const [description, setDescription] = useState(initial?.description ?? "");

  function toggleRepas(m: MealKey) {
    setRepas((r) => (r.includes(m) ? r.filter((x) => x !== m) : [...r, m]));
  }

  function toggleCategorie(key: string) {
    setCategories((c) => (c.includes(key) ? c.filter((x) => x !== key) : [...c, key]));
  }

  function addTagFromDraft() {
    const clean = tagDraft.trim().replace(/^#/, "");
    if (clean && !tags.includes(clean)) setTags((t) => [...t, clean]);
    setTagDraft("");
  }

  function removeTag(tag: string) {
    setTags((t) => t.filter((x) => x !== tag));
  }

  return (
    <form action={formAction} className="flex flex-col gap-6">
      <input type="hidden" name="repasJson" value={JSON.stringify(repas)} />
      <input type="hidden" name="categoriesJson" value={JSON.stringify(categories)} />
      <input type="hidden" name="tagsJson" value={JSON.stringify(tags)} />

      <Card>
        <CardContent className="flex flex-col gap-5 p-5">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="titre">Titre de la recette</Label>
            <Input id="titre" name="titre" value={titre} onChange={(e) => setTitre(e.target.value)} />
          </div>

          <div className="flex flex-col gap-2">
            <Label>Pour quel(s) repas ?</Label>
            <div className="flex flex-wrap gap-2">
              {MEAL_KEYS.map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => toggleRepas(m)}
                  className={`rounded-full border px-3.5 py-2 text-sm font-semibold ${
                    repas.includes(m) ? "border-primary bg-primary-soft text-primary" : "border-border bg-surface"
                  }`}
                >
                  {MEAL_LABELS[m]}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Label>Catégories d&apos;aliments utilisées</Label>
            <p className="text-xs text-muted">
              Sert à proposer cette recette automatiquement quand elle correspond à ce qui est alloué à un repas.
            </p>
            <div className="flex flex-wrap gap-2">
              {CATEGORIES_RATION.map((cat) => (
                <button
                  key={cat.key}
                  type="button"
                  onClick={() => toggleCategorie(cat.key)}
                  className={`rounded-full border px-3.5 py-2 text-sm font-semibold ${
                    categories.includes(cat.key)
                      ? "border-[#2563eb] bg-[#eef2fb] text-[#2563eb]"
                      : "border-border bg-surface"
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Label>Tags</Label>
            <div className="flex flex-wrap items-center gap-2">
              {tags.map((t) => (
                <span
                  key={t}
                  className="flex items-center gap-1.5 rounded-full bg-surface-muted px-3 py-1.5 text-xs font-semibold text-foreground"
                >
                  #{t}
                  <button type="button" onClick={() => removeTag(t)} className="text-muted hover:text-danger">
                    ×
                  </button>
                </span>
              ))}
              <input
                type="text"
                value={tagDraft}
                onChange={(e) => setTagDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === ",") {
                    e.preventDefault();
                    addTagFromDraft();
                  }
                }}
                onBlur={addTagFromDraft}
                placeholder="+ ajouter un tag"
                className="h-9 w-40 rounded-full border border-dashed border-border bg-surface px-3 text-xs"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="description">Description / préparation</Label>
            <Textarea
              id="description"
              name="description"
              rows={8}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ingrédients, quantités indicatives, préparation…"
            />
          </div>
        </CardContent>
      </Card>

      {state.error && <p className="text-sm text-danger">{state.error}</p>}
      {state.success && <p className="text-sm text-success">{state.success}</p>}

      <div className="flex justify-end">
        <Button type="submit" disabled={pending}>
          {pending ? "Enregistrement…" : mode === "edit" ? "Enregistrer les modifications" : "Créer la recette"}
        </Button>
      </div>
    </form>
  );
}
