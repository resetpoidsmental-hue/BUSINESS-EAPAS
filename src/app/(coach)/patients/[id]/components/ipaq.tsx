"use client";

import { useActionState, useMemo, useState } from "react";
import { addIPAQ, type ActionState } from "../../actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { calculerScoreIPAQ } from "@/lib/calculs";
import { formatDate } from "@/lib/utils";

const initialState: ActionState = {};

interface IPAQEval {
  id: string;
  date: Date;
  scoreTotal: number;
  classification: string;
  marcheJours: number;
  marcheMinutes: number;
  modJours: number;
  modMinutes: number;
  vigJours: number;
  vigMinutes: number;
}

const CLASSIF_VARIANT: Record<string, "danger" | "warning" | "success"> = {
  "Faible / Sédentaire": "danger",
  Modéré: "warning",
  Élevé: "success",
};

export function IPAQSection({ patientId, evaluations }: { patientId: string; evaluations: IPAQEval[] }) {
  const action = addIPAQ.bind(null, patientId);
  const [state, formAction, pending] = useActionState(action, initialState);

  const [values, setValues] = useState({
    marcheJours: 0,
    marcheMinutes: 0,
    modJours: 0,
    modMinutes: 0,
    vigJours: 0,
    vigMinutes: 0,
  });

  const preview = useMemo(() => calculerScoreIPAQ(values), [values]);

  function update(key: string, v: string) {
    setValues((prev) => ({ ...prev, [key]: Number(v) || 0 }));
  }

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardContent className="p-5">
          <form action={formAction} className="flex flex-col gap-5">
            <p className="text-sm font-semibold">Calculateur IPAQ</p>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <IntensityBlock
                label="Marche"
                coeff="MET 3.3"
                joursName="marcheJours"
                minutesName="marcheMinutes"
                onChange={update}
              />
              <IntensityBlock
                label="Activité modérée"
                coeff="MET 4.0"
                joursName="modJours"
                minutesName="modMinutes"
                onChange={update}
              />
              <IntensityBlock
                label="Activité vigoureuse"
                coeff="MET 8.0"
                joursName="vigJours"
                minutesName="vigMinutes"
                onChange={update}
              />
            </div>
            <div className="flex flex-col gap-1.5 sm:w-64">
              <Label htmlFor="tempsAssisMinutes">Temps assis moyen (min/jour)</Label>
              <Input id="tempsAssisMinutes" name="tempsAssisMinutes" type="number" min={0} />
            </div>

            <div className="flex items-center gap-3 rounded-[var(--radius-sm)] bg-surface-muted p-4">
              <span className="text-sm text-muted">Score en direct :</span>
              <span className="text-lg font-semibold">{preview.scoreTotal} MET-min/sem</span>
              <Badge variant={CLASSIF_VARIANT[preview.classification] ?? "muted"}>{preview.classification}</Badge>
            </div>

            {state.error && <p className="text-sm text-danger">{state.error}</p>}
            {state.success && <p className="text-sm text-success">{state.success}</p>}

            <div className="flex justify-end">
              <Button type="submit" disabled={pending}>
                {pending ? "Enregistrement…" : "Enregistrer l'évaluation"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {evaluations.length > 0 && (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Score (MET-min/sem)</TableHead>
              <TableHead>Classification</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {evaluations.map((e) => (
              <TableRow key={e.id}>
                <TableCell>{formatDate(e.date)}</TableCell>
                <TableCell>{e.scoreTotal}</TableCell>
                <TableCell>
                  <Badge variant={CLASSIF_VARIANT[e.classification] ?? "muted"}>{e.classification}</Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}

function IntensityBlock({
  label,
  coeff,
  joursName,
  minutesName,
  onChange,
}: {
  label: string;
  coeff: string;
  joursName: string;
  minutesName: string;
  onChange: (key: string, v: string) => void;
}) {
  return (
    <div className="flex flex-col gap-2 rounded-[var(--radius-sm)] border border-border p-3">
      <p className="text-sm font-medium">{label}</p>
      <p className="text-xs text-muted">{coeff}</p>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor={joursName} className="text-xs">Jours / semaine</Label>
        <Input
          id={joursName}
          name={joursName}
          type="number"
          min={0}
          max={7}
          defaultValue={0}
          onChange={(e) => onChange(joursName, e.target.value)}
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor={minutesName} className="text-xs">Minutes / jour</Label>
        <Input
          id={minutesName}
          name={minutesName}
          type="number"
          min={0}
          defaultValue={0}
          onChange={(e) => onChange(minutesName, e.target.value)}
        />
      </div>
    </div>
  );
}
