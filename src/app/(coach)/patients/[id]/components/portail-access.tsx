"use client";

import { useState, useTransition } from "react";
import { generatePatientAccess, revokePatientAccess } from "../../actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { KeyRound, Copy, Check } from "lucide-react";

export function PortailAccess({
  patientId,
  active,
  portalEnabled,
}: {
  patientId: string;
  active: boolean;
  portalEnabled: boolean;
}) {
  const [code, setCode] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [pending, startTransition] = useTransition();

  if (!portalEnabled) {
    return (
      <Card>
        <CardContent className="p-5 text-sm text-muted">
          Le portail patient n&apos;est pas activé. Active-le dans <strong>Réglages</strong> pour générer des codes
          d&apos;accès.
        </CardContent>
      </Card>
    );
  }

  function generate() {
    startTransition(async () => {
      const c = await generatePatientAccess(patientId);
      setCode(c);
      setCopied(false);
    });
  }

  function revoke() {
    startTransition(async () => {
      await revokePatientAccess(patientId);
      setCode(null);
    });
  }

  function copy() {
    if (!code) return;
    navigator.clipboard?.writeText(code).then(() => setCopied(true));
  }

  return (
    <Card>
      <CardContent className="flex flex-col gap-4 p-5">
        <div className="flex items-center gap-2">
          <KeyRound className="h-4 w-4 text-primary" />
          <p className="text-sm font-semibold">Accès au portail patient</p>
          <Badge variant={active ? "success" : "muted"}>{active ? "Actif" : "Aucun accès"}</Badge>
        </div>
        <p className="text-sm text-muted">
          Génère un code d&apos;accès personnel à transmettre au patient. Il pourra l&apos;utiliser sur{" "}
          <code className="rounded bg-surface-muted px-1">/portail/connexion</code> pour consulter son programme, ses
          bilans et ses factures.
        </p>

        {code && (
          <div className="flex items-center gap-2 rounded-[var(--radius-sm)] border border-primary/30 bg-primary-soft p-3">
            <span className="flex-1 text-center text-xl font-mono tracking-widest text-primary">{code}</span>
            <Button size="icon" variant="ghost" onClick={copy} type="button">
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            </Button>
          </div>
        )}

        <div className="flex gap-2">
          <Button type="button" onClick={generate} disabled={pending}>
            {active ? "Régénérer un code" : "Générer un code d'accès"}
          </Button>
          {active && (
            <Button type="button" variant="secondary" onClick={revoke} disabled={pending}>
              Révoquer l&apos;accès
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
