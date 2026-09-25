"use client";

import { useActionState } from "react";
import { createTicket, type ActionState } from "./actions";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";

const initialState: ActionState = {};

interface PatientOption {
  id: string;
  nom: string;
  prenom: string;
}

export function TicketForm({ patients }: { patients: PatientOption[] }) {
  const [state, formAction, pending] = useActionState(createTicket, initialState);

  return (
    <Card>
      <CardContent className="p-5">
        <form action={formAction} className="flex flex-col gap-4">
          <p className="text-sm font-semibold">Nouveau ticket SAV</p>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="sujet">Sujet</Label>
              <Input id="sujet" name="sujet" required placeholder="Réclamation, question, incident…" />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="patientId">Patient / client concerné (optionnel)</Label>
              <select id="patientId" name="patientId" className="h-10 rounded-[var(--radius-sm)] border border-border bg-surface px-3 text-sm">
                <option value="">—</option>
                {patients.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.prenom} {p.nom}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="priorite">Priorité</Label>
              <select id="priorite" name="priorite" defaultValue="Normale" className="h-10 rounded-[var(--radius-sm)] border border-border bg-surface px-3 text-sm">
                <option value="Basse">Basse</option>
                <option value="Normale">Normale</option>
                <option value="Haute">Haute</option>
                <option value="Urgente">Urgente</option>
              </select>
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" name="description" rows={3} />
          </div>
          {state.error && <p className="text-sm text-danger">{state.error}</p>}
          {state.success && <p className="text-sm text-success">{state.success}</p>}
          <div className="flex justify-end">
            <Button type="submit" disabled={pending}>
              {pending ? "Création…" : "Créer le ticket"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
