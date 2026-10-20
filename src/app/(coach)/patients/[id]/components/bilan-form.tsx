"use client";

import { useActionState, useState } from "react";
import { addBilan, genererObservationsBilanAction, type ActionState, type GenererObservationsState } from "../../actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { TESTS_PASS } from "@/lib/calculs";
import { AlertTriangle, Sparkles } from "lucide-react";

const initialState: ActionState = {};
const initGenState: GenererObservationsState = {};

export function BilanForm({ patientId, iaDisponible }: { patientId: string; iaDisponible: boolean }) {
  const action = addBilan.bind(null, patientId);
  const [state, formAction, pending] = useActionState(action, initialState);
  const [genState, genFormAction, genPending] = useActionState(genererObservationsBilanAction, initGenState);

  const [phase, setPhase] = useState("T0");
  const [resultats, setResultats] = useState<Record<string, string>>({});
  const [observations, setObservations] = useState("");

  const [lastObservations, setLastObservations] = useState(genState.observations);
  if (genState.observations !== lastObservations) {
    setLastObservations(genState.observations);
    if (genState.observations) setObservations(genState.observations);
  }

  return (
    <form action={formAction} className="flex flex-col gap-5">
      <input type="hidden" name="patientId" value={patientId} />

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
            <Input
              id={t.key}
              name={t.key}
              type="number"
              step="0.1"
              value={resultats[t.key] ?? ""}
              onChange={(e) => setResultats((r) => ({ ...r, [t.key]: e.target.value }))}
            />
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
        {iaDisponible && (
          <div>
            <Button type="submit" formAction={genFormAction} size="sm" variant="outline" disabled={genPending}>
              <Sparkles className="h-3.5 w-3.5" />
              {genPending ? "Génération…" : "Proposer les observations avec l'IA"}
            </Button>
            {genState.error && <p className="mt-1.5 text-sm text-danger">{genState.error}</p>}
          </div>
        )}
        <Textarea
          id="observations"
          name="observations"
          rows={4}
          value={observations}
          onChange={(e) => setObservations(e.target.value)}
        />
        {iaDisponible && (
          <p className="text-xs text-muted">
            S&rsquo;appuie uniquement sur les résultats saisis ci-dessus et le bilan T0 pour la comparaison — aucun
            chiffre inventé. Modifiable librement avant d&rsquo;enregistrer.
          </p>
        )}
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
