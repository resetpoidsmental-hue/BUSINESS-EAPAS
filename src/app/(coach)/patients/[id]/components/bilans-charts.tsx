"use client";

import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";
import { Card, CardContent } from "@/components/ui/card";
import { DonutGauge } from "@/components/ui/donut-gauge";
import { TESTS_PASS, CATEGORIES_BILAN, type TestPassKey } from "@/lib/calculs";
import { formatDate } from "@/lib/utils";
import { Target } from "lucide-react";

interface BilanRow {
  phase: string;
  date: Date;
  [key: string]: unknown;
}

interface ObjectifItem {
  id: string;
  texteSMART: string;
  dateCible: Date | null;
  atteint: boolean;
  createdAt: Date;
}

const PHASE_ORDER = ["T0", "T1", "T2"] as const;

function pctTempsEcoule(createdAt: Date, dateCible: Date): number {
  const total = dateCible.getTime() - createdAt.getTime();
  if (total <= 0) return 100;
  const elapsed = Date.now() - createdAt.getTime();
  return Math.max(0, Math.min(100, Math.round((elapsed / total) * 100)));
}

function valeurTest(bilans: BilanRow[], phase: string, key: TestPassKey): number | null {
  const b = bilans.find((x) => x.phase === phase);
  const v = b?.[key];
  return typeof v === "number" ? v : null;
}

function TestChart({ testKey, bilans }: { testKey: TestPassKey; bilans: BilanRow[] }) {
  const test = TESTS_PASS.find((t) => t.key === testKey)!;
  const points = PHASE_ORDER.map((phase) => ({ phase, value: valeurTest(bilans, phase, testKey) }))
    .filter((p) => p.value !== null)
    .map((p) => ({ phase: p.phase as string, value: p.value as number }));

  if (points.length < 2) {
    return (
      <div className="flex h-[150px] w-[220px] flex-col items-center justify-center rounded-[var(--radius-sm)] border border-dashed border-border p-4 text-center">
        <p className="text-xs text-muted">{test.label} : pas encore assez de bilans (2 minimum).</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1.5">
      <p className="text-xs font-semibold text-foreground">{test.label}</p>
      <ResponsiveContainer width={220} height={150}>
        <BarChart data={points} margin={{ top: 16, right: 8, left: 8, bottom: 0 }}>
          <CartesianGrid vertical={false} stroke="var(--color-border)" />
          <XAxis dataKey="phase" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: "var(--color-muted)" }} />
          <YAxis hide domain={[0, (max: number) => max * 1.2]} />
          {"alerteSeuil" in test && test.alerteSeuil !== undefined && (
            <ReferenceLine
              y={test.alerteSeuil}
              stroke="var(--color-warning)"
              strokeDasharray="4 3"
              label={{ value: `seuil ${test.alerteSeuil} ${test.unite}`, position: "insideTopRight", fontSize: 9, fill: "var(--color-warning)" }}
            />
          )}
          <Tooltip
            formatter={(value) => [`${value} ${test.unite}`, test.label]}
            contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid var(--color-border)" }}
          />
          <Bar dataKey="value" fill="var(--color-primary)" radius={[4, 4, 0, 0]} maxBarSize={36} label={{ position: "top", fontSize: 11, fill: "var(--color-foreground)", fontWeight: 600 }} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

function ObjectifPrincipalCard({ objectif }: { objectif: ObjectifItem }) {
  const pct = !objectif.atteint && objectif.dateCible ? pctTempsEcoule(objectif.createdAt, objectif.dateCible) : null;

  return (
    <Card>
      <CardContent className="flex items-center gap-4 p-4">
        {objectif.atteint ? (
          <DonutGauge percent={100} checkmark />
        ) : pct !== null ? (
          <DonutGauge percent={pct} />
        ) : (
          <div className="flex h-[96px] w-[96px] shrink-0 items-center justify-center rounded-full border border-dashed border-border">
            <Target className="h-6 w-6 text-muted" />
          </div>
        )}
        <div className="flex flex-col gap-0.5">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-muted">
            Objectif principal {objectif.atteint ? "— atteint" : "— en cours"}
          </p>
          <p className="text-sm font-semibold text-foreground">{objectif.texteSMART}</p>
          {!objectif.atteint && objectif.dateCible && (
            <p className="text-xs text-muted">Échéance {formatDate(objectif.dateCible)} · temps écoulé depuis la création</p>
          )}
          {!objectif.atteint && !objectif.dateCible && <p className="text-xs text-muted">Pas d&rsquo;échéance définie.</p>}
          {!objectif.atteint && (
            <p className="text-[11px] italic text-muted">
              Mesure le temps écoulé, pas un résultat : compare-le toi-même aux graphiques ci-dessous.
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export function BilansCharts({ bilans, objectifs }: { bilans: BilanRow[]; objectifs: ObjectifItem[] }) {
  if (bilans.length === 0) return null;

  const objectifPrincipal = objectifs[0] ?? null;

  return (
    <div className="flex flex-col gap-4">
      {objectifPrincipal && <ObjectifPrincipalCard objectif={objectifPrincipal} />}

      {CATEGORIES_BILAN.map((cat) => {
        const aDesDonnees = cat.keys.some((k) => bilans.some((b) => typeof b[k] === "number"));
        return (
          <Card key={cat.label}>
            <CardContent className="flex flex-col gap-3 p-4">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-muted">{cat.label}</p>
              {aDesDonnees ? (
                <div className="flex flex-wrap gap-6">
                  {cat.keys.map((k) => (
                    <TestChart key={k} testKey={k} bilans={bilans} />
                  ))}
                </div>
              ) : (
                <p className="text-xs text-muted">Aucun résultat renseigné pour cette catégorie pour l&rsquo;instant.</p>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
