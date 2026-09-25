"use client";

import { useState, useTransition } from "react";
import { togglePortal } from "./actions";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent } from "@/components/ui/card";
import { Link2 } from "lucide-react";

export function PortalToggle({ initial }: { initial: boolean }) {
  const [enabled, setEnabled] = useState(initial);
  const [pending, startTransition] = useTransition();

  return (
    <Card>
      <CardContent className="flex items-center justify-between gap-4 p-5">
        <div className="flex items-start gap-3">
          <Link2 className="mt-0.5 h-5 w-5 text-primary" />
          <div>
            <p className="text-sm font-semibold">Portail patient</p>
            <p className="text-sm text-muted">
              Une fois activé, tu pourras générer un code d&apos;accès personnel pour chaque patient depuis sa fiche.
              Il pourra alors consulter son programme, ses bilans et ses factures sur{" "}
              <code className="rounded bg-surface-muted px-1">/portail/connexion</code>.
            </p>
          </div>
        </div>
        <Switch
          checked={enabled}
          disabled={pending}
          onCheckedChange={(v) => {
            setEnabled(v);
            startTransition(() => togglePortal(v));
          }}
        />
      </CardContent>
    </Card>
  );
}
