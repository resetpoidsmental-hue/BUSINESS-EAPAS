"use client";

import { useActionState, useState } from "react";
import {
  reprogrammerSeanceAction,
  confirmerReprogrammationExceptionnelleAction,
  type ReprogrammerState,
} from "@/app/(coach)/patients/actions";
import { Button } from "@/components/ui/button";
import { CalendarClock } from "lucide-react";

const initialState: ReprogrammerState = {};

/**
 * Bouton « Reprogrammer » réutilisé dans l'onglet Suivi, l'onglet Séances du patient et le
 * panneau de détail de l'Agenda. La date choisie est vérifiée contre les disponibilités réelles
 * (horaires de travail + créneaux déjà pris) avant d'être acceptée. Le clic sur « Valider » est
 * le seul déclencheur de la notification au patient (Portail + email) — c'est une conséquence
 * directe et déterministe de ce geste explicite, jamais un envoi décidé seul par l'IA.
 */
export function ReprogrammerSeance({ seanceId, patientId }: { seanceId: string; patientId: string }) {
  const action = reprogrammerSeanceAction.bind(null, seanceId, patientId);
  const [state, formAction, pending] = useActionState(action, initialState);

  const confirmAction = confirmerReprogrammationExceptionnelleAction.bind(null, seanceId, patientId);
  const [confirmState, confirmFormAction, confirmPending] = useActionState(confirmAction, initialState);

  const [step, setStep] = useState<"closed" | "form" | "confirm">("closed");
  const [nouvelleDate, setNouvelleDate] = useState("");

  const [lastState, setLastState] = useState(state);
  if (state !== lastState) {
    setLastState(state);
    if (state.needsConfirmation) setStep("confirm");
  }

  const succes = state.success ?? confirmState.success;
  if (succes) return <p className="text-sm text-success">{succes}</p>;

  if (step === "closed") {
    return (
      <Button type="button" size="sm" variant="outline" className="self-start" onClick={() => setStep("form")}>
        <CalendarClock className="h-3.5 w-3.5" />
        Reprogrammer
      </Button>
    );
  }

  if (step === "confirm" && state.dateProposee) {
    return (
      <div className="flex w-full flex-col gap-2 rounded-[var(--radius-sm)] border border-dashed border-warning p-3">
        <p className="text-sm">Ce créneau est en dehors de tes horaires habituels. Confirmer quand même ?</p>
        <form action={confirmFormAction} className="flex flex-wrap items-center gap-2">
          <input type="hidden" name="dateISO" value={state.dateProposee} />
          <Button type="submit" size="sm" disabled={confirmPending}>
            {confirmPending ? "Confirmation…" : "Confirmer ce créneau exceptionnel"}
          </Button>
          <Button type="button" size="sm" variant="ghost" onClick={() => setStep("closed")}>
            Annuler
          </Button>
        </form>
        {confirmState.error && <p className="text-sm text-danger">{confirmState.error}</p>}
      </div>
    );
  }

  return (
    <form
      action={formAction}
      className="flex w-full flex-wrap items-center gap-2 rounded-[var(--radius-sm)] border border-dashed border-primary p-3"
    >
      <label className="text-xs font-semibold text-muted">Nouvelle date et heure</label>
      <input
        type="datetime-local"
        name="date"
        required
        value={nouvelleDate}
        onChange={(e) => setNouvelleDate(e.target.value)}
        className="h-9 rounded-[var(--radius-sm)] border border-border bg-surface px-2 text-sm"
      />
      <Button type="submit" size="sm" disabled={pending || !nouvelleDate}>
        {pending ? "Vérification…" : "Valider"}
      </Button>
      <Button type="button" size="sm" variant="ghost" onClick={() => setStep("closed")}>
        Annuler
      </Button>
      {state.error && <p className="w-full text-sm text-danger">{state.error}</p>}
      <p className="w-full text-xs text-muted">
        Vérifié contre tes disponibilités dans l&rsquo;Agenda. Une fois validé, le patient est prévenu automatiquement
        dans son espace Portail et par email.
      </p>
    </form>
  );
}
