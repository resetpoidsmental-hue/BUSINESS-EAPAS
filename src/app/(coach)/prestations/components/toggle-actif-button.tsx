"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { toggleActifPrestationAction } from "../actions";

export function ToggleActifButton({ prestationId, actif }: { prestationId: string; actif: boolean }) {
  const [pending, startTransition] = useTransition();

  return (
    <Button
      type="button"
      size="sm"
      variant="ghost"
      disabled={pending}
      onClick={() => startTransition(() => toggleActifPrestationAction(prestationId, !actif))}
    >
      {actif ? "Désactiver" : "Réactiver"}
    </Button>
  );
}
