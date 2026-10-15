"use client";

import { useActionState, useState } from "react";
import { creerPrestationAction, modifierPrestationAction, type ActionState } from "../actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";

const initialState: ActionState = {};

const TYPES_SUGGERES = [
  "Séance à l'unité",
  "Pack",
  "Abonnement",
  "Programme",
  "À la carte",
  "Offre de bienvenue",
  "Nutrition avec suivi",
  "Collectif",
  "Téléconsultation",
  "Bilan seul",
  "Entreprise",
  "Carte prépayée",
];

const UNITES_SUGGEREES = ["par séance", "par mois", "forfait", "par bilan"];

export interface PrestationInitial {
  nom: string;
  type: string;
  tarif: number;
  unite: string;
  dureeSemaines: number | null;
  inclusions: string | null;
}

export function PrestationForm({ mode, prestationId, initial }: { mode: "create" | "edit"; prestationId?: string; initial?: PrestationInitial }) {
  const action = mode === "edit" && prestationId ? modifierPrestationAction.bind(null, prestationId) : creerPrestationAction;
  const [state, formAction, pending] = useActionState(action, initialState);

  const [type, setType] = useState(initial?.type ?? "");
  const [unite, setUnite] = useState(initial?.unite ?? "par séance");

  return (
    <form action={formAction} className="flex flex-col gap-6">
      <Card>
        <CardContent className="flex flex-col gap-5 p-5">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="nom">Nom de la prestation</Label>
            <Input id="nom" name="nom" defaultValue={initial?.nom} required />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="type">Type</Label>
            <p className="text-xs text-muted">Choisis une suggestion, ou tape le tien — ce n&rsquo;est jamais une liste fermée.</p>
            <div className="flex flex-wrap gap-1.5">
              {TYPES_SUGGERES.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setType(t)}
                  className={`rounded-full border px-3 py-1 text-xs font-semibold transition-colors ${
                    type === t ? "border-primary bg-primary-soft text-primary-hover" : "border-border text-muted hover:text-foreground"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
            <Input id="type" name="type" value={type} onChange={(e) => setType(e.target.value)} placeholder="+ Créer un nouveau type…" required />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="tarif">Tarif (€)</Label>
              <Input id="tarif" name="tarif" type="number" step="0.01" min={0} defaultValue={initial?.tarif} required />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="unite">Unité</Label>
              <select
                id="unite"
                name="unite"
                value={UNITES_SUGGEREES.includes(unite) ? unite : "__autre__"}
                onChange={(e) => setUnite(e.target.value === "__autre__" ? "" : e.target.value)}
                className="h-10 rounded-[var(--radius-sm)] border border-border bg-surface px-3 text-sm"
              >
                {UNITES_SUGGEREES.map((u) => (
                  <option key={u} value={u}>
                    {u}
                  </option>
                ))}
                <option value="__autre__">Autre…</option>
              </select>
              {!UNITES_SUGGEREES.includes(unite) && (
                <Input
                  name="unite"
                  value={unite}
                  onChange={(e) => setUnite(e.target.value)}
                  placeholder="Unité personnalisée"
                  className="mt-1"
                />
              )}
              {UNITES_SUGGEREES.includes(unite) && <input type="hidden" name="unite" value={unite} />}
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="dureeSemaines">Durée (optionnel, en semaines)</Label>
            <Input
              id="dureeSemaines"
              name="dureeSemaines"
              type="number"
              min={0}
              defaultValue={initial?.dureeSemaines ?? undefined}
              placeholder="Laisser vide si récurrent sans fin définie"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="inclusions">Ce qui est inclus (une ligne par élément)</Label>
            <Textarea id="inclusions" name="inclusions" rows={4} defaultValue={initial?.inclusions ?? undefined} />
          </div>
        </CardContent>
      </Card>

      {state.error && <p className="text-sm text-danger">{state.error}</p>}
      {state.success && <p className="text-sm text-success">{state.success}</p>}

      <div className="flex justify-end">
        <Button type="submit" disabled={pending}>
          {pending ? "Enregistrement…" : mode === "edit" ? "Enregistrer les modifications" : "Créer cette prestation"}
        </Button>
      </div>
    </form>
  );
}
