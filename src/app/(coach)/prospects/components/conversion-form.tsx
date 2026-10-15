"use client";

import { useActionState } from "react";
import { convertirProspectAction, type ActionState } from "../actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";

const initialState: ActionState = {};

export interface PrestationOption {
  id: string;
  nom: string;
  tarif: number;
  unite: string;
}

export function ConversionForm({
  prospectId,
  prenomDefault,
  nomDefault,
  emailDefault,
  telephoneDefault,
  prestations,
  prestationDefaultId,
}: {
  prospectId: string;
  prenomDefault: string;
  nomDefault: string;
  emailDefault: string;
  telephoneDefault: string;
  prestations: PrestationOption[];
  prestationDefaultId: string | null;
}) {
  const action = convertirProspectAction.bind(null, prospectId);
  const [state, formAction, pending] = useActionState(action, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-5">
      <Card>
        <CardContent className="flex flex-col gap-4 p-5">
          <p className="text-xs font-bold uppercase tracking-wide text-muted">1 · Identité</p>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="prenom">Prénom</Label>
              <Input id="prenom" name="prenom" defaultValue={prenomDefault} required />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="nom">Nom</Label>
              <Input id="nom" name="nom" defaultValue={nomDefault} required />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" type="email" defaultValue={emailDefault} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="telephone">Téléphone</Label>
              <Input id="telephone" name="telephone" type="tel" defaultValue={telephoneDefault} />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="flex flex-col gap-3 p-5">
          <p className="text-xs font-bold uppercase tracking-wide text-muted">2 · Prestation proposée</p>
          {prestations.length === 0 ? (
            <p className="text-sm text-muted">Aucune prestation active dans ton catalogue — aucun devis ne sera créé.</p>
          ) : (
            <div className="flex flex-col gap-1.5">
              <select
                name="prestationId"
                defaultValue={prestationDefaultId ?? ""}
                className="h-10 rounded-[var(--radius-sm)] border border-border bg-surface px-3 text-sm"
              >
                <option value="">Aucune — pas de devis créé</option>
                {prestations.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.nom} — {formatCurrency(p.tarif)} / {p.unite}
                  </option>
                ))}
              </select>
              <p className="text-xs text-muted">Un devis brouillon sera créé avec cette prestation — à relire avant de l&rsquo;envoyer.</p>
            </div>
          )}
        </CardContent>
      </Card>

      {state.error && <p className="text-sm text-danger">{state.error}</p>}

      <div className="flex justify-end">
        <Button type="submit" disabled={pending}>
          {pending ? "Création…" : "Créer la fiche patiente + un devis"}
        </Button>
      </div>
    </form>
  );
}
