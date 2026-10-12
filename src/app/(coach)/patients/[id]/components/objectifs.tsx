"use client";

import { useActionState, useState } from "react";
import {
  addObjectif,
  toggleObjectif,
  suggererObjectifSMARTAction,
  type ActionState,
  type SuggestionObjectifState,
} from "../../actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";
import { Target, Sparkles } from "lucide-react";

const initialState: ActionState = {};
const initialSuggestionState: SuggestionObjectifState = {};

interface Objectif {
  id: string;
  texteOriginal: string;
  texteSMART: string;
  dateCible: Date | null;
  atteint: boolean;
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
          <Card key={o.id}>
            <CardContent className="flex flex-col gap-2 p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-2">
                  <Target className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  <div>
                    <p className="text-sm italic text-muted">« {o.texteOriginal} »</p>
                    <p className="text-sm font-medium">{o.texteSMART}</p>
                  </div>
                </div>
                <Badge variant={o.atteint ? "success" : "muted"}>{o.atteint ? "Atteint" : "En cours"}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <p className="text-xs text-muted">{o.dateCible ? `Échéance : ${formatDate(o.dateCible)}` : ""}</p>
                <form action={toggleObjectif.bind(null, o.id, patientId, !o.atteint)}>
                  <Button type="submit" size="sm" variant="ghost">
                    {o.atteint ? "Marquer en cours" : "Marquer atteint"}
                  </Button>
                </form>
              </div>
            </CardContent>
          </Card>
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
