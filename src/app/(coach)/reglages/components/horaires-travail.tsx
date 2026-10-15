"use client";

import { useActionState, useState } from "react";
import {
  enregistrerHorairesAction,
  ajouterCreneauExceptionnelAction,
  supprimerCreneauExceptionnelAction,
  type ActionState,
} from "../actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { formatDate } from "@/lib/utils";
import { Plus, Trash2 } from "lucide-react";

const initialState: ActionState = {};

const JOURS = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"];

export interface HoraireInitial {
  jour: number;
  actif: boolean;
  debut: string;
  fin: string;
}

export interface CreneauExceptionnelItem {
  id: string;
  date: string;
  debut: string;
  fin: string;
  note: string | null;
}

export function HorairesTravail({
  horaires,
  creneauxExceptionnels,
}: {
  horaires: HoraireInitial[];
  creneauxExceptionnels: CreneauExceptionnelItem[];
}) {
  const [state, formAction, pending] = useActionState(enregistrerHorairesAction, initialState);
  const [exState, exFormAction, exPending] = useActionState(ajouterCreneauExceptionnelAction, initialState);
  const [actifs, setActifs] = useState<boolean[]>(JOURS.map((_, i) => horaires.find((h) => h.jour === i)?.actif ?? false));

  return (
    <div className="flex flex-col gap-6">
      <form action={formAction}>
        <Card>
          <CardContent className="flex flex-col gap-1 p-5">
            <p className="mb-2 text-sm font-semibold">Horaires de travail</p>
            <p className="mb-3 text-xs text-muted">Définissent les créneaux « disponibles » affichés dans ton Agenda.</p>
            {JOURS.map((label, jour) => {
              const h = horaires.find((x) => x.jour === jour);
              const actif = actifs[jour];
              return (
                <div key={jour} className="flex flex-wrap items-center gap-3 border-b border-surface-muted py-2.5 last:border-0">
                  <button
                    type="button"
                    aria-label={`${actif ? "Désactiver" : "Activer"} ${label}`}
                    aria-pressed={actif}
                    onClick={() => setActifs((a) => a.map((v, i) => (i === jour ? !v : v)))}
                    className={`relative h-[22px] w-[38px] flex-shrink-0 rounded-full transition-colors ${actif ? "bg-primary" : "bg-surface-muted"}`}
                  >
                    <span
                      className={`absolute top-0.5 h-[18px] w-[18px] rounded-full bg-white transition-all ${actif ? "left-[18px]" : "left-0.5"}`}
                    />
                  </button>
                  <input type="hidden" name={`actif_${jour}`} value={actif ? "on" : ""} />
                  <span className="w-[90px] text-sm font-semibold">{label}</span>
                  {actif ? (
                    <div className="flex items-center gap-2">
                      <input
                        type="time"
                        name={`debut_${jour}`}
                        defaultValue={h?.debut ?? "09:00"}
                        className="h-8 rounded-[var(--radius-sm)] border border-border bg-surface px-2 text-sm"
                      />
                      <span className="text-xs text-muted">à</span>
                      <input
                        type="time"
                        name={`fin_${jour}`}
                        defaultValue={h?.fin ?? "18:00"}
                        className="h-8 rounded-[var(--radius-sm)] border border-border bg-surface px-2 text-sm"
                      />
                    </div>
                  ) : (
                    <span className="text-sm text-muted">Non travaillé</span>
                  )}
                </div>
              );
            })}
            {state.error && <p className="mt-2 text-sm text-danger">{state.error}</p>}
            {state.success && <p className="mt-2 text-sm text-success">{state.success}</p>}
            <div className="mt-3 flex justify-end">
              <Button type="submit" disabled={pending}>
                {pending ? "Enregistrement…" : "Enregistrer les horaires"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>

      <Card>
        <CardContent className="flex flex-col gap-3 p-5">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold">Créneaux exceptionnels</p>
          </div>
          {creneauxExceptionnels.length > 0 && (
            <div className="flex flex-col gap-2">
              {creneauxExceptionnels.map((c) => (
                <div key={c.id} className="flex items-center justify-between rounded-[var(--radius-sm)] border border-border p-3">
                  <div>
                    <p className="text-sm font-semibold">
                      {formatDate(c.date)}, {c.debut}–{c.fin}
                    </p>
                    {c.note && <p className="text-xs text-muted">{c.note}</p>}
                  </div>
                  <form action={supprimerCreneauExceptionnelAction.bind(null, c.id)}>
                    <Button type="submit" size="sm" variant="ghost">
                      <Trash2 className="h-3.5 w-3.5 text-danger" />
                    </Button>
                  </form>
                </div>
              ))}
            </div>
          )}
          <form action={exFormAction} className="flex flex-wrap items-end gap-2 border-t border-surface-muted pt-3">
            <div className="flex flex-col gap-1">
              <label className="text-xs text-muted">Date</label>
              <Input type="date" name="date" required className="h-9" />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs text-muted">Début</label>
              <input type="time" name="debut" required defaultValue="09:00" className="h-9 rounded-[var(--radius-sm)] border border-border bg-surface px-2 text-sm" />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs text-muted">Fin</label>
              <input type="time" name="fin" required defaultValue="12:00" className="h-9 rounded-[var(--radius-sm)] border border-border bg-surface px-2 text-sm" />
            </div>
            <div className="flex flex-1 flex-col gap-1">
              <label className="text-xs text-muted">Note (optionnel)</label>
              <Input type="text" name="note" placeholder="Ouverture ponctuelle…" className="h-9" />
            </div>
            <Button type="submit" variant="secondary" disabled={exPending}>
              <Plus className="h-4 w-4" /> Ajouter
            </Button>
          </form>
          {exState.error && <p className="text-sm text-danger">{exState.error}</p>}
          <p className="text-xs text-muted">Utile pour une ouverture exceptionnelle sans changer tes horaires habituels.</p>
        </CardContent>
      </Card>
    </div>
  );
}
