"use client";

import { useActionState, useState } from "react";
import {
  addObjectif,
  toggleObjectif,
  suggererObjectifSMARTAction,
  suggererPlanningAction,
  creerSeancesPlanifieesAction,
  type ActionState,
  type SuggestionObjectifState,
  type SuggestionPlanningState,
  type SeancePlanifieeProposee,
} from "../../actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";
import { Target, Sparkles, X } from "lucide-react";

const initialState: ActionState = {};
const initialSuggestionState: SuggestionObjectifState = {};
const initialPlanningState: SuggestionPlanningState = {};

interface Objectif {
  id: string;
  texteOriginal: string;
  texteSMART: string;
  dateCible: Date | null;
  atteint: boolean;
}

function ObjectifCard({ patientId, objectif }: { patientId: string; objectif: Objectif }) {
  const planAction = suggererPlanningAction.bind(null, patientId);
  const [planState, planFormAction, planPending] = useActionState(planAction, initialPlanningState);

  const createAction = creerSeancesPlanifieesAction.bind(null, patientId);
  const [createState, createFormAction, createPending] = useActionState(createAction, initialState);

  const [rows, setRows] = useState<SeancePlanifieeProposee[] | null>(null);
  const [rationale, setRationale] = useState("");

  // Dérive l'état local à partir du résultat de l'action pendant le rendu plutôt que dans un
  // effet. Rien n'est créé tant que le coach n'a pas cliqué sur « Créer ces séances ».
  const [lastPlanState, setLastPlanState] = useState(planState);
  if (planState !== lastPlanState) {
    setLastPlanState(planState);
    if (planState.seances) {
      setRows(planState.seances);
      setRationale(planState.rationale ?? "");
    }
  }

  const [lastCreateSuccess, setLastCreateSuccess] = useState(createState.success);
  if (createState.success !== lastCreateSuccess) {
    setLastCreateSuccess(createState.success);
    if (createState.success) setRows(null);
  }

  return (
    <Card>
      <CardContent className="flex flex-col gap-3 p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-2">
            <Target className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
            <div>
              <p className="text-sm italic text-muted">« {objectif.texteOriginal} »</p>
              <p className="text-sm font-medium">{objectif.texteSMART}</p>
            </div>
          </div>
          <Badge variant={objectif.atteint ? "success" : "muted"}>{objectif.atteint ? "Atteint" : "En cours"}</Badge>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-xs text-muted">{objectif.dateCible ? `Échéance : ${formatDate(objectif.dateCible)}` : ""}</p>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={planPending}
              onClick={() => {
                const fd = new FormData();
                fd.set("objectifTexteSMART", objectif.texteSMART);
                planFormAction(fd);
              }}
            >
              <Sparkles className="h-3.5 w-3.5" />
              {planPending ? "Génération…" : "Suggérer un planning avec l'IA"}
            </Button>
            <form action={toggleObjectif.bind(null, objectif.id, patientId, !objectif.atteint)}>
              <Button type="submit" size="sm" variant="ghost">
                {objectif.atteint ? "Marquer en cours" : "Marquer atteint"}
              </Button>
            </form>
          </div>
        </div>

        {planState.error && <p className="text-sm text-danger">{planState.error}</p>}

        {planState.bilanManquant && (
          <div className="flex flex-col gap-2 rounded-[var(--radius-sm)] bg-warning-soft p-4 text-sm text-warning">
            <p>
              Le bilan initial de ce patient n&rsquo;est pas encore fait — c&rsquo;est lui qui permet d&rsquo;adapter un planning en
              toute sécurité. Fais d&rsquo;abord son bilan clinique initial (onglet Bilans cliniques) avant de demander un
              planning de séances.
            </p>
          </div>
        )}

        {rows && rows.length > 0 && (
          <Card className="border-primary">
            <CardContent className="flex flex-col gap-3 p-4">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-primary">
                <Sparkles className="h-3.5 w-3.5" />
                Planning proposé par l&rsquo;IA — à valider
              </div>
              {rationale && <p className="text-xs text-muted">{rationale}</p>}

              <div className="flex flex-col gap-2">
                {rows.map((r, i) => (
                  <div key={i} className="flex flex-col gap-2 rounded-[var(--radius-sm)] border border-border p-2.5 sm:flex-row sm:items-center">
                    <input
                      type="datetime-local"
                      value={r.dateHeure}
                      onChange={(e) => {
                        const next = [...rows];
                        next[i] = { ...next[i], dateHeure: e.target.value };
                        setRows(next);
                      }}
                      className="h-9 rounded-[var(--radius-sm)] border border-border bg-surface px-2 text-sm sm:w-48"
                    />
                    <input
                      type="text"
                      value={r.type}
                      onChange={(e) => {
                        const next = [...rows];
                        next[i] = { ...next[i], type: e.target.value };
                        setRows(next);
                      }}
                      className="h-9 rounded-[var(--radius-sm)] border border-border bg-surface px-2 text-sm sm:w-44"
                    />
                    <span className="flex-1 text-xs text-muted">{r.note}</span>
                    <button
                      type="button"
                      aria-label="Retirer cette séance de la proposition"
                      onClick={() => setRows(rows.filter((_, idx) => idx !== i))}
                      className="self-end text-muted hover:text-danger sm:self-center"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>

              <p className="text-xs text-muted">
                « Créer » ajoute des séances planifiées (date, heure, type) dans l&rsquo;onglet Séances, sans contenu
                détaillé — tu prépareras chaque séance ensuite avec l&rsquo;Assistant IA existant, comme aujourd&rsquo;hui.
              </p>

              <form action={createFormAction} className="flex flex-wrap items-center gap-2">
                <input type="hidden" name="seancesJson" value={JSON.stringify(rows)} />
                <Button type="submit" size="sm" disabled={createPending}>
                  {createPending ? "Création…" : `Créer ces ${rows.length} séance${rows.length > 1 ? "s" : ""}`}
                </Button>
                <Button type="button" size="sm" variant="ghost" onClick={() => setRows(null)}>
                  Annuler
                </Button>
              </form>
              {createState.error && <p className="text-sm text-danger">{createState.error}</p>}
            </CardContent>
          </Card>
        )}

        {createState.success && !rows && <p className="text-sm text-success">{createState.success}</p>}
      </CardContent>
    </Card>
  );
}

export function ObjectifsSection({ patientId, objectifs }: { patientId: string; objectifs: Objectif[] }) {
  const action = addObjectif.bind(null, patientId);
  const [state, formAction, pending] = useActionState(action, initialState);

  const suggestAction = suggererObjectifSMARTAction.bind(null, patientId);
  const [suggestState, suggestFormAction, suggestPending] = useActionState(suggestAction, initialSuggestionState);

  const [texteOriginal, setTexteOriginal] = useState("");
  const [texteSMART, setTexteSMART] = useState("");
  const [dateCible, setDateCible] = useState("");
  const [suggestion, setSuggestion] = useState<{ texteSMART: string; dateCible: string } | null>(null);

  // Dérive l'état local à partir du résultat de l'action pendant le rendu plutôt que dans un
  // effet (évite un aller-retour de rendu supplémentaire) — rien n'est prérempli tant que le
  // coach n'a pas cliqué sur « Utiliser cette suggestion ».
  const [lastSuggestState, setLastSuggestState] = useState(suggestState);
  if (suggestState !== lastSuggestState) {
    setLastSuggestState(suggestState);
    if (suggestState.texteSMART) {
      setSuggestion({ texteSMART: suggestState.texteSMART, dateCible: suggestState.dateCible ?? "" });
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3">
        {objectifs.length === 0 && <p className="text-sm text-muted">Aucun objectif fixé pour le moment.</p>}
        {objectifs.map((o) => (
          <ObjectifCard key={o.id} patientId={patientId} objectif={o} />
        ))}
      </div>

      <Card>
        <CardContent className="p-5">
          <form action={formAction} className="flex flex-col gap-4">
            <p className="text-sm font-semibold">Ajouter un objectif</p>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="texteOriginal">Objectif dans les mots du patient</Label>
              <Textarea
                id="texteOriginal"
                name="texteOriginal"
                rows={2}
                value={texteOriginal}
                onChange={(e) => setTexteOriginal(e.target.value)}
                placeholder="« Pouvoir monter les escaliers sans être essoufflé »"
              />
            </div>

            <div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={suggestPending || !texteOriginal.trim()}
                onClick={() => {
                  const fd = new FormData();
                  fd.set("texteOriginal", texteOriginal);
                  suggestFormAction(fd);
                }}
              >
                <Sparkles className="h-3.5 w-3.5" />
                {suggestPending ? "Génération…" : "Suggérer une formulation SMART avec l'IA"}
              </Button>
              {suggestState.error && <p className="mt-1.5 text-sm text-danger">{suggestState.error}</p>}
            </div>

            {suggestion && (
              <Card className="border-primary">
                <CardContent className="flex flex-col gap-3 p-4">
                  <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-primary">
                    <Sparkles className="h-3.5 w-3.5" />
                    Proposition de l&rsquo;IA — à valider
                  </div>
                  <p className="text-sm">{suggestion.texteSMART}</p>
                  {suggestion.dateCible && (
                    <p className="text-xs text-muted">Échéance proposée : {formatDate(new Date(suggestion.dateCible))}</p>
                  )}
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => {
                        setTexteSMART(suggestion.texteSMART);
                        if (suggestion.dateCible) setDateCible(suggestion.dateCible);
                        setSuggestion(null);
                      }}
                    >
                      Utiliser cette suggestion
                    </Button>
                    <Button type="button" size="sm" variant="ghost" onClick={() => setSuggestion(null)}>
                      Ignorer
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="texteSMART">Traduction en objectif SMART</Label>
              <Textarea
                id="texteSMART"
                name="texteSMART"
                rows={2}
                value={texteSMART}
                onChange={(e) => setTexteSMART(e.target.value)}
                placeholder="Monter 1 étage sans essoufflement d'ici 2 mois"
              />
            </div>
            <div className="flex flex-col gap-1.5 sm:w-64">
              <Label htmlFor="dateCible">Échéance cible</Label>
              <Input
                id="dateCible"
                name="dateCible"
                type="date"
                value={dateCible}
                onChange={(e) => setDateCible(e.target.value)}
              />
            </div>
            {state.error && <p className="text-sm text-danger">{state.error}</p>}
            {state.success && <p className="text-sm text-success">{state.success}</p>}
            <div className="flex justify-end">
              <Button type="submit" disabled={pending}>
                {pending ? "Ajout…" : "Ajouter l'objectif"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
