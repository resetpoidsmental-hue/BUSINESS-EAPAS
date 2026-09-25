"use client";

import { useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { calculerBilanNutritionnel, NIVEAUX_ACTIVITE, OBJECTIFS_PONDERAUX, type Sexe } from "@/lib/calculs";
import { formatNumber } from "@/lib/utils";
import { Calculator } from "lucide-react";

export function CalculateurAutonome() {
  const [form, setForm] = useState({
    poids: 70,
    taille: 170,
    age: 40,
    sexe: "H" as Sexe,
    nap: 1.375,
    objectifPonderal: "maintien",
  });

  const resultat = useMemo(() => {
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
    <Card>
      <CardContent className="p-5">
        <div className="mb-4 flex items-center gap-2">
          <Calculator className="h-4 w-4 text-primary" />
          <h2 className="text-sm font-semibold">Calculateur nutritionnel rapide</h2>
        </div>
        <p className="mb-4 text-xs text-muted">
          Pour un test rapide (téléphone, prospect). Pour suivre un client, utilise le bilan nutritionnel depuis sa
          fiche patient afin de garder un historique.
        </p>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <NumField label="Poids (kg)" value={form.poids} onChange={(v) => setForm((f) => ({ ...f, poids: v }))} />
          <NumField label="Taille (cm)" value={form.taille} onChange={(v) => setForm((f) => ({ ...f, taille: v }))} />
          <NumField label="Âge (ans)" value={form.age} onChange={(v) => setForm((f) => ({ ...f, age: v }))} />
          <div className="flex flex-col gap-1.5">
            <Label>Sexe</Label>
            <select
              value={form.sexe}
              onChange={(e) => setForm((f) => ({ ...f, sexe: e.target.value as Sexe }))}
              className="h-10 rounded-[var(--radius-sm)] border border-border bg-surface px-3 text-sm"
            >
              <option value="H">Homme</option>
              <option value="F">Femme</option>
            </select>
          </div>
          <div className="flex flex-col gap-1.5 sm:col-span-2">
            <Label>Niveau d&apos;activité</Label>
            <select
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
          <div className="flex flex-col gap-1.5 sm:col-span-3">
            <Label>Objectif pondéral</Label>
            <select
              value={form.objectifPonderal}
              onChange={(e) => setForm((f) => ({ ...f, objectifPonderal: e.target.value }))}
              className="h-10 w-full rounded-[var(--radius-sm)] border border-border bg-surface px-3 text-sm sm:w-auto"
            >
              {OBJECTIFS_PONDERAUX.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {resultat && (
          <div className="mt-5 grid grid-cols-2 gap-3 rounded-[var(--radius-sm)] bg-surface-muted p-4 sm:grid-cols-4">
            <Stat label="IMC" value={formatNumber(resultat.imc)} sub={resultat.classificationIMC} />
            <Stat label="Métabolisme de base" value={`${formatNumber(resultat.metabolismeBase, 0)} kcal`} />
            <Stat label="Dépense totale" value={`${formatNumber(resultat.depenseTotale, 0)} kcal`} />
            <Stat label="Apport cible" value={`${formatNumber(resultat.apportCalorique, 0)} kcal`} />
            <Stat label="Protéines" value={`${formatNumber(resultat.apportProteines, 0)} g`} />
            <Stat label="Lipides" value={`${formatNumber(resultat.apportLipides, 0)} g`} />
            <Stat label="Glucides" value={`${formatNumber(resultat.apportGlucides, 0)} g`} />
            <Stat label="Hydratation" value={`${formatNumber(resultat.hydratation, 2)} L/j`} />
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function NumField({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label>{label}</Label>
      <Input type="number" step="0.1" value={value} onChange={(e) => onChange(Number(e.target.value) || 0)} />
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
