"use client";

import { useActionState, useState, useEffect } from "react";
import { saveBilan, genererObservationsBilanAction, type ActionState, type GenererObservationsState } from "../../actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { TESTS_PASS, type TestPassKey } from "@/lib/calculs";
import { AlertTriangle, Sparkles } from "lucide-react";

const initialState: ActionState = {};
const initGenState: GenererObservationsState = {};

interface BilanExistant {
  id: string;
  phase: string;
  observations: string | null;
  [key: string]: unknown;
}

export function BilanForm({
  patientId,
  iaDisponible,
  bilans,
  phase,
  onPhaseChange,
}: {
  patientId: string;
  iaDisponible: boolean;
  bilans: BilanExistant[];
  phase: string;
  onPhaseChange: (phase: string) => void;
}) {
  const action = saveBilan.bind(null, patientId);
  const [state, formAction, pending] = useActionState(action, initialState);
  const [genState, genFormAction, genPending] = useActionState(genererObservationsBilanAction, initGenState);

  const [resultats, setResultats] = useState<Record<string, string>>({});
  const [observations, setObservations] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);

  // Le formulaire se synchronise sur le bilan déjà enregistré pour la phase choisie (ses valeurs
  // exactes, modifiables), pour ne jamais faire ressaisir des résultats déjà connus ni créer un
  // doublon silencieux. Phase sans bilan existant → formulaire vierge, mode création.
  useEffect(() => {
    const existant = bilans.find((b) => b.phase === phase);
    if (existant) {
      const r: Record<string, string> = {};
      for (const t of TESTS_PASS) {
        const v = existant[t.key as TestPassKey];
        r[t.key] = typeof v === "number" ? String(v) : "";
      }
      setResultats(r);
      setObservations(typeof existant.observations === "string" ? existant.observations : "");
      setEditingId(existant.id);
    } else {
      setResultats({});
      setObservations("");
      setEditingId(null);
    }
  }, [phase, bilans]);

  const [lastObservations, setLastObservations] = useState(genState.observations);
  if (genState.observations !== lastObservations) {
    setLastObservations(genState.observations);
    if (genState.observations) setObservations(genState.observations);
  }

  return (
    <form action={formAction} className="flex flex-col gap-5">
      <input type="hidden" name="patientId" value={patientId} />
      <input type="hidden" name="bilanId" value={editingId ?? ""} />

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="phase">Phase du bilan</Label>
        <select
          id="phase"
          name="phase"
          value={phase}
          onChange={(e) => onPhaseChange(e.target.value)}
          className="h-10 w-full max-w-xs rounded-[var(--radius-sm)] border border-border bg-surface px-3 text-sm sm:w-auto"
        >
          <option value="T0">T0 — Bilan initial</option>
          <option value="T1">T1 — Bilan intermédiaire</option>
          <option value="T2">T2 — Bilan final</option>
        </select>
        {editingId && (
          <p className="text-xs text-muted">
            Un bilan {phase} est déjà enregistré — ses valeurs sont reprises ci-dessous, modifie-les si besoin.
          </p>
        )}
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
          {pending ? "Enregistrement…" : editingId ? `Mettre à jour le bilan ${phase}` : `Enregistrer le bilan ${phase}`}
        </Button>
      </div>
    </form>
  );
}
