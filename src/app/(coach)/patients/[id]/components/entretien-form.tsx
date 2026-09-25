"use client";

import { useActionState } from "react";
import { addEntretien, type ActionState } from "../../actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const initialState: ActionState = {};

function Field({ label, name, script }: { label: string; name: string; script?: string }) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={name}>{label}</Label>
      {script && <p className="text-xs italic text-muted">« {script} »</p>}
      <Textarea id={name} name={name} rows={2} />
    </div>
  );
}

export function EntretienForm({ patientId }: { patientId: string }) {
  const action = addEntretien.bind(null, patientId);
  const [state, formAction, pending] = useActionState(action, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-8">
      <section className="flex flex-col gap-4">
        <h3 className="text-sm font-semibold text-primary">A. Accueil et mise en confiance</h3>
        <Field
          name="ressentiDemarrage"
          label="Ressenti à l'idée de démarrer"
          script="Comment vous sentez-vous à l'idée de démarrer cet accompagnement aujourd'hui ?"
        />
        <Field
          name="experienceAnterieure"
          label="Expérience antérieure d'activité encadrée"
          script="Avez-vous déjà eu une expérience, positive ou négative, avec une activité physique encadrée ?"
        />
      </section>

      <section className="flex flex-col gap-4">
        <h3 className="text-sm font-semibold text-primary">B. Parcours de vie et de santé</h3>
        <Field name="quotidien" label="Quotidien actuel (activités, rythme, entourage)" />
        <Field name="depuisQuand" label="Depuis quand la situation a changé son rapport au mouvement" />
        <Field name="prescritConseillePar" label="Ce qui a été prescrit / conseillé, et par qui" />
      </section>

      <section className="flex flex-col gap-4">
        <h3 className="text-sm font-semibold text-primary">C. Motivations et représentation de l&apos;AP</h3>
        <Field name="declencheur" label="Déclencheur de la démarche" script="Qu'est-ce qui vous a décidé à venir aujourd'hui ?" />
        <Field name="representationAP" label="Représentation de l'activité physique (contrainte / plaisir / inconnue)" />
        <Field name="souvenirPositif" label="Souvenir de mouvement qui a fait du bien" />
      </section>

      <section className="flex flex-col gap-4">
        <h3 className="text-sm font-semibold text-primary">D. Objectifs, dans les mots du patient</h3>
        <Field
          name="objectifPatientMots"
          label="Objectif exprimé (ses mots)"
          script="Si dans 3 mois vous étiez satisfait(e), qu'est-ce qui aurait changé ?"
        />
        <Field name="gesteAPreserver" label="Geste ou activité du quotidien à retrouver/préserver" />
      </section>

      <section className="flex flex-col gap-4">
        <h3 className="text-sm font-semibold text-primary">E. Limitations et cadre médical</h3>
        <Field name="limitationsMedecin" label="Recommandations / limitations du médecin ou kiné" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="evaDouleur">Douleur actuelle (EVA /10)</Label>
            <Input id="evaDouleur" name="evaDouleur" type="number" min={0} max={10} />
          </div>
          <label className="flex items-center gap-2 pt-6 text-sm">
            <input type="checkbox" name="chutes12Mois" className="h-4 w-4 rounded border-border" />
            Chute(s) dans les 12 derniers mois
          </label>
        </div>
        <Field name="douleursApprehensions" label="Douleurs, appréhensions, gestes à éviter" />
      </section>

      <section className="flex flex-col gap-4">
        <h3 className="text-sm font-semibold text-primary">F. Attentes, craintes et freins</h3>
        <Field name="attentesCoach" label="Attentes vis-à-vis de l'accompagnement" />
        <Field name="freinsPotentiels" label="Freins potentiels (temps, fatigue, motivation, transport…)" />
      </section>

      <section className="flex flex-col gap-4">
        <h3 className="text-sm font-semibold text-primary">G. Clôture et engagement mutuel</h3>
        <Field name="modaliteCommunication" label="Modalités de communication entre les séances" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="tempsAssisParJour">Temps assis / jour (min)</Label>
            <Input id="tempsAssisParJour" name="tempsAssisParJour" type="number" min={0} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="activitesActuelles">Activités actuelles</Label>
            <Input id="activitesActuelles" name="activitesActuelles" />
          </div>
        </div>
      </section>

      {state.error && <p className="text-sm text-danger">{state.error}</p>}
      {state.success && <p className="text-sm text-success">{state.success}</p>}

      <div className="flex justify-end">
        <Button type="submit" disabled={pending}>
          {pending ? "Enregistrement…" : "Enregistrer l'entretien"}
        </Button>
      </div>
    </form>
  );
}
