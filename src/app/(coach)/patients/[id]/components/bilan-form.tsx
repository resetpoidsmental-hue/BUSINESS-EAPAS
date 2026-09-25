"use client";

import { useActionState, useState } from "react";
import { addBilan, type ActionState } from "../../actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { TESTS_PASS } from "@/lib/calculs";
import { AlertTriangle } from "lucide-react";

const initialState: ActionState = {};

export function BilanForm({ patientId }: { patientId: string }) {
  const action = addBilan.bind(null, patientId);
  const [state, formAction, pending] = useActionState(action, initialState);
  const [phase, setPhase] = useState("T0");

  return (
    <form action={formAction} className="flex flex-col gap-5">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="phase">Phase du bilan</Label>
        <select
          id="phase"
          name="phase"
          value={phase}
          onChange={(e) => setPhase(e.target.value)}
          className="h-10 w-full max-w-xs rounded-[var(--radius-sm)] border border-border bg-surface px-3 text-sm sm:w-auto"
        >
          <option value="T0">T0 — Bilan initial</option>
          <option value="T1">T1 — Bilan intermédiaire</option>
          <option value="T2">T2 — Bilan final</option>
        </select>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {TESTS_PASS.map((t) => (
          <div key={t.key} className="flex flex-col gap-1.5">
            <Label htmlFor={t.key}>
              {t.label} <span className="text-muted">({t.unite})</span>
            </Label>
            <Input id={t.key} name={t.key} type="number" step="0.1" />
            {"alerteMessage" in t && t.alerteMessage && (
              <p className="flex items-center gap-1 text-xs text-warning">
                <AlertTriangle className="h-3 w-3" /> {t.alerteMessage}
              </p>
            )}
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="observations">Observations / adaptations</Label>
        <Textarea id="observations" name="observations" rows={3} />
      </div>

      {state.error && <p className="text-sm text-danger">{state.error}</p>}
      {state.success && <p className="text-sm text-success">{state.success}</p>}

      <div className="flex justify-end">
        <Button type="submit" disabled={pending}>
          {pending ? "Enregistrement…" : `Enregistrer le bilan ${phase}`}
        </Button>
      </div>
    </form>
  );
}
