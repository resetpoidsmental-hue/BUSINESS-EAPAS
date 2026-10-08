import { Card, CardContent } from "@/components/ui/card";
import type { FicheSeance } from "@/lib/fiche-seance";

export function FicheSeanceCard({ fiche }: { fiche: FicheSeance }) {
  return (
    <Card>
      <CardContent className="flex flex-col gap-4 p-4">
        <div>
          <p className="font-semibold">{fiche.titre}</p>
          <p className="text-xs text-muted">Durée totale {fiche.dureeTotale}</p>
        </div>

        {fiche.objectifs.length > 0 && (
          <div className="rounded-[var(--radius-sm)] bg-surface-muted p-3">
            <p className="mb-1.5 text-xs font-semibold">Objectifs de la séance</p>
            <ul className="list-disc space-y-1 pl-4 text-xs">
              {fiche.objectifs.map((o, i) => (
                <li key={i}>{o}</li>
              ))}
            </ul>
          </div>
        )}

        {fiche.materielNecessaire.length > 0 && (
          <div className="rounded-[var(--radius-sm)] border border-border p-3">
            <p className="mb-1.5 text-xs font-semibold">Matériel nécessaire</p>
            <div className="flex flex-wrap gap-1.5">
              {fiche.materielNecessaire.map((m, i) => (
                <span key={i} className="rounded-full bg-surface-muted px-2.5 py-0.5 text-[11px] font-medium">
                  {m}
                </span>
              ))}
            </div>
          </div>
        )}

        {fiche.phases.map((phase, pi) => (
          <div key={pi} className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-primary-soft px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-primary">
                {phase.nom}
              </span>
              <span className="text-[11px] text-muted">{phase.duree}</span>
            </div>
            {phase.exercices.map((ex, ei) => (
              <div key={ei} className="rounded-[var(--radius-sm)] border border-border bg-surface p-3 text-xs leading-relaxed">
                <p className="font-semibold">
                  {ex.nom}
                  {ex.detailSeries && <span className="font-normal text-muted"> · {ex.detailSeries}</span>}
                </p>
                <div className="my-1.5 flex flex-wrap gap-1.5">
                  <span className="rounded-full bg-surface-muted px-2 py-0.5 font-semibold">RPE {ex.rpe}</span>
                  <span className="rounded-full bg-surface-muted px-2 py-0.5 font-semibold">Matériel : {ex.materiel}</span>
                  {ex.recuperation && (
                    <span className="rounded-full bg-surface-muted px-2 py-0.5 font-semibold">Récup {ex.recuperation}</span>
                  )}
                </div>
                <p>
                  <strong className="text-muted">Comment faire — </strong>
                  {ex.commentFaire}
                </p>
                <p className="mt-1">
                  <strong className="text-muted">Sécurité — </strong>
                  {ex.securite}
                </p>
                {ex.variante && (
                  <p className="mt-1">
                    <strong className="text-muted">Variante — </strong>
                    {ex.variante}
                  </p>
                )}
                <p className="mt-1">
                  <strong className="text-muted">Respiration — </strong>
                  {ex.respiration}
                </p>
                <p className="mt-1.5 rounded-[var(--radius-sm)] bg-warning-soft px-2 py-1 text-warning">
                  <strong>Point de vigilance — </strong>
                  {ex.vigilance}
                </p>
              </div>
            ))}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
