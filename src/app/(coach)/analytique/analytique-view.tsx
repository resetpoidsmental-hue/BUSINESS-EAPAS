"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Activity, Salad, Target as TargetIcon, Landmark } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { DonutGauge } from "@/components/ui/donut-gauge";
import { formatCurrency, formatNumber } from "@/lib/utils";
import { PERIODE_LABELS, type PeriodeKey, type AnalytiqueResultat, type AnalytiquePatientRow } from "@/lib/analytics";

const PERIODES: PeriodeKey[] = ["semaine", "mois", "tout"];

type SortKey = keyof Omit<AnalytiquePatientRow, "id" | "nom" | "prenom">;

const COLUMNS: { key: SortKey; label: string }[] = [
  { key: "assiduitePct", label: "Assiduité" },
  { key: "ressentiMoyen", label: "Ressenti moyen" },
  { key: "journalJours", label: "Journal (période)" },
  { key: "deltaPoids", label: "Δ poids" },
  { key: "respectRationPct", label: "Respect ration" },
  { key: "objectifsAtteints", label: "Objectifs" },
  { key: "deltaTug", label: "Δ TUG" },
  { key: "impayesMontant", label: "Impayés" },
];

function fmtPct(n: number | null) {
  return n === null ? "—" : `${n} %`;
}
function fmtRessenti(n: number | null) {
  return n === null ? "—" : `${formatNumber(n, 1)} / 10`;
}
function fmtDelta(n: number | null, unit: string) {
  if (n === null) return "—";
  const sign = n > 0 ? "+" : n < 0 ? "−" : "";
  return `${sign}${formatNumber(Math.abs(n), 1)} ${unit}`;
}
function fmtObjectifs(row: AnalytiquePatientRow) {
  return row.objectifsTotal === 0 ? "—" : `${row.objectifsAtteints} / ${row.objectifsTotal}`;
}

function ProgressRow({ label, pct }: { label: string; pct: number | null }) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between text-xs">
        <span className="text-foreground">{label}</span>
        <span className="text-muted">{fmtPct(pct)}</span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-surface-muted">
        <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${pct ?? 0}%` }} />
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[11px] text-muted">{label}</span>
      <span className="text-lg font-semibold text-foreground">{value}</span>
    </div>
  );
}

export function AnalytiqueView({ resultats }: { resultats: Record<PeriodeKey, AnalytiqueResultat> }) {
  const [periode, setPeriode] = useState<PeriodeKey>("mois");
  const [sort, setSort] = useState<{ key: SortKey; dir: "asc" | "desc" }>({ key: "assiduitePct", dir: "desc" });

  const resultat = resultats[periode];
  const { cohortes } = resultat;

  const sortedPatients = useMemo(() => {
    const withValue = resultat.patients.map((row) => ({ row, value: row[sort.key] }));
    withValue.sort((a, b) => {
      if (a.value === null && b.value === null) return 0;
      if (a.value === null) return 1;
      if (b.value === null) return -1;
      return sort.dir === "asc" ? a.value - b.value : b.value - a.value;
    });
    return withValue.map((w) => w.row);
  }, [resultat, sort]);

  function toggleSort(key: SortKey) {
    setSort((s) => (s.key === key ? { key, dir: s.dir === "desc" ? "asc" : "desc" } : { key, dir: "desc" }));
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex justify-end">
        <div className="inline-flex gap-1 rounded-[var(--radius-md)] border border-border bg-surface p-1">
          {PERIODES.map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setPeriode(p)}
              className={`rounded-[var(--radius-sm)] px-3.5 py-1.5 text-sm font-semibold transition-colors ${
                periode === p ? "bg-primary-soft text-primary-hover" : "text-muted hover:text-foreground"
              }`}
            >
              {PERIODE_LABELS[p]}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Card>
          <CardContent className="flex flex-col gap-4 p-5">
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-primary" />
              <h2 className="text-sm font-semibold">Assiduité &amp; activité</h2>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <Stat label="Assiduité cohorte" value={fmtPct(cohortes.assiduite.tauxPct)} />
              <Stat label="Ressenti moyen" value={fmtRessenti(cohortes.assiduite.ressentiMoyen)} />
              <Stat
                label="Journal rempli"
                value={`${cohortes.assiduite.journalRempliCount} / ${cohortes.assiduite.journalRempliTotal}`}
              />
            </div>
            <ProgressRow label="Assiduité" pct={cohortes.assiduite.tauxPct} />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex flex-col gap-4 p-5">
            <div className="flex items-center gap-2">
              <Salad className="h-4 w-4 text-primary" />
              <h2 className="text-sm font-semibold">Nutrition</h2>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <Stat label="Suivis nutrition" value={`${cohortes.nutrition.suivisCount} / ${cohortes.nutrition.suivisTotal}`} />
              <Stat label="Δ poids moyen" value={fmtDelta(cohortes.nutrition.deltaPoidsMoyen, "kg")} />
              <Stat label="Respect ration" value={fmtPct(cohortes.nutrition.respectRationMoyenPct)} />
            </div>
            <ProgressRow label="Respect moyen de la ration" pct={cohortes.nutrition.respectRationMoyenPct} />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex flex-col gap-4 p-5">
            <div className="flex items-center gap-2">
              <TargetIcon className="h-4 w-4 text-primary" />
              <h2 className="text-sm font-semibold">Objectifs &amp; résultats cliniques</h2>
            </div>
            <div className="flex items-center gap-4">
              {cohortes.objectifs.tauxPct !== null && <DonutGauge percent={cohortes.objectifs.tauxPct} size={72} strokeWidth={9} />}
              <div className="grid flex-1 grid-cols-3 gap-3">
                <Stat label="Objectifs atteints" value={`${cohortes.objectifs.atteints} / ${cohortes.objectifs.total}`} />
                <Stat label="Taux d'atteinte" value={fmtPct(cohortes.objectifs.tauxPct)} />
                <Stat label="Δ TUG moyen" value={fmtDelta(cohortes.objectifs.deltaTugMoyen, "s")} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex flex-col gap-4 p-5">
            <div className="flex items-center gap-2">
              <Landmark className="h-4 w-4 text-primary" />
              <h2 className="text-sm font-semibold">Activité commerciale</h2>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <Stat label="CA encaissé" value={formatCurrency(cohortes.commercial.caEncaisse)} />
              <Stat label="Factures impayées" value={formatCurrency(cohortes.commercial.impayesMontant)} />
              <Stat
                label="Devis en cours"
                value={`${cohortes.commercial.devisEnCoursCount} (${formatCurrency(cohortes.commercial.devisEnCoursMontant)})`}
              />
            </div>
            <p className="text-xs text-muted">
              Sur la période sélectionnée — factures payées (date de paiement), devis au statut « Envoyé ».
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="flex flex-col gap-3 p-5">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-sm font-semibold">Comparaison par patient</h2>
            <span className="text-xs text-muted">Clique un en-tête pour trier</span>
          </div>
          {sortedPatients.length === 0 ? (
            <p className="text-sm text-muted">Aucun patient pour le moment.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-xs uppercase tracking-wide text-muted">
                    <th className="py-2 text-left">Patient</th>
                    {COLUMNS.map((col) => (
                      <th key={col.key} className="py-2 text-right">
                        <button
                          type="button"
                          onClick={() => toggleSort(col.key)}
                          className="inline-flex items-center gap-1 normal-case tracking-normal text-foreground hover:text-primary"
                        >
                          {col.label}
                          {sort.key === col.key && <span className="text-primary">{sort.dir === "desc" ? "↓" : "↑"}</span>}
                        </button>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {sortedPatients.map((row) => (
                    <tr key={row.id}>
                      <td className="py-2">
                        <Link href={`/patients/${row.id}`} className="font-medium text-foreground hover:text-primary hover:underline">
                          {row.prenom} {row.nom}
                        </Link>
                      </td>
                      <td className="py-2 text-right tabular-nums">{fmtPct(row.assiduitePct)}</td>
                      <td className="py-2 text-right tabular-nums">{fmtRessenti(row.ressentiMoyen)}</td>
                      <td className="py-2 text-right tabular-nums">{row.journalJours} j</td>
                      <td className="py-2 text-right tabular-nums">{fmtDelta(row.deltaPoids, "kg")}</td>
                      <td className="py-2 text-right tabular-nums">{fmtPct(row.respectRationPct)}</td>
                      <td className="py-2 text-right tabular-nums">{fmtObjectifs(row)}</td>
                      <td className={`py-2 text-right tabular-nums ${row.deltaTug !== null ? (row.deltaTug < 0 ? "text-success" : row.deltaTug > 0 ? "text-danger" : "") : ""}`}>
                        {fmtDelta(row.deltaTug, "s")}
                      </td>
                      <td className={`py-2 text-right tabular-nums ${row.impayesMontant > 0 ? "text-warning" : ""}`}>
                        {row.impayesMontant > 0 ? formatCurrency(row.impayesMontant) : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <p className="text-xs text-muted">
            « — » = donnée non disponible pour ce patient sur cette période. Tous les chiffres sont calculés directement
            depuis les dossiers, jamais estimés par l&rsquo;IA.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
