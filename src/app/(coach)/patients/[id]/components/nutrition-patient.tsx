"use client";

import { useActionState, useMemo, useState } from "react";
import { addBilanNutrition, type ActionState } from "../../actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { calculerBilanNutritionnel, NIVEAUX_ACTIVITE, OBJECTIFS_PONDERAUX, type Sexe } from "@/lib/calculs";
import { formatDate, formatNumber } from "@/lib/utils";

const initialState: ActionState = {};

interface Bilan {
  id: string;
  date: Date;
  poids: number;
  imc: number;
  classificationIMC: string;
  apportCalorique: number;
  apportProteines: number;
  apportLipides: number;
  apportGlucides: number;
  hydratation: number;
}

export function NutritionPatientSection({
  patientId,
  bilans,
  defaultAge,
  defaultSexe,
}: {
  patientId: string;
  bilans: Bilan[];
  defaultAge?: number | null;
  defaultSexe?: string | null;
}) {
  const action = addBilanNutrition.bind(null, patientId);
  const [state, formAction, pending] = useActionState(action, initialState);

  const [form, setForm] = useState({
    poids: 0,
    taille: 0,
    age: defaultAge ?? 0,
    sexe: (defaultSexe === "F" ? "F" : "H") as Sexe,
    nap: 1.375,
    objectifPonderal: "maintien",
  });

  const preview = useMemo(() => {
    if (!form.poids || !form.taille || !form.age) return null;
    return calculerBilanNutritionnel({
      poidsKg: form.poids,
      tailleCm: form.taille,
      age: form.age,
      sexe: form.sexe,
      nap: form.nap,
      objectifPonderal: form.objectifPonderal,
    });
  }, [form]);

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardContent className="p-5">
          <form action={formAction} className="flex flex-col gap-5">
            <p className="text-sm font-semibold">Calculateur nutritionnel (Mifflin-St Jeor)</p>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <NumField label="Poids (kg)" name="poids" value={form.poids} onChange={(v) => setForm((f) => ({ ...f, poids: v }))} />
              <NumField label="Taille (cm)" name="taille" value={form.taille} onChange={(v) => setForm((f) => ({ ...f, taille: v }))} />
              <NumField label="Âge (ans)" name="age" value={form.age} onChange={(v) => setForm((f) => ({ ...f, age: v }))} />
              <NumField label="Tour de taille (cm)" name="tourDeTaille" optional />
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="sexe">Sexe</Label>
                <select
                  id="sexe"
                  name="sexe"
                  value={form.sexe}
                  onChange={(e) => setForm((f) => ({ ...f, sexe: e.target.value as Sexe }))}
                  className="h-10 rounded-[var(--radius-sm)] border border-border bg-surface px-3 text-sm"
                >
                  <option value="H">Homme</option>
                  <option value="F">Femme</option>
                </select>
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="nap">Niveau d&apos;activité</Label>
                <select
                  id="nap"
                  name="nap"
                  value={form.nap}
                  onChange={(e) => setForm((f) => ({ ...f, nap: Number(e.target.value) }))}
                  className="h-10 rounded-[var(--radius-sm)] border border-border bg-surface px-3 text-sm"
                >
                  {NIVEAUX_ACTIVITE.map((n) => (
                    <option key={n.value} value={n.value}>
                      {n.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex flex-col gap-1.5 sm:max-w-md">
              <Label htmlFor="objectifPonderal">Objectif pondéral</Label>
              <select
                id="objectifPonderal"
                name="objectifPonderal"
                value={form.objectifPonderal}
                onChange={(e) => setForm((f) => ({ ...f, objectifPonderal: e.target.value }))}
                className="h-10 rounded-[var(--radius-sm)] border border-border bg-surface px-3 text-sm"
              >
                {OBJECTIFS_PONDERAUX.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>

            {preview && (
              <div className="grid grid-cols-2 gap-3 rounded-[var(--radius-sm)] bg-surface-muted p-4 sm:grid-cols-4">
                <Stat label="IMC" value={`${formatNumber(preview.imc)}`} sub={preview.classificationIMC} />
                <Stat label="Métabolisme de base" value={`${formatNumber(preview.metabolismeBase, 0)} kcal`} />
                <Stat label="Dépense totale" value={`${formatNumber(preview.depenseTotale, 0)} kcal`} />
                <Stat label="Apport cible" value={`${formatNumber(preview.apportCalorique, 0)} kcal`} />
                <Stat label="Protéines" value={`${formatNumber(preview.apportProteines, 0)} g`} />
                <Stat label="Lipides" value={`${formatNumber(preview.apportLipides, 0)} g`} />
                <Stat label="Glucides" value={`${formatNumber(preview.apportGlucides, 0)} g`} />
                <Stat label="Hydratation" value={`${formatNumber(preview.hydratation, 2)} L/j`} sub="+0,5L les jours de séance" />
              </div>
            )}

            {state.error && <p className="text-sm text-danger">{state.error}</p>}
            {state.success && <p className="text-sm text-success">{state.success}</p>}

            <div className="flex justify-end">
              <Button type="submit" disabled={pending}>
                {pending ? "Enregistrement…" : "Enregistrer le bilan nutritionnel"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {bilans.length > 0 && (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Poids</TableHead>
              <TableHead>IMC</TableHead>
              <TableHead>Apport cible</TableHead>
              <TableHead>Protéines</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {bilans.map((b) => (
              <TableRow key={b.id}>
                <TableCell>{formatDate(b.date)}</TableCell>
                <TableCell>{formatNumber(b.poids)} kg</TableCell>
                <TableCell>
                  {formatNumber(b.imc)} — {b.classificationIMC}
                </TableCell>
                <TableCell>{formatNumber(b.apportCalorique, 0)} kcal</TableCell>
                <TableCell>{formatNumber(b.apportProteines, 0)} g</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}

function NumField({
  label,
  name,
  value,
  onChange,
  optional,
}: {
  label: string;
  name: string;
  value?: number;
  onChange?: (v: number) => void;
  optional?: boolean;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={name}>
        {label} {!optional && <span className="text-danger">*</span>}
      </Label>
      <Input
        id={name}
        name={name}
        type="number"
        step="0.1"
        defaultValue={optional ? undefined : value || undefined}
        onChange={onChange ? (e) => onChange(Number(e.target.value) || 0) : undefined}
      />
    </div>
  );
}

function Stat({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div>
      <p className="text-xs text-muted">{label}</p>
      <p className="text-base font-semibold">{value}</p>
      {sub && <p className="text-xs text-muted">{sub}</p>}
    </div>
  );
}
