"use client";

import { useActionState, useState } from "react";
import {
  updateTicketStatut,
  genererReponseSAVAction,
  envoyerReponseSAVAction,
  type GenererReponseState,
  type EnvoyerReponseState,
} from "./actions";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { formatDateTime, formatDateHeureParis } from "@/lib/utils";
import { Sparkles, CheckCircle2 } from "lucide-react";

const initGenState: GenererReponseState = {};
const initSendState: EnvoyerReponseState = {};

interface Ticket {
  id: string;
  patientId: string | null;
  sujet: string;
  description: string | null;
  statut: string;
  priorite: string;
  createdAt: Date;
  reponse: string | null;
  reponseEnvoyeeAt: Date | null;
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

function TicketCard({ ticket, iaDisponible }: { ticket: Ticket; iaDisponible: boolean }) {
  const [genState, genFormAction, genPending] = useActionState(genererReponseSAVAction, initGenState);
  const [sendState, sendFormAction, sendPending] = useActionState(envoyerReponseSAVAction, initSendState);

  const [brouillon, setBrouillon] = useState<string | null>(null);
  const [envoyee, setEnvoyee] = useState(Boolean(ticket.reponseEnvoyeeAt));

  const [lastReponse, setLastReponse] = useState(genState.reponse);
  if (genState.reponse !== lastReponse) {
    setLastReponse(genState.reponse);
    if (genState.reponse) setBrouillon(genState.reponse);
  }

  const [lastSuccess, setLastSuccess] = useState(sendState.success);
  if (sendState.success !== lastSuccess) {
    setLastSuccess(sendState.success);
    if (sendState.success) {
      setEnvoyee(true);
      setBrouillon(null);
    }
  }

  return (
    <Card>
      <CardContent className="flex flex-col gap-2 p-4">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <p className="text-sm font-medium">{ticket.sujet}</p>
            {ticket.patient && (
              <p className="text-xs text-muted">
                {ticket.patient.prenom} {ticket.patient.nom}
              </p>
            )}
          </div>
          <div className="flex items-center gap-1.5">
            <Badge variant={PRIORITE_VARIANT[ticket.priorite] ?? "muted"}>{ticket.priorite}</Badge>
            <Badge variant={STATUT_VARIANT[ticket.statut] ?? "muted"}>{ticket.statut}</Badge>
          </div>
        </div>
        {ticket.description && <p className="text-sm text-muted">{ticket.description}</p>}
        <div className="flex items-center justify-between pt-1">
          <p className="text-xs text-muted">{formatDateTime(ticket.createdAt)}</p>
          <div className="flex gap-1">
            {ticket.statut !== "Ouvert" && (
              <form action={updateTicketStatut.bind(null, ticket.id, "Ouvert")}>
                <Button size="sm" variant="ghost" type="submit">Ouvert</Button>
              </form>
            )}
            {ticket.statut !== "En cours" && (
              <form action={updateTicketStatut.bind(null, ticket.id, "En cours")}>
                <Button size="sm" variant="ghost" type="submit">En cours</Button>
              </form>
            )}
            {ticket.statut !== "Résolu" && (
              <form action={updateTicketStatut.bind(null, ticket.id, "Résolu")}>
                <Button size="sm" variant="secondary" type="submit">Résolu</Button>
              </form>
            )}
          </div>
        </div>

        {iaDisponible && !ticket.patientId && (
          <p className="text-xs italic text-muted">
            Pas de patient lié à ce ticket — la réponse IA n&rsquo;est proposée que pour les tickets rattachés à un patient.
          </p>
        )}

        {iaDisponible && ticket.patientId && !envoyee && brouillon === null && (
          <form action={genFormAction}>
            <input type="hidden" name="ticketId" value={ticket.id} />
            <Button type="submit" size="sm" variant="outline" disabled={genPending}>
              <Sparkles className="h-3.5 w-3.5" />
              {genPending ? "Génération…" : "Répondre avec l'IA"}
            </Button>
            {genState.error && <p className="mt-1.5 text-sm text-danger">{genState.error}</p>}
          </form>
        )}

        {brouillon !== null && !envoyee && (
          <div className="flex flex-col gap-3 rounded-[var(--radius-sm)] border border-dashed border-primary p-3">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-primary">
              <Sparkles className="h-3.5 w-3.5" />
              Proposition de l&rsquo;IA — à valider
            </div>
            <Textarea value={brouillon} onChange={(e) => setBrouillon(e.target.value)} rows={6} />
            <p className="text-xs text-muted">
              S&rsquo;appuie sur le profil du patient et le message du ticket, sans rien inventer. Rien n&rsquo;est
              envoyé tant que tu ne cliques pas sur &laquo;&nbsp;Envoyer au patient&nbsp;&raquo;.
            </p>
            <form action={sendFormAction} className="flex flex-wrap items-center gap-2">
              <input type="hidden" name="ticketId" value={ticket.id} />
              <input type="hidden" name="texte" value={brouillon} />
              <Button type="submit" size="sm" disabled={sendPending}>
                {sendPending ? "Envoi…" : "Envoyer au patient"}
              </Button>
              <Button type="button" size="sm" variant="ghost" onClick={() => setBrouillon(null)}>
                Ignorer
              </Button>
            </form>
            {sendState.error && <p className="text-sm text-danger">{sendState.error}</p>}
          </div>
        )}

        {envoyee && (
          <div className="flex items-center gap-2 rounded-[var(--radius-sm)] bg-success/10 px-3 py-2">
            <CheckCircle2 className="h-4 w-4 shrink-0 text-success" />
            <p className="text-sm font-medium text-success">
              Réponse envoyée{ticket.reponseEnvoyeeAt && ` le ${formatDateHeureParis(ticket.reponseEnvoyeeAt)}`} — consultable dans son espace patient (et par email s&rsquo;il en a renseigné un).
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function TicketList({ tickets, iaDisponible }: { tickets: Ticket[]; iaDisponible: boolean }) {
  if (tickets.length === 0) {
    return <p className="text-sm text-muted">Aucun ticket SAV pour le moment.</p>;
  }

  return (
    <div className="flex flex-col gap-3">
      {tickets.map((t) => (
        <TicketCard key={t.id} ticket={t} iaDisponible={iaDisponible} />
      ))}
    </div>
  );
}
