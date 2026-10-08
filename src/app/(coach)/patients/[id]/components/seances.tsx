"use client";

import { useActionState } from "react";
import { addSeance, updateSeanceStatut, type ActionState } from "../../actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FicheSeanceCard } from "@/components/fiche-seance-card";
import { parseFicheSeance } from "@/lib/fiche-seance";
import { formatDateTime } from "@/lib/utils";
import { CalendarDays, Sparkles } from "lucide-react";

const initialState: ActionState = {};

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
}

const STATUT_VARIANT: Record<string, "success" | "warning" | "danger" | "default"> = {
  Planifiée: "default",
  Faite: "success",
  Annulée: "danger",
};

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
        {seances.map((s) => {
          const fiche = parseFicheSeance(s.contenu);
          return (
            <Card key={s.id}>
              <CardContent className="flex flex-col gap-3 p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <CalendarDays className="mt-0.5 h-4 w-4 text-primary" />
                    <div>
                      <p className="text-sm font-medium">{formatDateTime(s.date)}</p>
                      <p className="text-xs text-muted">
                        {s.type ?? "Séance"} {s.format && `· ${s.format}`}
                        {s.borgRessenti !== null && ` · Borg ${s.borgRessenti}/10`}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {s.genereParIA && (
                      <Badge variant="outline" className="gap-1">
                        <Sparkles className="h-3 w-3" /> Préparée par l&rsquo;IA
                      </Badge>
                    )}
                    <Badge variant={STATUT_VARIANT[s.statut] ?? "muted"}>{s.statut}</Badge>
                    {s.statut === "Planifiée" && (
                      <div className="flex gap-1">
                        <form action={updateSeanceStatut.bind(null, s.id, patientId, "Faite")}>
                          <Button size="sm" variant="secondary" type="submit">
                            Faite
                          </Button>
                        </form>
                        <form action={updateSeanceStatut.bind(null, s.id, patientId, "Annulée")}>
                          <Button size="sm" variant="ghost" type="submit">
                            Annuler
                          </Button>
                        </form>
                      </div>
                    )}
                  </div>
                </div>

                {fiche ? (
                  <FicheSeanceCard fiche={fiche} />
                ) : (
                  s.contenu && <p className="whitespace-pre-line text-xs text-foreground/80">{s.contenu}</p>
                )}
                {s.notes && <p className="text-xs italic text-muted">{s.notes}</p>}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
