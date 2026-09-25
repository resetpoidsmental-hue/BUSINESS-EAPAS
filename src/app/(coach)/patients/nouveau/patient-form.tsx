"use client";

import { useActionState } from "react";
import { createPatient, type ActionState } from "../actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const initialState: ActionState = {};

export function NewPatientForm() {
  const [state, formAction, pending] = useActionState(createPatient, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Identité</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Nom" name="nom" required />
          <Field label="Prénom" name="prenom" required />
          <Field label="Date de naissance" name="dateNaissance" type="date" />
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="genre">Genre</Label>
            <select id="genre" name="genre" className="h-10 rounded-[var(--radius-sm)] border border-border bg-surface px-3 text-sm">
              <option value="">—</option>
              <option value="H">Homme</option>
              <option value="F">Femme</option>
              <option value="Autre">Autre</option>
            </select>
          </div>
          <Field label="Téléphone" name="telephone" />
          <Field label="Email" name="email" type="email" />
          <div className="sm:col-span-2">
            <Field label="Adresse" name="adresse" />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="metier">Métier suivi</Label>
            <select id="metier" name="metier" defaultValue="EAPAS" className="h-10 rounded-[var(--radius-sm)] border border-border bg-surface px-3 text-sm">
              <option value="EAPAS">EAPAS</option>
              <option value="Nutrition">Nutrition</option>
              <option value="EAPAS+Nutrition">EAPAS + Nutrition</option>
            </select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Cadre médical & prescription</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Pathologie / ALD" name="pathologieALD" />
          <Field label="Médecin prescripteur" name="medecinPrescripteur" />
          <Field label="N° de prescription" name="numPrescription" />
          <Field label="Date de la prescription" name="datePrescription" type="date" />
          <div className="sm:col-span-2 flex flex-col gap-1.5">
            <Label htmlFor="limitations">Limitations / contre-indications (déclaration exacte du prescripteur)</Label>
            <Textarea id="limitations" name="limitations" rows={2} />
          </div>
          <div className="sm:col-span-2 flex flex-col gap-1.5">
            <Label htmlFor="objectifPrincipal">Objectif principal exprimé</Label>
            <Textarea id="objectifPrincipal" name="objectifPrincipal" rows={2} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>RGPD & notes</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <label className="flex items-start gap-2.5 text-sm">
            <input type="checkbox" name="consentementRGPD" className="mt-0.5 h-4 w-4 rounded border-border" />
            <span>
              Le patient a donné son <strong>consentement éclairé et signé</strong> pour la pratique et le partage
              d&apos;informations avec l&apos;équipe pluriprofessionnelle (art. L1110-4 CSP).
            </span>
          </label>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="notes">Notes libres</Label>
            <Textarea id="notes" name="notes" rows={3} />
          </div>
        </CardContent>
      </Card>

      {state.error && <p className="text-sm text-danger">{state.error}</p>}

      <div className="flex justify-end gap-3">
        <Button type="submit" disabled={pending} size="lg">
          {pending ? "Création…" : "Créer le dossier"}
        </Button>
      </div>
    </form>
  );
}

function Field({
  label,
  name,
  type = "text",
  required,
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={name}>
        {label} {required && <span className="text-danger">*</span>}
      </Label>
      <Input id={name} name={name} type={type} required={required} />
    </div>
  );
}
