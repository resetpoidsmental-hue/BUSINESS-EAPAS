"use client";

import { useActionState } from "react";
import { login, setupAccount, type ActionState } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const initialState: ActionState = {};

export function LoginForm() {
  const [state, formAction, pending] = useActionState(login, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="email">Email</Label>
        <Input id="email" name="email" type="email" autoComplete="email" required placeholder="toi@exemple.fr" />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="password">Mot de passe</Label>
        <Input id="password" name="password" type="password" autoComplete="current-password" required />
      </div>
      {state.error && <p className="text-sm text-danger">{state.error}</p>}
      <Button type="submit" disabled={pending} className="mt-2">
        {pending ? "Connexion…" : "Se connecter"}
      </Button>
    </form>
  );
}

export function SetupForm() {
  const [state, formAction, pending] = useActionState(setupAccount, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="nom">Ton nom</Label>
        <Input id="nom" name="nom" required placeholder="Jean Dupont" />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="email">Email</Label>
        <Input id="email" name="email" type="email" autoComplete="email" required placeholder="toi@exemple.fr" />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="password">Mot de passe (8 caractères min.)</Label>
        <Input id="password" name="password" type="password" autoComplete="new-password" required minLength={8} />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="passwordConfirm">Confirmer le mot de passe</Label>
        <Input id="passwordConfirm" name="passwordConfirm" type="password" autoComplete="new-password" required minLength={8} />
      </div>
      {state.error && <p className="text-sm text-danger">{state.error}</p>}
      <Button type="submit" disabled={pending} className="mt-2">
        {pending ? "Création…" : "Créer mon compte"}
      </Button>
    </form>
  );
}
