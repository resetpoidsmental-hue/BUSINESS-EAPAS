"use client";

import { updateTicketStatut } from "./actions";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDateTime } from "@/lib/utils";

interface Ticket {
  id: string;
  sujet: string;
  description: string | null;
  statut: string;
  priorite: string;
  createdAt: Date;
  patient: { nom: string; prenom: string } | null;
}

const STATUT_VARIANT: Record<string, "warning" | "default" | "success"> = {
  Ouvert: "warning",
  "En cours": "default",
  Résolu: "success",
};

const PRIORITE_VARIANT: Record<string, "muted" | "default" | "warning" | "danger"> = {
  Basse: "muted",
  Normale: "default",
  Haute: "warning",
  Urgente: "danger",
};

export function TicketList({ tickets }: { tickets: Ticket[] }) {
  if (tickets.length === 0) {
    return <p className="text-sm text-muted">Aucun ticket SAV pour le moment.</p>;
  }

  return (
    <div className="flex flex-col gap-3">
      {tickets.map((t) => (
        <Card key={t.id}>
          <CardContent className="flex flex-col gap-2 p-4">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <p className="text-sm font-medium">{t.sujet}</p>
                {t.patient && (
                  <p className="text-xs text-muted">
                    {t.patient.prenom} {t.patient.nom}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-1.5">
                <Badge variant={PRIORITE_VARIANT[t.priorite] ?? "muted"}>{t.priorite}</Badge>
                <Badge variant={STATUT_VARIANT[t.statut] ?? "muted"}>{t.statut}</Badge>
              </div>
            </div>
            {t.description && <p className="text-sm text-muted">{t.description}</p>}
            <div className="flex items-center justify-between pt-1">
              <p className="text-xs text-muted">{formatDateTime(t.createdAt)}</p>
              <div className="flex gap-1">
                {t.statut !== "Ouvert" && (
                  <form action={updateTicketStatut.bind(null, t.id, "Ouvert")}>
                    <Button size="sm" variant="ghost" type="submit">Ouvert</Button>
                  </form>
                )}
                {t.statut !== "En cours" && (
                  <form action={updateTicketStatut.bind(null, t.id, "En cours")}>
                    <Button size="sm" variant="ghost" type="submit">En cours</Button>
                  </form>
                )}
                {t.statut !== "Résolu" && (
                  <form action={updateTicketStatut.bind(null, t.id, "Résolu")}>
                    <Button size="sm" variant="secondary" type="submit">Résolu</Button>
                  </form>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
