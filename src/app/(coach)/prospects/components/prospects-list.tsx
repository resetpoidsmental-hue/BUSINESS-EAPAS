"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/utils";

const STATUTS = ["Tous", "Nouveau", "Contacté", "Converti", "Perdu"] as const;

export interface ProspectRow {
  id: string;
  nom: string;
  email: string | null;
  telephone: string | null;
  source: string;
  statut: string;
  createdAt: string;
  prestationNom: string | null;
  patientId: string | null;
}

const STATUT_BADGE: Record<string, string> = {
  Nouveau: "bg-warning-soft text-warning",
  Contacté: "bg-primary-soft text-primary-hover",
  Converti: "bg-success-soft text-success",
  Perdu: "bg-danger-soft text-danger",
};

export function ProspectsList({ prospects }: { prospects: ProspectRow[] }) {
  const [statutFiltre, setStatutFiltre] = useState<(typeof STATUTS)[number]>("Tous");
  const [sourceFiltre, setSourceFiltre] = useState<string | null>(null);

  const sources = useMemo(() => Array.from(new Set(prospects.map((p) => p.source))).sort(), [prospects]);

  const filtres = prospects.filter((p) => {
    if (statutFiltre !== "Tous" && p.statut !== statutFiltre) return false;
    if (sourceFiltre && p.source !== sourceFiltre) return false;
    return true;
  });

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex flex-wrap gap-1.5">
          {STATUTS.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setStatutFiltre(s)}
              className={`rounded-full px-3 py-1 text-xs font-semibold transition-colors ${
                statutFiltre === s ? "bg-primary-soft text-primary-hover" : "border border-border text-muted hover:text-foreground"
              }`}
            >
              {s === "Tous" ? `Tous les statuts` : s}
            </button>
          ))}
        </div>
        {sources.length > 0 && (
          <>
            <div className="h-5 w-px bg-border" />
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-xs text-muted">Source :</span>
              {sources.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setSourceFiltre((cur) => (cur === s ? null : s))}
                  className={`rounded-full border px-2.5 py-1 text-[11px] font-medium transition-colors ${
                    sourceFiltre === s ? "border-primary bg-primary-soft text-primary-hover" : "border-border text-muted hover:text-foreground"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </>
        )}
      </div>

      {filtres.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted">Aucun prospect pour ces filtres.</CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-xs uppercase tracking-wide text-muted">
                    <th className="px-4 py-3 text-left">Contact</th>
                    <th className="px-4 py-3 text-left">Source</th>
                    <th className="px-4 py-3 text-left">Prestation qui l&rsquo;intéresse</th>
                    <th className="px-4 py-3 text-left">Statut</th>
                    <th className="px-4 py-3 text-left">Reçu le</th>
                    <th className="px-4 py-3"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filtres.map((p) => (
                    <tr key={p.id}>
                      <td className="px-4 py-3">
                        <div className="font-semibold">{p.nom}</div>
                        <div className="text-xs text-muted">{[p.email, p.telephone].filter(Boolean).join(" · ") || "—"}</div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="rounded-full bg-surface-muted px-2 py-0.5 text-xs font-medium">{p.source}</span>
                      </td>
                      <td className="px-4 py-3 text-muted">{p.prestationNom ?? "—"}</td>
                      <td className="px-4 py-3">
                        <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${STATUT_BADGE[p.statut] ?? "bg-surface-muted"}`}>
                          {p.statut}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-muted">{formatDate(p.createdAt)}</td>
                      <td className="px-4 py-3 text-right">
                        {p.patientId ? (
                          <Button asChild size="sm" variant="ghost">
                            <Link href={`/patients/${p.patientId}`}>Voir la fiche</Link>
                          </Button>
                        ) : (
                          <Button asChild size="sm" variant="outline">
                            <Link href={`/prospects/${p.id}/convertir`}>Convertir →</Link>
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
