"use client";

import { useActionState } from "react";
import { updatePatient, deletePatient, type ActionState } from "../../actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const initialState: ActionState = {};

interface PatientData {
  id: string;
  nom: string;
  prenom: string;
  dateNaissance: string | null;
  genre: string | null;
  telephone: string | null;
  email: string | null;
  adresse: string | null;
  metier: string;
  pathologieALD: string | null;
  medecinPrescripteur: string | null;
  numPrescription: string | null;
  datePrescription: string | null;
  dateBilanInitial: string | null;
  objectifPrincipal: string | null;
  limitations: string | null;
  statutSuivi: string;
  consentementRGPD: boolean;
  notes: string | null;
}

export function IdentiteForm({ patient }: { patient: PatientData }) {
  const action = updatePatient.bind(null, patient.id);
  const [state, formAction, pending] = useActionState(action, initialState);

  return (
    <div className="flex flex-col gap-6">
    <form action={formAction} className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Identité</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Nom" name="nom" defaultValue={patient.nom} required />
          <Field label="Prénom" name="prenom" defaultValue={patient.prenom} required />
          <Field label="Date de naissance" name="dateNaissance" type="date" defaultValue={patient.dateNaissance ?? ""} />
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="genre">Genre</Label>
            <select id="genre" name="genre" defaultValue={patient.genre ?? ""} className="h-10 rounded-[var(--radius-sm)] border border-border bg-surface px-3 text-sm">
              <option value="">—</option>
              <option value="H">Homme</option>
              <option value="F">Femme</option>
              <option value="Autre">Autre</option>
            </select>
          </div>
          <Field label="Téléphone" name="telephone" defaultValue={patient.telephone ?? ""} />
          <Field label="Email" name="email" type="email" defaultValue={patient.email ?? ""} />
          <div className="sm:col-span-2">
            <Field label="Adresse" name="adresse" defaultValue={patient.adresse ?? ""} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="metier">Métier suivi</Label>
            <select id="metier" name="metier" defaultValue={patient.metier} className="h-10 rounded-[var(--radius-sm)] border border-border bg-surface px-3 text-sm">
              <option value="EAPAS">EAPAS</option>
              <option value="Nutrition">Nutrition</option>
              <option value="EAPAS+Nutrition">EAPAS + Nutrition</option>
            </select>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="statutSuivi">Statut du suivi</Label>
            <select id="statutSuivi" name="statutSuivi" defaultValue={patient.statutSuivi} className="h-10 rounded-[var(--radius-sm)] border border-border bg-surface px-3 text-sm">
              <option value="Bilan initial à faire">Bilan initial à faire</option>
              <option value="Suivi en cours">Suivi en cours</option>
              <option value="Bilan final fait">Bilan final fait</option>
              <option value="Suivi terminé">Suivi terminé</option>
            </select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Cadre médical & prescription</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Pathologie / ALD" name="pathologieALD" defaultValue={patient.pathologieALD ?? ""} />
          <Field label="Médecin prescripteur" name="medecinPrescripteur" defaultValue={patient.medecinPrescripteur ?? ""} />
          <Field label="N° de prescription" name="numPrescription" defaultValue={patient.numPrescription ?? ""} />
          <Field label="Date de la prescription" name="datePrescription" type="date" defaultValue={patient.datePrescription ?? ""} />
          <Field label="Date du bilan initial" name="dateBilanInitial" type="date" defaultValue={patient.dateBilanInitial ?? ""} />
          <div className="sm:col-span-2 flex flex-col gap-1.5">
            <Label htmlFor="limitations">Limitations / contre-indications</Label>
            <Textarea id="limitations" name="limitations" rows={2} defaultValue={patient.limitations ?? ""} />
          </div>
          <div className="sm:col-span-2 flex flex-col gap-1.5">
            <Label htmlFor="objectifPrincipal">Objectif principal</Label>
            <Textarea id="objectifPrincipal" name="objectifPrincipal" rows={2} defaultValue={patient.objectifPrincipal ?? ""} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>RGPD & notes</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <label className="flex items-start gap-2.5 text-sm">
            <input
              type="checkbox"
              name="consentementRGPD"
              defaultChecked={patient.consentementRGPD}
              className="mt-0.5 h-4 w-4 rounded border-border"
            />
            <span>Consentement éclairé et signé recueilli (RGPD, art. L1110-4 CSP).</span>
          </label>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="notes">Notes libres</Label>
            <Textarea id="notes" name="notes" rows={3} defaultValue={patient.notes ?? ""} />
          </div>
        </CardContent>
      </Card>

      {state.error && <p className="text-sm text-danger">{state.error}</p>}
      {state.success && <p className="text-sm text-success">{state.success}</p>}

      <div className="flex justify-end">
        <Button type="submit" disabled={pending}>
          {pending ? "Enregistrement…" : "Enregistrer les modifications"}
        </Button>
      </div>
    </form>
    <form action={deletePatient.bind(null, patient.id)} className="flex justify-start border-t border-border pt-6">
      <Button type="submit" variant="destructive" size="sm">
        Supprimer le dossier
      </Button>
    </form>
    </div>
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
