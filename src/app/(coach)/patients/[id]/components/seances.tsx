"use client";

import { useActionState, useState } from "react";
import { addSeance, updateSeanceStatut, deleteSeance, type ActionState } from "../../actions";
import { genererFicheSeanceAction, validerFicheSeanceAction, type GenererState, type ValiderState } from "../../../assistant/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FicheSeanceCard } from "@/components/fiche-seance-card";
import { parseFicheSeance, ficheSeanceToText, type FicheSeance } from "@/lib/fiche-seance";
import { formatDateTime } from "@/lib/utils";
import { CalendarDays, Sparkles, Target, Trash2 } from "lucide-react";

const initialState: ActionState = {};
const initGenState: GenererState = {};
const initValState: ValiderState = {};

interface SeanceItem {
  id: string;
  date: Date;
  type: string | null;
  format: string | null;
  statut: string;
  contenu: string | null;
  genereParIA: boolean;
  materielNecessaire: string | null;
  borgRessenti: number | null;
  notes: string | null;
  objectifSMART: { id: string; texteSMART: string } | null;
}

const STATUT_VARIANT: Record<string, "success" | "warning" | "danger" | "default"> = {
  Planifiée: "default",
  Faite: "success",
  Annulée: "danger",
};

const STATUT_LABELS: Record<string, string> = {
  Planifiée: "Marquer planifiée",
  Faite: "Marquer faite",
  Annulée: "Annuler",
};
const TOUS_STATUTS = ["Planifiée", "Faite", "Annulée"];

// Couleurs d'étiquette d'objectif stables (dérivées de son id), pour distinguer visuellement
// plusieurs objectifs en cours sans dépendre d'un ordre quelconque.
const OBJECTIF_VARIANTS: Array<"default" | "warning" | "success"> = ["default", "warning", "success"];
function objectifVariant(objectifId: string) {
  let hash = 0;
  for (let i = 0; i < objectifId.length; i++) hash = (hash * 31 + objectifId.charCodeAt(i)) >>> 0;
  return OBJECTIF_VARIANTS[hash % OBJECTIF_VARIANTS.length];
}

function SeanceCard({ patientId, seance }: { patientId: string; seance: SeanceItem }) {
  const genAction = genererFicheSeanceAction;
  const [genState, genFormAction, genPending] = useActionState(genAction, initGenState);
  const [valState, valFormAction, valPending] = useActionState(validerFicheSeanceAction, initValState);

  const [fiche, setFiche] = useState<FicheSeance | null>(null);
  const [editing, setEditing] = useState(false);
  const [texteEdite, setTexteEdite] = useState("");
  const [materiel, setMateriel] = useState("");

  const [lastGenFiche, setLastGenFiche] = useState(genState.fiche);
  if (genState.fiche !== lastGenFiche) {
    setLastGenFiche(genState.fiche);
    if (genState.fiche) {
      setFiche(genState.fiche);
      setTexteEdite(ficheSeanceToText(genState.fiche));
      setMateriel(genState.fiche.materielNecessaire.join(", "));
      setEditing(false);
    }
  }

  const [lastValSuccess, setLastValSuccess] = useState(valState.success);
  if (valState.success !== lastValSuccess) {
    setLastValSuccess(valState.success);
    if (valState.success) setFiche(null);
  }

  const ficheExistante = parseFicheSeance(seance.contenu);
  const consigneDefaut = [
    `Prépare la séance du ${formatDateTime(seance.date)}`,
    seance.type ? `(${seance.type})` : "",
    seance.objectifSMART ? `, liée à l'objectif : « ${seance.objectifSMART.texteSMART} »` : "",
    seance.notes ? `. Note : ${seance.notes}` : ".",
  ]
    .join(" ")
    .trim();

  return (
    <Card>
      <CardContent className="flex flex-col gap-3 p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-start gap-3">
            <CalendarDays className="mt-0.5 h-4 w-4 text-primary" />
            <div>
              <p className="text-sm font-medium">{formatDateTime(seance.date)}</p>
              <p className="text-xs text-muted">
                {seance.type ?? "Séance"} {seance.format && `· ${seance.format}`}
                {seance.borgRessenti !== null && ` · Borg ${seance.borgRessenti}/10`}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {seance.objectifSMART && (
              <Badge variant={objectifVariant(seance.objectifSMART.id)} className="max-w-[220px]">
                <Target className="h-3 w-3 shrink-0" />
                <span className="truncate">{seance.objectifSMART.texteSMART}</span>
              </Badge>
            )}
            {seance.genereParIA && (
              <Badge variant="outline" className="gap-1">
                <Sparkles className="h-3 w-3" /> Préparée par l&rsquo;IA
              </Badge>
            )}
            <Badge variant={STATUT_VARIANT[seance.statut] ?? "muted"}>{seance.statut}</Badge>
            <div className="flex gap-1">
              {TOUS_STATUTS.filter((statutCible) => statutCible !== seance.statut).map((statutCible) => (
                <form key={statutCible} action={updateSeanceStatut.bind(null, seance.id, patientId, statutCible)}>
                  <Button size="sm" variant={statutCible === "Faite" ? "secondary" : "ghost"} type="submit">
                    {STATUT_LABELS[statutCible]}
                  </Button>
                </form>
              ))}
              <form action={deleteSeance.bind(null, seance.id, patientId)}>
                <button
                  type="submit"
                  aria-label="Supprimer cette séance"
                  className="rounded-[var(--radius-sm)] p-1.5 text-muted hover:bg-surface-muted hover:text-danger"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </form>
            </div>
          </div>
        </div>

        {ficheExistante ? (
          <FicheSeanceCard fiche={ficheExistante} />
        ) : (
          seance.contenu && <p className="whitespace-pre-line text-xs text-foreground/80">{seance.contenu}</p>
        )}
        {seance.notes && <p className="text-xs italic text-muted">{seance.notes}</p>}

        {!seance.contenu && !fiche && (
          <form action={genFormAction}>
            <input type="hidden" name="patientId" value={patientId} />
            <input type="hidden" name="seanceId" value={seance.id} />
            <input type="hidden" name="consigne" value={consigneDefaut} />
            <Button type="submit" size="sm" variant="outline" disabled={genPending}>
              <Sparkles className="h-3.5 w-3.5" />
              {genPending ? "Génération…" : "Préparer avec l'IA"}
            </Button>
            {genState.error && <p className="mt-1.5 text-sm text-danger">{genState.error}</p>}
          </form>
        )}

        {fiche && (
          <div className="flex flex-col gap-3 rounded-[var(--radius-sm)] border border-dashed border-primary p-3">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-primary">
              <Sparkles className="h-3.5 w-3.5" />
              Proposition de l&rsquo;IA — à valider
            </div>

            {!editing ? (
              <FicheSeanceCard fiche={fiche} />
            ) : (
              <Textarea value={texteEdite} onChange={(e) => setTexteEdite(e.target.value)} rows={14} className="font-mono text-xs" />
            )}

            <div className="flex flex-col gap-1.5">
              <Label htmlFor={`materiel-${seance.id}`}>Matériel nécessaire (le patient en sera prévenu avant la séance)</Label>
              <Input
                id={`materiel-${seance.id}`}
                value={materiel}
                onChange={(e) => setMateriel(e.target.value)}
                placeholder="Aucun"
              />
            </div>

            <form action={valFormAction} className="flex flex-wrap items-center gap-2">
              <input type="hidden" name="patientId" value={patientId} />
              <input type="hidden" name="seanceId" value={seance.id} />
              <input type="hidden" name="ficheJson" value={JSON.stringify(fiche)} />
              <input type="hidden" name="texteEdite" value={editing ? texteEdite : ""} />
              <input type="hidden" name="materielNecessaire" value={materiel} />
              <Button type="button" size="sm" variant="outline" onClick={() => setEditing((v) => !v)}>
                {editing ? "Revenir à la fiche structurée" : "Modifier"}
              </Button>
              <Button type="submit" size="sm" disabled={valPending}>
                {valPending ? "Enregistrement…" : "Enregistrer cette fiche"}
              </Button>
              <Button type="button" size="sm" variant="ghost" onClick={() => setFiche(null)}>
                Ignorer
              </Button>
            </form>
            {valState.error && <p className="text-sm text-danger">{valState.error}</p>}
            <p className="text-xs text-muted">Cette fiche ne rejoint le dossier que si tu cliques sur « Enregistrer ».</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function SeancesSection({ patientId, seances }: { patientId: string; seances: SeanceItem[] }) {
  const action = addSeance.bind(null, patientId);
  const [state, formAction, pending] = useActionState(action, initialState);

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardContent className="p-5">
          <form action={formAction} className="flex flex-col gap-4">
            <p className="text-sm font-semibold">Planifier une séance</p>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="date">Date et heure</Label>
                <Input id="date" name="date" type="datetime-local" required />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="type">Type de séance</Label>
                <Input id="type" name="type" placeholder="Renforcement, endurance, équilibre…" />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="format">Format</Label>
                <select id="format" name="format" className="h-10 rounded-[var(--radius-sm)] border border-border bg-surface px-3 text-sm">
                  <option value="Individuel">Individuel</option>
                  <option value="Collectif">Collectif</option>
                  <option value="Distance">À distance</option>
                </select>
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="contenu">Contenu & exercices (APA / Nutrition)</Label>
              <Textarea id="contenu" name="contenu" rows={2} placeholder="Renforcement membres inf. (chaise, squats guidés)…" />
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="borgRessenti">Ressenti d&apos;effort (Borg /10)</Label>
                <Input id="borgRessenti" name="borgRessenti" type="number" min={0} max={10} />
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="notes">Notes / ressenti</Label>
              <Textarea id="notes" name="notes" rows={2} />
            </div>
            {state.error && <p className="text-sm text-danger">{state.error}</p>}
            {state.success && <p className="text-sm text-success">{state.success}</p>}
            <div className="flex justify-end">
              <Button type="submit" disabled={pending}>
                {pending ? "Ajout…" : "Ajouter la séance"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <div className="flex flex-col gap-3">
        {seances.length === 0 && <p className="text-sm text-muted">Aucune séance planifiée.</p>}
        {seances.map((s) => (
          <SeanceCard key={s.id} patientId={patientId} seance={s} />
        ))}
      </div>
    </div>
  );
}
