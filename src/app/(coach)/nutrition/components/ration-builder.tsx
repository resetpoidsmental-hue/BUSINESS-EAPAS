"use client";

import { useActionState, useState } from "react";
import { creerModeleRationAction, modifierModeleRationAction, type ActionState } from "../actions";
import {
  CATEGORIES_RATION,
  MEAL_KEYS,
  MEAL_LABELS,
  calculerRation,
  calculerKcalRepas,
  rationVide,
  repartitionVide,
  menuTypeVide,
  type RationQuantites,
  type Repartition,
  type MenuType,
} from "@/lib/categories-ration";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";

const initialState: ActionState = {};

interface RationBuilderProps {
  mode: "create" | "edit";
  patientId?: string | null;
  modeleId?: string;
  defaultTargetKcal?: number;
  initial?: {
    nom: string;
    targetKcal: number;
    ration: RationQuantites;
    repartition: Repartition;
    menuType: MenuType;
  };
}

export function RationBuilder({ mode, patientId, modeleId, defaultTargetKcal, initial }: RationBuilderProps) {
  const action =
    mode === "edit" && modeleId
      ? modifierModeleRationAction.bind(null, modeleId)
      : creerModeleRationAction.bind(null, patientId ?? null);
  const [state, formAction, pending] = useActionState(action, initialState);

  const [nom, setNom] = useState(initial?.nom ?? "Nouveau modèle de ration");
  const [targetKcal, setTargetKcal] = useState(initial?.targetKcal ?? defaultTargetKcal ?? 2000);
  const [qty, setQty] = useState<RationQuantites>(initial?.ration ?? rationVide());
  const [repartition, setRepartition] = useState<Repartition>(initial?.repartition ?? repartitionVide());
  const [menuType, setMenuType] = useState<MenuType>(initial?.menuType ?? menuTypeVide());

  const { lignes, totaux } = calculerRation(qty);

  const repartiTotal = (catKey: string) => MEAL_KEYS.reduce((s, m) => s + (repartition[catKey]?.[m] ?? 0), 0);

  return (
    <form action={formAction} className="flex flex-col gap-6">
      <input type="hidden" name="rationJson" value={JSON.stringify(qty)} />
      <input type="hidden" name="repartitionJson" value={JSON.stringify(repartition)} />
      <input type="hidden" name="menuTypeJson" value={JSON.stringify(menuType)} />

      <Card>
        <CardContent className="p-5">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-[1fr_220px] sm:items-end">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="nom">Nom du modèle</Label>
              <Input id="nom" name="nom" value={nom} onChange={(e) => setNom(e.target.value)} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="targetKcal">Objectif énergétique (kcal)</Label>
              <Input
                id="targetKcal"
                name="targetKcal"
                type="number"
                value={targetKcal}
                onChange={(e) => setTargetKcal(Number(e.target.value) || 0)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-5">
          <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
            <p className="text-sm font-semibold">Tableau de ration</p>
            <span className="text-xs text-muted">Saisis une quantité (g) — le calcul se fait automatiquement</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs uppercase tracking-wide text-muted">
                  <th className="py-2 text-left">Aliment</th>
                  <th className="py-2 text-right">Qté (g)</th>
                  <th className="py-2 text-right">Protéines</th>
                  <th className="py-2 text-right">Lipides</th>
                  <th className="py-2 text-right">Glucides</th>
                  <th className="py-2 text-right">Énergie</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {lignes.map((row) => (
                  <tr key={row.key}>
                    <td className="py-2">{row.label}</td>
                    <td className="py-2 text-right">
                      <input
                        type="number"
                        value={qty[row.key] ?? 0}
                        onChange={(e) => setQty((q) => ({ ...q, [row.key]: Number(e.target.value) || 0 }))}
                        className="h-8 w-20 rounded-[var(--radius-sm)] border border-border bg-surface px-2 text-right text-sm"
                      />
                    </td>
                    <td className="py-2 text-right tabular-nums">{row.p} g</td>
                    <td className="py-2 text-right tabular-nums">{row.l} g</td>
                    <td className="py-2 text-right tabular-nums">{row.g} g</td>
                    <td className="py-2 text-right tabular-nums">{row.aet} kcal</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-foreground font-semibold">
                  <td className="py-2">Total</td>
                  <td className="py-2 text-right">{totaux.totalQty} g</td>
                  <td className="py-2 text-right">{totaux.totalP} g</td>
                  <td className="py-2 text-right">{totaux.totalL} g</td>
                  <td className="py-2 text-right">{totaux.totalG} g</td>
                  <td className="py-2 text-right">{totaux.totalAet} kcal</td>
                </tr>
                <tr className="text-xs text-muted">
                  <td colSpan={2} className="pt-1">
                    % de l&apos;apport énergétique total
                  </td>
                  <td className="pt-1 text-right">{totaux.pctP} %</td>
                  <td className="pt-1 text-right">{totaux.pctL} %</td>
                  <td className="pt-1 text-right">{totaux.pctG} %</td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          </div>
          <p className="mt-3 text-xs text-muted">
            Valeurs de référence pour 100 g (table de composition simplifiée) — {totaux.totalAet} / {targetKcal} kcal
            visés.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-5">
          <p className="mb-3 text-sm font-semibold">Répartition par repas</p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs uppercase tracking-wide text-muted">
                  <th className="py-2 text-left">Aliment</th>
                  <th className="py-2 text-right">Ration</th>
                  {MEAL_KEYS.map((m) => (
                    <th key={m} className="py-2 text-right">
                      {MEAL_LABELS[m]}
                    </th>
                  ))}
                  <th className="py-2 text-right">Réparti</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {CATEGORIES_RATION.map((cat) => {
                  const total = qty[cat.key] ?? 0;
                  const sum = repartiTotal(cat.key);
                  const ok = sum === total;
                  return (
                    <tr key={cat.key}>
                      <td className="py-2">{cat.label}</td>
                      <td className="py-2 text-right tabular-nums text-muted">{total}</td>
                      {MEAL_KEYS.map((m) => (
                        <td key={m} className="py-2 text-right">
                          <input
                            type="number"
                            value={repartition[cat.key]?.[m] ?? 0}
                            onChange={(e) =>
                              setRepartition((r) => ({
                                ...r,
                                [cat.key]: { ...r[cat.key], [m]: Number(e.target.value) || 0 },
                              }))
                            }
                            className="h-8 w-16 rounded-[var(--radius-sm)] border border-border bg-surface px-2 text-right text-sm"
                          />
                        </td>
                      ))}
                      <td
                        className={`py-2 text-right text-xs font-semibold tabular-nums ${ok ? "text-success" : "text-warning"}`}
                      >
                        {sum}
                        {ok ? " ✓" : ` (${sum - total > 0 ? "+" : ""}${sum - total}g)`}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-5">
          <p className="mb-3 text-sm font-semibold">Menu type</p>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {MEAL_KEYS.map((m) => (
              <div key={m} className="flex flex-col gap-2 rounded-[var(--radius-sm)] border border-border p-4">
                <div className="flex items-baseline justify-between">
                  <p className="text-sm font-medium">{MEAL_LABELS[m]}</p>
                  <span className="text-xs text-muted">≈ {calculerKcalRepas(repartition, m)} kcal</span>
                </div>
                <Textarea
                  rows={4}
                  value={menuType[m]}
                  onChange={(e) => setMenuType((mt) => ({ ...mt, [m]: e.target.value }))}
                  placeholder="Ce que le patient mangera à ce repas…"
                />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {state.error && <p className="text-sm text-danger">{state.error}</p>}
      {state.success && <p className="text-sm text-success">{state.success}</p>}

      <div className="flex justify-end">
        <Button type="submit" disabled={pending}>
          {pending ? "Enregistrement…" : mode === "edit" ? "Enregistrer les modifications" : "Créer ce modèle"}
        </Button>
      </div>
    </form>
  );
}
