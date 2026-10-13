"use client";

import { useActionState, useState } from "react";
import {
  suggererMessageAttentionAction,
  envoyerMessageAction,
  analyserSuiviAction,
  type SuggestionMessageState,
  type ActionState,
  type AnalyseSuiviState,
} from "../../actions";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { formatDate, formatDateTime } from "@/lib/utils";
import { formatRepasStructureResume } from "@/lib/categories-ration";
import { AlertTriangle, Sparkles, NotebookPen, Target, Send } from "lucide-react";

const initialMessageState: SuggestionMessageState = {};
const initialSendState: ActionState = {};
const initialAnalyseState: AnalyseSuiviState = {};

interface SeanceManquee {
  id: string;
  date: Date;
  type: string | null;
}

interface RessentiRecent {
  date: Date;
  borgRessenti: number;
}

interface JournalEntreeVue {
  id: string;
  date: Date;
  repas: string | null;
  repasStructure: string | null;
  activite: string | null;
  dureeMinutes: number | null;
  heure: string | null;
  motivation: number | null;
  notes: string | null;
}

function joursRemplis7j(entrees: JournalEntreeVue[]): number {
  const seuil = new Date(Date.now() - 7 * 24 * 3600 * 1000);
  const jours = new Set(entrees.filter((e) => e.date >= seuil).map((e) => e.date.toDateString()));
  return jours.size;
}

function tendanceRessenti(ressentis: RessentiRecent[]): string {
  if (ressentis.length === 0) return "Aucune donnée";
  const moyenne = ressentis.reduce((sum, r) => sum + r.borgRessenti, 0) / ressentis.length;
  return `${moyenne.toFixed(1)} / 10`;
}

function MessageAttention({ patientId, seance }: { patientId: string; seance: SeanceManquee }) {
  const suggestAction = suggererMessageAttentionAction.bind(null, patientId, seance.id);
  const [suggestState, suggestFormAction, suggestPending] = useActionState(suggestAction, initialMessageState);

  const sendAction = envoyerMessageAction.bind(null, patientId);
  const [sendState, sendFormAction, sendPending] = useActionState(sendAction, initialSendState);

  const [brouillon, setBrouillon] = useState<string | null>(null);

  const [lastSuggestState, setLastSuggestState] = useState(suggestState);
  if (suggestState !== lastSuggestState) {
    setLastSuggestState(suggestState);
    if (suggestState.message) setBrouillon(suggestState.message);
  }

  const [lastSendSuccess, setLastSendSuccess] = useState(sendState.success);
  if (sendState.success !== lastSendSuccess) {
    setLastSendSuccess(sendState.success);
    if (sendState.success) setBrouillon(null);
  }

  return (
    <div className="flex flex-col gap-2 rounded-[var(--radius-sm)] border border-border p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm">
          {seance.type ?? "Séance"} du {formatDate(seance.date)} — jamais confirmée (ni faite, ni annulée)
        </p>
        {!sendState.success && (
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={suggestPending}
            onClick={() => suggestFormAction(new FormData())}
          >
            <Sparkles className="h-3.5 w-3.5" />
            {suggestPending ? "Génération…" : "Suggérer un message avec l'IA"}
          </Button>
        )}
      </div>

      {suggestState.error && <p className="text-sm text-danger">{suggestState.error}</p>}

      {brouillon !== null && (
        <form action={sendFormAction} className="flex flex-col gap-2">
          <Textarea
            name="contenu"
            rows={3}
            value={brouillon}
            onChange={(e) => setBrouillon(e.target.value)}
            className="text-sm"
          />
          <p className="text-xs text-muted">
            Brouillon de l&rsquo;IA — relis-le et modifie-le si besoin. Rien n&rsquo;est envoyé tant que tu n&rsquo;as pas cliqué.
          </p>
          <div className="flex items-center gap-2">
            <Button type="submit" size="sm" disabled={sendPending || !brouillon.trim()}>
              <Send className="h-3.5 w-3.5" />
              {sendPending ? "Envoi…" : "Envoyer dans son espace"}
            </Button>
            <Button type="button" size="sm" variant="ghost" onClick={() => setBrouillon(null)}>
              Annuler
            </Button>
          </div>
          {sendState.error && <p className="text-sm text-danger">{sendState.error}</p>}
        </form>
      )}

      {sendState.success && <p className="text-sm text-success">{sendState.success}</p>}
    </div>
  );
}

export function SuiviSection({
  patientId,
  seancesManquees,
  ressentisRecents,
  journalEntrees,
  prochaineEcheance,
}: {
  patientId: string;
  seancesManquees: SeanceManquee[];
  ressentisRecents: RessentiRecent[];
  journalEntrees: JournalEntreeVue[];
  prochaineEcheance: Date | null;
}) {
  const analyseAction = analyserSuiviAction.bind(null, patientId);
  const [analyseState, analyseFormAction, analysePending] = useActionState(analyseAction, initialAnalyseState);

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Card>
          <CardContent className="flex flex-col gap-1 p-4">
            <span className="text-xs text-muted">Séances manquées</span>
            <span className="text-lg font-semibold">{seancesManquees.length}</span>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex flex-col gap-1 p-4">
            <span className="text-xs text-muted">Ressenti (4 dernières)</span>
            <span className="text-lg font-semibold">{tendanceRessenti(ressentisRecents)}</span>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex flex-col gap-1 p-4">
            <span className="text-xs text-muted">Journal rempli (7j)</span>
            <span className="text-lg font-semibold">{joursRemplis7j(journalEntrees)} / 7</span>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex flex-col gap-1 p-4">
            <span className="text-xs text-muted">Prochaine échéance</span>
            <span className="text-lg font-semibold">{prochaineEcheance ? formatDate(prochaineEcheance) : "—"}</span>
          </CardContent>
        </Card>
      </div>

      {seancesManquees.length > 0 && (
        <Card>
          <CardContent className="flex flex-col gap-3 p-5">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-warning" />
              <h2 className="text-sm font-semibold">Séances non confirmées</h2>
            </div>
            <div className="flex flex-col gap-2">
              {seancesManquees.map((s) => (
                <MessageAttention key={s.id} patientId={patientId} seance={s} />
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="flex flex-col gap-3 p-5">
          <div className="flex items-center gap-2">
            <NotebookPen className="h-4 w-4 text-primary" />
            <h2 className="text-sm font-semibold">Journal récent du patient</h2>
          </div>
          {journalEntrees.length === 0 ? (
            <p className="text-sm text-muted">Le patient n&rsquo;a pas encore rempli son journal.</p>
          ) : (
            <div className="flex flex-col divide-y divide-border">
              {journalEntrees.slice(0, 7).map((j) => (
                <div key={j.id} className="flex flex-col gap-1 py-2 text-sm">
                  <span className="text-xs font-semibold text-muted">{formatDateTime(j.date)}</span>
                  {formatRepasStructureResume(j.repasStructure) && <p>{formatRepasStructureResume(j.repasStructure)}</p>}
                  {j.repas && <p>Repas/boissons : {j.repas}</p>}
                  {j.activite && (
                    <p>
                      Activité : {j.activite}
                      {j.dureeMinutes ? ` · ${j.dureeMinutes} min` : ""}
                      {j.heure ? ` · ${j.heure}` : ""}
                    </p>
                  )}
                  {j.motivation !== null && <p>Motivation : {j.motivation}/10</p>}
                  {j.notes && <p className="text-muted">{j.notes}</p>}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="flex flex-col gap-3 p-5">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4 text-primary" />
              <h2 className="text-sm font-semibold">Lecture du suivi par l&rsquo;IA</h2>
            </div>
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={analysePending}
              onClick={() => analyseFormAction(new FormData())}
            >
              <Sparkles className="h-3.5 w-3.5" />
              {analysePending ? "Analyse…" : "Analyser le suivi avec l'IA"}
            </Button>
          </div>
          {analyseState.error && <p className="text-sm text-danger">{analyseState.error}</p>}
          {analyseState.analyse && (
            <Card className="border-primary">
              <CardContent className="p-4">
                <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-primary">
                  <Sparkles className="h-3.5 w-3.5" />
                  Signal pour toi — ne remplace pas ton jugement
                </div>
                <p className="whitespace-pre-line text-sm">{analyseState.analyse}</p>
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
