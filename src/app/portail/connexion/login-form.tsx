"use client";

import { useActionState } from "react";
import { loginPatient, type PortalActionState } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const initialState: PortalActionState = {};

export function PatientLoginForm() {
  const [state, formAction, pending] = useActionState(loginPatient, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="code">Code d&apos;accès</Label>
        <Input
          id="code"
          name="code"
          required
          placeholder="XXXX-XXXX"
          autoComplete="off"
          className="text-center text-lg tracking-widest uppercase"
        />
        <p className="text-xs text-muted">Ce code t&apos;a été communiqué par ton coach.</p>
      </div>
      {state.error && <p className="text-sm text-danger">{state.error}</p>}
      <Button type="submit" disabled={pending} className="mt-2">
        {pending ? "Connexion…" : "Accéder à mon espace"}
      </Button>
    </form>
  );
}
