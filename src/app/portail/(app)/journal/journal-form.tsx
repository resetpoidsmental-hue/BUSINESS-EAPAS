"use client";

import { useActionState, useRef } from "react";
import { ajouterJournalAction, type JournalActionState } from "../actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const initialState: JournalActionState = {};

export function JournalForm() {
  const [state, formAction, pending] = useActionState(ajouterJournalAction, initialState);
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <form
      ref={formRef}
      action={(formData) => {
        formAction(formData);
        formRef.current?.reset();
      }}
      className="flex flex-col gap-4"
    >
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="repas">Repas &amp; boissons</Label>
        <Textarea id="repas" name="repas" rows={2} placeholder="Ce que tu as mangé et bu aujourd'hui…" />
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
