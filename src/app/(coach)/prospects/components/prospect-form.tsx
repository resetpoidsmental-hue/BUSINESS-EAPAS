"use client";

import { useActionState, useState } from "react";
import { creerProspectAction, type ActionState } from "../actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";

const initialState: ActionState = {};

const SOURCES_SUGGEREES = [
  "Site vitrine",
  "Réseaux sociaux",
  "Parrainage",
  "Partenariat médical",
  "Publicité payante",
  "Newsletter / Email",
  "Événement / atelier",
  "En réel",
  "Autre",
];

export function ProspectForm({ prestations }: { prestations: { id: string; nom: string }[] }) {
  const [state, formAction, pending] = useActionState(creerProspectAction, initialState);
  const [source, setSource] = useState("");

  return (
    <form action={formAction} className="flex flex-col gap-6">
      <Card>
        <CardContent className="flex flex-col gap-5 p-5">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="nom">Nom</Label>
              <Input id="nom" name="nom" required />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" type="email" />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="telephone">Téléphone</Label>
              <Input id="telephone" name="telephone" type="tel" />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="prestationId">Prestation qui l&rsquo;intéresse</Label>
              <select id="prestationId" name="prestationId" defaultValue="" className="h-10 rounded-[var(--radius-sm)] border border-border bg-surface px-3 text-sm">
                <option value="">Je ne sais pas encore</option>
                {prestations.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.nom}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="source">Source</Label>
            <div className="flex flex-wrap gap-1.5">
              {SOURCES_SUGGEREES.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setSource(s)}
                  className={`rounded-full border px-3 py-1 text-xs font-semibold transition-colors ${
                    source === s ? "border-primary bg-primary-soft text-primary-hover" : "border-border text-muted hover:text-foreground"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
            <Input id="source" name="source" value={source} onChange={(e) => setSource(e.target.value)} placeholder="+ Créer ta propre source…" required />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="message">Message / contexte</Label>
            <Textarea id="message" name="message" rows={3} />
          </div>
        </CardContent>
      </Card>

      {state.error && <p className="text-sm text-danger">{state.error}</p>}

      <div className="flex justify-end">
        <Button type="submit" disabled={pending}>
          {pending ? "Enregistrement…" : "Ajouter ce prospect"}
        </Button>
      </div>
    </form>
  );
}
