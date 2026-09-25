import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { TESTS_PASS, progressionTest, type TestPassKey } from "@/lib/calculs";
import { formatDate, formatNumber } from "@/lib/utils";

interface BilanRow {
  phase: string;
  date: Date;
  [key: string]: unknown;
}

export function BilansComparison({ bilans }: { bilans: BilanRow[] }) {
  const parPhase: Record<string, BilanRow | undefined> = {
    T0: bilans.find((b) => b.phase === "T0"),
    T1: bilans.find((b) => b.phase === "T1"),
    T2: bilans.find((b) => b.phase === "T2"),
  };

  if (!parPhase.T0 && !parPhase.T1 && !parPhase.T2) {
    return <p className="text-sm text-muted">Aucun bilan clinique enregistré pour le moment.</p>;
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap gap-4 text-xs text-muted">
        {(["T0", "T1", "T2"] as const).map(
          (p) => parPhase[p] && <span key={p}>{p} — {formatDate(parPhase[p]!.date)}</span>
        )}
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Test</TableHead>
            <TableHead>T0</TableHead>
            <TableHead>T1</TableHead>
            <TableHead>T2</TableHead>
            <TableHead>Évolution (T2 vs T0)</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {TESTS_PASS.map((t) => {
            const t0 = parPhase.T0?.[t.key] as number | null | undefined;
            const t1 = parPhase.T1?.[t.key] as number | null | undefined;
            const t2 = parPhase.T2?.[t.key] as number | null | undefined;
            const prog = progressionTest(t.key as TestPassKey, t0, t2);
            return (
              <TableRow key={t.key}>
                <TableCell className="font-medium">{t.label}</TableCell>
                <TableCell>{t0 !== null && t0 !== undefined ? `${formatNumber(t0)} ${t.unite}` : "—"}</TableCell>
                <TableCell>{t1 !== null && t1 !== undefined ? `${formatNumber(t1)} ${t.unite}` : "—"}</TableCell>
                <TableCell>{t2 !== null && t2 !== undefined ? `${formatNumber(t2)} ${t.unite}` : "—"}</TableCell>
                <TableCell>
                  {prog ? (
                    <span
                      className={`inline-flex items-center gap-1 text-xs font-medium ${
                        prog.ameliore ? "text-success" : prog.delta === 0 ? "text-muted" : "text-danger"
                      }`}
                    >
                      {prog.delta === 0 ? (
                        <Minus className="h-3 w-3" />
                      ) : prog.ameliore ? (
                        <TrendingUp className="h-3 w-3" />
                      ) : (
                        <TrendingDown className="h-3 w-3" />
                      )}
                      {prog.delta > 0 ? "+" : ""}
                      {formatNumber(prog.delta)} {t.unite}
                    </span>
                  ) : (
                    <span className="text-xs text-muted">—</span>
                  )}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
