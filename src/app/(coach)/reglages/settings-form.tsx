"use client";

import { useActionState } from "react";
import { updateSettings, type ActionState } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

const initialState: ActionState = {};

interface SettingsData {
  nomEntreprise: string;
  siret: string | null;
  adresse: string | null;
  telephone: string | null;
  email: string | null;
  mentionTVA: string;
  tauxUrssaf: number;
  assuranceRCPro: string | null;
}

export function SettingsForm({ settings }: { settings: SettingsData }) {
  const [state, formAction, pending] = useActionState(updateSettings, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Mon activité</CardTitle>
          <CardDescription>Ces informations apparaissent sur tes devis, contrats et factures.</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Nom / nom commercial" name="nomEntreprise" defaultValue={settings.nomEntreprise} required />
          <Field label="SIRET" name="siret" defaultValue={settings.siret ?? ""} />
          <div className="sm:col-span-2">
            <Field label="Adresse" name="adresse" defaultValue={settings.adresse ?? ""} />
          </div>
          <Field label="Téléphone" name="telephone" defaultValue={settings.telephone ?? ""} />
          <Field label="Email" name="email" type="email" defaultValue={settings.email ?? ""} />
          <Field label="Assurance RC Pro" name="assuranceRCPro" defaultValue={settings.assuranceRCPro ?? ""} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Facturation & URSSAF</CardTitle>
          <CardDescription>Auto-entrepreneur : franchise en base de TVA et estimation des cotisations.</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Mention TVA" name="mentionTVA" defaultValue={settings.mentionTVA} />
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="tauxUrssaf">Taux de cotisation URSSAF estimé (%)</Label>
            <Input id="tauxUrssaf" name="tauxUrssaf" type="number" step="0.1" defaultValue={settings.tauxUrssaf} />
          </div>
        </CardContent>
      </Card>

      {state.error && <p className="text-sm text-danger">{state.error}</p>}
      {state.success && <p className="text-sm text-success">{state.success}</p>}

      <div className="flex justify-end">
        <Button type="submit" disabled={pending}>
          {pending ? "Enregistrement…" : "Enregistrer"}
        </Button>
      </div>
    </form>
  );
}

function Field({
  label,
  name,
  type = "text",
  defaultValue,
  required,
}: {
  label: string;
  name: string;
  type?: string;
  defaultValue?: string;
  required?: boolean;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={name}>
        {label} {required && <span className="text-danger">*</span>}
      </Label>
      <Input id={name} name={name} type={type} defaultValue={defaultValue} required={required} />
    </div>
  );
}
