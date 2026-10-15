"use client";

import { useActionState, useRef, useState } from "react";
import {
  creerPrestationAction,
  modifierPrestationAction,
  genererDescriptionMarketingAction,
  type ActionState,
  type DescriptionMarketingState,
} from "../actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Sparkles } from "lucide-react";

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
  descriptionMarketing: string | null;
}

const initialDescriptionState: DescriptionMarketingState = {};

export function PrestationForm({ mode, prestationId, initial }: { mode: "create" | "edit"; prestationId?: string; initial?: PrestationInitial }) {
  const action = mode === "edit" && prestationId ? modifierPrestationAction.bind(null, prestationId) : creerPrestationAction;
  const [state, formAction, pending] = useActionState(action, initialState);
  const [descriptionState, descriptionFormAction, descriptionPending] = useActionState(
    genererDescriptionMarketingAction,
    initialDescriptionState
  );

  const [type, setType] = useState(initial?.type ?? "");
  const [unite, setUnite] = useState(initial?.unite ?? "par séance");

  const nomRef = useRef<HTMLInputElement>(null);
  const tarifRef = useRef<HTMLInputElement>(null);
  const inclusionsRef = useRef<HTMLTextAreaElement>(null);
  const descriptionRef = useRef<HTMLTextAreaElement>(null);

  function demanderDescription() {
    const fd = new FormData();
    fd.set("nom", nomRef.current?.value ?? "");
    fd.set("type", type);
    fd.set("tarif", tarifRef.current?.value ?? "");
    fd.set("unite", unite);
    fd.set("inclusions", inclusionsRef.current?.value ?? "");
    descriptionFormAction(fd);
  }

  function utiliserDescription() {
    if (descriptionRef.current && descriptionState.description) {
      descriptionRef.current.value = descriptionState.description;
    }
  }

  return (
    <form action={formAction} className="flex flex-col gap-6">
      <Card>
        <CardContent className="flex flex-col gap-5 p-5">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="nom">Nom de la prestation</Label>
            <Input id="nom" name="nom" ref={nomRef} defaultValue={initial?.nom} required />
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
              <Input id="tarif" name="tarif" ref={tarifRef} type="number" step="0.01" min={0} defaultValue={initial?.tarif} required />
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
            <Textarea id="inclusions" name="inclusions" ref={inclusionsRef} rows={4} defaultValue={initial?.inclusions ?? undefined} />
          </div>

          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="descriptionMarketing">Description marketing (affichée dans les devis et contrats)</Label>
              <Button type="button" size="sm" variant="secondary" onClick={demanderDescription} disabled={descriptionPending}>
                <Sparkles className="h-3.5 w-3.5" />
                {descriptionPending ? "Génération…" : "Rédiger avec l'IA"}
              </Button>
            </div>
            <p className="text-xs text-muted">
              Ce que le client lira pour comprendre ce qu&rsquo;il va recevoir — rédigée une fois, réutilisée partout où cette
              prestation est choisie.
            </p>
            <Textarea
              id="descriptionMarketing"
              name="descriptionMarketing"
              ref={descriptionRef}
              rows={3}
              defaultValue={initial?.descriptionMarketing ?? undefined}
              placeholder="Un accompagnement mensuel sur-mesure…"
            />
            {descriptionState.error && <p className="text-sm text-danger">{descriptionState.error}</p>}
            {descriptionState.description && (
              <div className="flex flex-col gap-2 rounded-[var(--radius-sm)] border border-dashed border-primary bg-primary-soft/40 p-3">
                <div className="flex items-center gap-1.5">
                  <Sparkles className="h-3 w-3 text-primary" />
                  <span className="text-[11px] font-bold uppercase tracking-wide text-primary">Proposition IA</span>
                </div>
                <p className="text-xs leading-snug text-foreground">{descriptionState.description}</p>
                <p className="text-[11px] italic text-muted">Rédigée à partir du type, du tarif et des inclusions réels — jamais inventée.</p>
                <div>
                  <Button type="button" size="sm" onClick={utiliserDescription}>
                    Utiliser cette proposition
                  </Button>
                </div>
              </div>
            )}
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
