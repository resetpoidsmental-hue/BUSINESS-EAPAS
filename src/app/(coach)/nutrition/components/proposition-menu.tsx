"use client";

import { useActionState, useState } from "react";
import { suggererMenuIAAction, envoyerMenuAction, type SuggestionMenuState, type ActionState } from "../actions";
import { MEAL_KEYS, MEAL_LABELS, calculerKcalRepas, type Repartition, type MenuType, type EcartCategorie } from "@/lib/categories-ration";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Sparkles, Send } from "lucide-react";

const initialSuggestState: SuggestionMenuState = {};
const initialSendState: ActionState = {};

export function PropositionMenu({
  modeleId,
  repartition,
  ecarts,
}: {
  modeleId: string;
  repartition: Repartition;
  ecarts: EcartCategorie[];
}) {
  const suggestAction = suggererMenuIAAction.bind(null, modeleId);
  const [suggestState, suggestFormAction, suggestPending] = useActionState(suggestAction, initialSuggestState);

  const sendAction = envoyerMenuAction.bind(null, modeleId);
  const [sendState, sendFormAction, sendPending] = useActionState(sendAction, initialSendState);

  const [draft, setDraft] = useState<MenuType | null>(null);

  const [lastSuggestState, setLastSuggestState] = useState(suggestState);
  if (suggestState !== lastSuggestState) {
    setLastSuggestState(suggestState);
    if (suggestState.menu) setDraft(suggestState.menu);
  }

  const [lastSendSuccess, setLastSendSuccess] = useState(sendState.success);
  if (sendState.success !== lastSendSuccess) {
    setLastSendSuccess(sendState.success);
    if (sendState.success) setDraft(null);
  }

  return (
    <Card>
      <CardContent className="flex flex-col gap-4 p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm font-semibold">Proposer un menu avec l&apos;IA</p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={suggestPending}
            onClick={() => suggestFormAction(new FormData())}
          >
            <Sparkles className="h-3.5 w-3.5" /> {suggestPending ? "Génération…" : "Proposer un menu avec l'IA"}
          </Button>
        </div>
        <p className="text-xs text-muted">
          Composition proposée à partir des catégories déjà allouées par repas — jamais de nouveau calcul de
          chiffres, à relire avant envoi.
        </p>

        {ecarts.length > 0 && (
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {ecarts.slice(0, 4).map((e) => (
              <div key={e.key} className="rounded-[var(--radius-sm)] border border-border p-2.5">
                <p className="text-xs font-medium">{e.label}</p>
                <div className="my-1 h-1.5 overflow-hidden rounded-full bg-surface-muted">
                  <div
                    className={`h-full rounded-full ${e.pct < 60 ? "bg-warning" : "bg-success"}`}
                    style={{ width: `${e.pct}%` }}
                  />
                </div>
                <p className="text-xs text-muted">
                  {e.loggedDays} / {e.targetDays} jours
                </p>
              </div>
            ))}
          </div>
        )}

        {suggestState.error && <p className="text-sm text-danger">{suggestState.error}</p>}

        {draft && (
          <>
            <div className="rounded-[var(--radius-sm)] bg-primary-soft px-3 py-2 text-xs font-semibold text-primary">
              Proposition de l&apos;IA — à relire, modifier si besoin, puis valider toi-même l&apos;envoi
            </div>
            <form action={sendFormAction} className="flex flex-col gap-4">
              <input type="hidden" name="menuTypeJson" value={JSON.stringify(draft)} />
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {MEAL_KEYS.map((m) => (
                  <div key={m} className="flex flex-col gap-2 rounded-[var(--radius-sm)] border border-border p-4">
                    <div className="flex items-baseline justify-between">
                      <p className="text-sm font-medium">{MEAL_LABELS[m]}</p>
                      <span className="text-xs text-muted">≈ {calculerKcalRepas(repartition, m)} kcal</span>
                    </div>
                    <Textarea
                      rows={4}
                      value={draft[m]}
                      onChange={(e) => setDraft((d) => (d ? { ...d, [m]: e.target.value } : d))}
                    />
                  </div>
                ))}
              </div>
              {sendState.error && <p className="text-sm text-danger">{sendState.error}</p>}
              <div className="flex justify-end gap-2">
                <Button type="button" variant="ghost" onClick={() => setDraft(null)}>
                  Ignorer la suggestion
                </Button>
                <Button type="submit" disabled={sendPending}>
                  <Send className="h-3.5 w-3.5" /> {sendPending ? "Envoi…" : "Envoyer ce menu au patient"}
                </Button>
              </div>
            </form>
          </>
        )}

        {sendState.success && !draft && <p className="text-sm text-success">{sendState.success}</p>}
      </CardContent>
    </Card>
  );
}
