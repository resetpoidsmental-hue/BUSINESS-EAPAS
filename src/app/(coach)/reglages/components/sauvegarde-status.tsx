"use client";

import { useActionState } from "react";
import { CheckCircle2, AlertTriangle, Download } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatDateHeureParis } from "@/lib/utils";
import { sauvegarderMaintenantAction, type SauvegardeActionState } from "../actions";

const initialState: SauvegardeActionState = {};

function formaterTaille(octets: number) {
  if (octets < 1024 * 1024) return `${(octets / 1024).toFixed(0)} Ko`;
  return `${(octets / (1024 * 1024)).toFixed(1)} Mo`;
}

export function SauvegardeStatus({
  derniere,
  nombreConservees,
}: {
  derniere: { nom: string; dateISO: string; tailleOctets: number } | null;
  nombreConservees: number;
}) {
  const [state, formAction, pending] = useActionState(sauvegarderMaintenantAction, initialState);

  const affichee = state.sauvegarde ?? derniere;

  return (
    <Card>
      <CardContent className="flex flex-col gap-4 p-5">
        <div className="flex items-center gap-2.5">
          {affichee ? (
            <CheckCircle2 className="h-4 w-4 shrink-0 text-success" />
          ) : (
            <AlertTriangle className="h-4 w-4 shrink-0 text-warning" />
          )}
          <p className="text-sm font-semibold">Sauvegarde automatique</p>
        </div>

        {affichee ? (
          <div className="flex flex-wrap gap-6">
            <div>
              <p className="text-[11px] uppercase tracking-wide text-muted">Dernière sauvegarde</p>
              <p className="text-sm font-semibold">{formatDateHeureParis(affichee.dateISO)}</p>
            </div>
            <div>
              <p className="text-[11px] uppercase tracking-wide text-muted">Taille</p>
              <p className="text-sm font-semibold">{formaterTaille(affichee.tailleOctets)}</p>
            </div>
            <div>
              <p className="text-[11px] uppercase tracking-wide text-muted">Copies conservées</p>
              <p className="text-sm font-semibold">{nombreConservees} / 14</p>
            </div>
          </div>
        ) : (
          <p className="text-xs text-muted">
            Aucune sauvegarde pour l&rsquo;instant. Le bouton ci-dessous fonctionne déjà manuellement — pour
            l&rsquo;automatiser chaque nuit, ajoute une ligne de crontab sur le serveur (voir le README, section
            « Sauvegardes »).
          </p>
        )}

        <div className="flex flex-wrap gap-2">
          <form action={formAction}>
            <Button type="submit" size="sm" variant="outline" disabled={pending}>
              {pending ? "Sauvegarde…" : "Sauvegarder maintenant"}
            </Button>
          </form>
          {affichee && (
            <a href={`/api/sauvegardes/${encodeURIComponent(affichee.nom)}`}>
              <Button type="button" size="sm" variant="outline">
                <Download className="h-3.5 w-3.5" />
                Télécharger la dernière sauvegarde
              </Button>
            </a>
          )}
        </div>

        {state.error && <p className="text-sm text-danger">{state.error}</p>}

        <p className="text-xs text-muted">
          Une sauvegarde manuelle avant une opération sensible (import, changement de serveur) reste toujours une
          bonne idée en plus de l&rsquo;automatique.
        </p>
      </CardContent>
    </Card>
  );
}
