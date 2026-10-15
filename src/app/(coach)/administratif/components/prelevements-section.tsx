"use client";

import { useActionState, useState } from "react";
import {
  relancerPrelevementAction,
  marquerPrelevementRegleManuellementAction,
  type PrelevementActionState,
} from "../actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDate, formatCurrency } from "@/lib/utils";
import { Download } from "lucide-react";

const initialState: PrelevementActionState = {};

export interface PrelevementItem {
  id: string;
  montant: number;
  statut: string;
  motifEchec: string | null;
  date: Date;
  patient: { nom: string; prenom: string };
  abonnement: { formule: string };
  factureId: string | null;
}

const STATUT_VARIANT: Record<string, "success" | "danger" | "warning" | "muted"> = {
  Réussi: "success",
  Échec: "danger",
  "En attente": "warning",
};

const FILTRES = ["Tous", "Échecs", "En attente", "Réussis"] as const;
type Filtre = (typeof FILTRES)[number];

export function PrelevementsSection({ prelevements }: { prelevements: PrelevementItem[] }) {
  const [filtre, setFiltre] = useState<Filtre>("Tous");

  const compte = {
    Tous: prelevements.length,
    Échecs: prelevements.filter((p) => p.statut === "Échec").length,
    "En attente": prelevements.filter((p) => p.statut === "En attente").length,
    Réussis: prelevements.filter((p) => p.statut === "Réussi").length,
  };

  const visibles = prelevements.filter((p) => {
    if (filtre === "Tous") return true;
    if (filtre === "Échecs") return p.statut === "Échec";
    if (filtre === "En attente") return p.statut === "En attente";
    return p.statut === "Réussi";
  });

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap gap-1.5">
        {FILTRES.map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setFiltre(f)}
            className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
              filtre === f ? "bg-primary-soft text-primary-hover" : "border border-border text-muted hover:text-foreground"
            }`}
          >
            {f} ({compte[f]})
          </button>
        ))}
      </div>

      {visibles.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted">Aucun prélèvement dans cette catégorie.</CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="bg-surface-muted/60">
                  <th className="px-3.5 py-2.5 text-left text-xs font-semibold uppercase text-muted">Client</th>
                  <th className="px-3.5 py-2.5 text-left text-xs font-semibold uppercase text-muted">Abonnement</th>
                  <th className="px-3.5 py-2.5 text-right text-xs font-semibold uppercase text-muted">Montant</th>
                  <th className="px-3.5 py-2.5 text-left text-xs font-semibold uppercase text-muted">Date</th>
                  <th className="px-3.5 py-2.5 text-left text-xs font-semibold uppercase text-muted">Statut</th>
                  <th className="px-3.5 py-2.5 text-left text-xs font-semibold uppercase text-muted"></th>
                </tr>
              </thead>
              <tbody>
                {visibles.map((p) => (
                  <PrelevementRow key={p.id} prelevement={p} />
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}

      <Card className="border-primary bg-primary-soft/30">
        <CardContent className="p-4 text-xs text-foreground">
          Chaque tentative crée automatiquement la facture correspondante (visible dans l&rsquo;onglet Factures) et, en cas
          de succès, envoie un reçu par email au client. Aucune relance automatique en cas d&rsquo;échec — c&rsquo;est toi
          qui décides quoi faire.
        </CardContent>
      </Card>
    </div>
  );
}

function PrelevementRow({ prelevement: p }: { prelevement: PrelevementItem }) {
  const [state, formAction, pending] = useActionState(relancerPrelevementAction.bind(null, p.id), initialState);

  return (
    <tr className={`border-t border-border ${p.statut === "Échec" ? "bg-danger-soft/40" : p.statut === "En attente" ? "bg-warning-soft/40" : ""}`}>
      <td className="px-3.5 py-2.5 font-medium">
        {p.patient.prenom} {p.patient.nom}
      </td>
      <td className="px-3.5 py-2.5 text-muted">{p.abonnement.formule}</td>
      <td className="px-3.5 py-2.5 text-right font-medium">{formatCurrency(p.montant)}</td>
      <td className="px-3.5 py-2.5 text-muted">{formatDate(p.date)}</td>
      <td className="px-3.5 py-2.5">
        <Badge variant={STATUT_VARIANT[p.statut] ?? "muted"}>
          {p.statut}
          {p.motifEchec ? ` — ${p.motifEchec}` : ""}
        </Badge>
        {state.error && <p className="mt-1 text-xs text-danger">{state.error}</p>}
        {state.success && <p className="mt-1 text-xs text-success">{state.success}</p>}
      </td>
      <td className="px-3.5 py-2.5">
        <div className="flex gap-1.5">
          {p.statut === "Échec" && (
            <>
              <form action={formAction}>
                <Button type="submit" size="sm" disabled={pending}>
                  {pending ? "…" : "Relancer"}
                </Button>
              </form>
              <form action={marquerPrelevementRegleManuellementAction.bind(null, p.id)}>
                <Button type="submit" size="sm" variant="outline">
                  Marquer réglé autrement
                </Button>
              </form>
            </>
          )}
          {p.statut === "Réussi" && p.factureId && (
            <a href={`/api/documents/facture/${p.factureId}`} target="_blank" rel="noopener noreferrer">
              <Button type="button" size="sm" variant="ghost" title="Télécharger la facture">
                <Download className="h-4 w-4" />
              </Button>
            </a>
          )}
        </div>
      </td>
    </tr>
  );
}
